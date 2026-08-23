#!/usr/bin/env node
// scripts/buyerAgent.js
//
// Autonomous AI Buyer Agent — SafeAgent Gateway Step 7 (Gemini Edition)
//
// Uses Google Generative AI SDK (v0.24.x) with native function calling to simulate
// a real AI procurement agent exercising every routing tier and failure mode.
//
// Division of responsibility (per Part 10-12 of the master spec):
//   LLM owns  → language: natural-language reasons, upsell decisions, final report
//   Gateway owns → math: pricing lookup, policy evaluation, tier routing, Razorpay
//                  (THE LLM NEVER CALCULATES PRICING)
//
// DEMO SEQUENCE (all 6 tiers/failure modes):
//   1. browse_catalog                    — discover real prices
//   2. request_purchase cable  qty:1     → AUTO_APPROVED      (₹349 < ₹500)
//   3. request_purchase keyboard qty:1   → GATED_1_CLICK      (₹2,800)
//      └─ if upsellOffer returned        → request_purchase with upsellRef
//   4. request_purchase headset qty:1    → FAILED             (stock = 0)
//   5. request_purchase monitor qty:2    → BLOCKED            (₹48,000 > ₹30,000 ceiling)
//   6. request_purchase monitor qty:1    → GATED_2FA          (₹24,000)
//
// Run:
//   npm run agent         (from backend/)
//   node scripts/buyerAgent.js

import 'dotenv/config';
import { randomUUID } from 'crypto';
import {
  GoogleGenerativeAI,
  FunctionCallingMode,
  SchemaType,
} from '@google/generative-ai';

// ── Config ────────────────────────────────────────────────────────────────────────────────
const BASE_URL   = `http://localhost:${process.env.PORT || 5000}`;
const AGENT_KEY  = process.env.AGENT_DEMO_KEY || 'agentkey_demo_alpha';
const MODEL_NAME = process.env.GEMINI_MODEL   || 'gemini-3.6-flash';

// ── Preflight check ───────────────────────────────────────────────────────────────────────
if (!process.env.GEMINI_API_KEY) {
  console.error('\n[AGENT] ❌  GEMINI_API_KEY is not set in .env.');
  console.error('         Add GEMINI_API_KEY=<your-key> and re-run.\n');
  process.exit(1);
}

// ── ANSI colours ──────────────────────────────────────────────────────────────────────────
const C = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  green:   '\x1b[32m',
  yellow:  '\x1b[33m',
  red:     '\x1b[31m',
  cyan:    '\x1b[36m',
  magenta: '\x1b[35m',
  orange:  '\x1b[38;5;214m',
  white:   '\x1b[97m',
};

function ts() {
  return new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false });
}
function log(colour, tag, msg) {
  console.log(`${C.dim}${ts()}${C.reset} ${colour}${C.bold}[${tag}]${C.reset} ${msg}`);
}

// ── Transaction ledger ────────────────────────────────────────────────────────────────────
const ledger = [];

// ── Helpers ───────────────────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** HTTP helper with 429 back-off. Rate limiter = 5 req/min per agentId. */
async function apiFetch(url, options = {}, attempt = 0) {
  const resp = await fetch(url, options);
  if (resp.status === 429 && attempt < 3) {
    const waitSec = 65;
    log(C.orange, 'RATE-LIMIT', `429 received — waiting ${waitSec}s before retry (attempt ${attempt + 1}/3)…`);
    await sleep(waitSec * 1000);
    return apiFetch(url, options, attempt + 1);
  }
  const json = await resp.json();
  return { status: resp.status, ok: resp.ok, body: json };
}

// ── Tool implementations (called by the agentic loop) ─────────────────────────────────────
async function execBrowseCatalog() {
  log(C.cyan, 'TOOL', 'browse_catalog → GET /api/catalog');
  const { body } = await apiFetch(`${BASE_URL}/api/catalog`, {
    headers: { 'x-agent-key': AGENT_KEY },
  });
  return body;
}

async function execRequestPurchase({ sku, qty, maxBudget, reason, upsellRef }) {
  // idempotencyKey is generated deterministically in the SCRIPT, not by the LLM.
  const idempotencyKey = randomUUID();

  const payload = {
    sku,
    qty: Number(qty),
    maxBudget: Number(maxBudget),
    reason,
    idempotencyKey,
  };
  if (upsellRef) payload.upsellRef = upsellRef;

  log(C.yellow, 'TOOL', `request_purchase → POST /api/checkout/request`);
  log(C.dim,    '    ', `sku=${sku}  qty=${qty}  maxBudget=₹${maxBudget}${upsellRef ? `  upsellRef=${upsellRef}` : ''}`);
  log(C.dim,    '    ', `reason="${reason.slice(0, 70)}${reason.length > 70 ? '…' : ''}"`);

  const { status, body } = await apiFetch(`${BASE_URL}/api/checkout/request`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'x-agent-key': AGENT_KEY },
    body:    JSON.stringify(payload),
  });

  // Tier-aware result logging
  const tierColour = {
    AUTO_APPROVED:         C.green,
    ORDER_CREATED:         C.green,
    GATEWAY_DEGRADED:      C.yellow,
    GATED_1_CLICK:         C.yellow,
    GATED_2FA:             C.orange,
    BLOCKED:               C.red,
    FAILED:                C.red,
    DENIED:                C.magenta,
    ORDER_PENDING_CONFIRM: C.cyan,
  }[body.status] ?? C.white;

  log(tierColour, body.status ?? `HTTP-${status}`,
    `sku=${sku}  qty=${qty}  amount=₹${body.amount ?? '?'}` +
    (body.blockReason     ? `  blockReason=${body.blockReason}`           : '') +
    (body.razorpayOrderId ? `  razorpayOrderId=${body.razorpayOrderId}`   : '')
  );

  if (body.upsellOffer) {
    log(C.magenta, 'UPSELL',
      `offerId=${body.upsellOffer.offerId}  sku=${body.upsellOffer.sku}  price=₹${body.upsellOffer.price}`);
    log(C.dim, '      ', `"${body.upsellOffer.pitch}"`);
  }
  if (body.explanation) {
    log(C.dim, 'POLICY', body.explanation);
  }
  if (body.alternatives?.length) {
    log(C.cyan, 'ALTS',
      `${body.alternatives.length} in-stock alternatives: ${body.alternatives.map(a => a.sku).join(', ')}`);
  }

  // Record in ledger for the final summary table
  ledger.push({
    sku,
    qty:         Number(qty),
    amount:      body.amount,
    status:      body.status,
    blockReason: body.blockReason ?? null,
    auditId:     body.auditId ?? null,
    upsellRef:   upsellRef ?? null,
    offerId:     body.upsellOffer?.offerId ?? null,
  });

  return body;
}

// ── Gemini Function Declarations ──────────────────────────────────────────────────────────
// Matching exactly the tool signatures from Part 10-12 of the master spec.
// SchemaType values in SDK v0.24.x are lowercase: "object", "string", "integer", "number".

const FUNCTION_DECLARATIONS = [
  {
    name:        'browse_catalog',
    description:
      'Retrieve the full product catalog with real-time prices and stock levels. ' +
      'ALWAYS call this first — never assume prices. ' +
      'The gateway fetches authoritative prices from the database; any price you invent is ignored.',
    parameters: {
      type:       SchemaType.OBJECT,
      properties: {},
    },
  },
  {
    name:        'request_purchase',
    description:
      'Submit a purchase request to the SafeAgent Gateway. The gateway fetches the real ' +
      'price by sku and enforces spending policy. maxBudget is advisory only — never used ' +
      'for pricing. Returns status: AUTO_APPROVED | GATED_1_CLICK | GATED_2FA | BLOCKED | FAILED. ' +
      'If a upsellOffer is returned (offerId + sku + pitch), you MUST accept it by calling ' +
      'request_purchase again with that sku and upsellRef = the offerId.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        sku: {
          type:        SchemaType.STRING,
          description: 'Exact SKU from browse_catalog. Do not abbreviate or guess.',
        },
        qty: {
          type:        SchemaType.INTEGER,
          description: 'Quantity to purchase. Must be a positive integer.',
        },
        maxBudget: {
          type:        SchemaType.NUMBER,
          description:
            'Advisory maximum budget in INR. Used only to compute upsell headroom. ' +
            'Not used for price validation. Set to a sensible value (e.g. 5000 or 30000).',
        },
        reason: {
          type:        SchemaType.STRING,
          description:
            'Your natural-language justification for this purchase (MINIMUM 10 characters). ' +
            'Stored in the immutable audit log for human review.',
        },
        upsellRef: {
          type:        SchemaType.STRING,
          description:
            'Optional. If accepting a upsell, set this to the offerId from the prior ' +
            'request_purchase response upsellOffer object.',
        },
      },
      required: ['sku', 'qty', 'maxBudget', 'reason'],
    },
  },
];

// ── System Instruction ────────────────────────────────────────────────────────────────────
const SYSTEM_INSTRUCTION = `You are an autonomous AI procurement agent integrated with the SafeAgent Gateway.

Your mission: demonstrate every routing tier and failure mode by executing these steps IN ORDER:

STEP 1 — browse_catalog
  Call browse_catalog. Memorise the prices — never invent them.

STEP 2 — AUTO_APPROVED path
  Buy 1x "Braided 65W USB-C Cable" (sku: prod_usb_c_cable). Expected: AUTO_APPROVED.

STEP 3 — GATED_1_CLICK + Upsell accept
  Buy 1x "RGB Mechanical Keyboard (TKL)" (sku: prod_mech_keyboard). Expected: GATED_1_CLICK.
  If the response contains a upsellOffer, IMMEDIATELY call request_purchase for that sku
  with upsellRef set to the offerId. This proves the upsell-accept flow works.

STEP 4 — FAILED path (out of stock)
  Buy 1x "Noise-Canceling Headset" (sku: prod_nc_headset). Expected: FAILED (stock = 0).

STEP 5 — BLOCKED path (per-transaction ceiling)
  Buy 2x "27-inch 4K Monitor" (sku: prod_4k_monitor, qty: 2). Expected: BLOCKED.
  Two monitors = ₹48,000 which exceeds the maxPerTx ceiling of ₹30,000.

STEP 6 — GATED_2FA path
  Buy 1x "27-inch 4K Monitor" (sku: prod_4k_monitor, qty: 1). Expected: GATED_2FA.

STEP 7 — Final report
  Write a clear plain-text summary of every transaction: sku, status, amount, meaning.

RULES:
• Execute every step. Do not skip any.
• Do not calculate prices — always use prices returned by browse_catalog.
• Write a specific, natural-language reason (>10 chars) for every purchase call.
• After BLOCKED or FAILED, note the outcome and continue to the next step.
• maxBudget should be 5000 for accessories/cables and 30000 for monitors.`;

// ── Agentic Loop ──────────────────────────────────────────────────────────────────────────
async function runAgent() {
  console.log('\n' + '═'.repeat(72));
  console.log(`${C.bold}${C.cyan}  SafeAgent Gateway — Autonomous Buyer Agent (Gemini)${C.reset}`);
  console.log(`  Model: ${MODEL_NAME}  |  Gateway: ${BASE_URL}  |  Agent: ${AGENT_KEY}`);
  console.log('═'.repeat(72) + '\n');

  log(C.cyan, 'STATE', 'IDLE → INTENT_PARSED — initialising Gemini client');

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: SYSTEM_INSTRUCTION,
    tools: [{ functionDeclarations: FUNCTION_DECLARATIONS }],
    toolConfig: { functionCallingConfig: { mode: FunctionCallingMode.AUTO } },
    generationConfig: {
      temperature: 0.2, // deterministic tool selection, natural-language reasons
    },
  });

  log(C.cyan, 'STATE', 'POLICY_EVALUATION — sending initial mission to Gemini');

  const contents = [
    {
      role: 'user',
      parts: [{ text: 'Begin the procurement sequence now. Execute all 6 steps in order, then write the final report.' }]
    }
  ];

  let loopCount = 0;
  const MAX_LOOPS = 40; // safety ceiling against runaway loops

  while (loopCount < MAX_LOOPS) {
    loopCount++;
    
    let result;
    try {
      result = await model.generateContent({ contents });
    } catch (err) {
      log(C.red, 'ERROR', `generateContent failed: ${err.message}`);
      throw err;
    }

    const response = result.response;
    const candidate = response.candidates?.[0];
    if (!candidate || !candidate.content) {
      log(C.red, 'ERROR', 'No content returned in response candidate.');
      break;
    }

    // Append model's message to history
    contents.push(candidate.content);

    // ── Check for function calls ─────────────────────────────────────────────────────
    const functionCalls = response.functionCalls?.() ?? [];

    if (functionCalls.length > 0) {
      log(C.cyan, `LOOP-${loopCount}`,
        `Gemini issued ${functionCalls.length} function call(s): ${functionCalls.map(c => c.name).join(', ')}`);

      // Build function response parts — one per call
      const responseParts = [];

      for (const call of functionCalls) {
        console.log(); // breathing room between calls

        let toolResult;
        try {
          if (call.name === 'browse_catalog') {
            toolResult = await execBrowseCatalog();
          } else if (call.name === 'request_purchase') {
            toolResult = await execRequestPurchase(call.args ?? {});
          } else {
            log(C.red, 'ERROR', `Unknown function: ${call.name}`);
            toolResult = { error: `Unknown function: ${call.name}` };
          }
        } catch (err) {
          log(C.red, 'ERROR', `${call.name} threw: ${err.message}`);
          toolResult = { error: err.message };
        }

        // Package result in Gemini's functionResponse part format
        responseParts.push({
          functionResponse: {
            name:     call.name,
            response: { result: toolResult },
          },
        });
      }

      // Feed all function results back to Gemini in one turn
      // gemini-3.6-flash rejects role: 'function', so we use 'user'
      contents.push({ role: 'user', parts: responseParts });
      continue;
    }

    // ── No function calls → agent is done ────────────────────────────────────────────
    const text = response.text?.();
    log(C.cyan, 'STATE', 'IDLE — agent completed all steps');

    if (text) {
      console.log('\n' + '─'.repeat(72));
      console.log(`${C.bold}${C.white}  Agent Final Report${C.reset}`);
      console.log('─'.repeat(72));
      console.log(text);
    }
    break;
  }

  if (loopCount >= MAX_LOOPS) {
    log(C.red, 'WARN', `Reached MAX_LOOPS (${MAX_LOOPS}). Possible infinite loop. Aborting.`);
  }

  printSummaryTable();
}

// ── Summary Table ─────────────────────────────────────────────────────────────────────────
function printSummaryTable() {
  if (ledger.length === 0) return;

  console.log('\n' + '═'.repeat(72));
  console.log(`${C.bold}${C.cyan}  Transaction Ledger (this session)${C.reset}`);
  console.log('─'.repeat(72));
  console.log(
    `${'SKU'.padEnd(22)} ${'QTY'.padEnd(4)} ${'AMT'.padEnd(10)} ${'STATUS'.padEnd(20)} NOTES`
  );
  console.log('─'.repeat(72));

  for (const tx of ledger) {
    const colour = {
      AUTO_APPROVED:    C.green,
      ORDER_CREATED:    C.green,
      GATEWAY_DEGRADED: C.yellow,
      GATED_1_CLICK:    C.yellow,
      GATED_2FA:        C.orange,
      BLOCKED:          C.red,
      FAILED:           C.red,
      DENIED:           C.magenta,
    }[tx.status] ?? C.white;

    const notes = [
      tx.blockReason ? `block=${tx.blockReason}` : '',
      tx.upsellRef   ? '↑upsell-accepted'          : '',
      tx.offerId     ? '↑offer-issued'              : '',
    ].filter(Boolean).join('  ');

    console.log(
      `${(tx.sku ?? '?').padEnd(22)} ` +
      `${String(tx.qty ?? '?').padEnd(4)} ` +
      `${('₹' + (tx.amount ?? '?')).padEnd(10)} ` +
      `${colour}${(tx.status ?? '?').padEnd(20)}${C.reset} ` +
      `${C.dim}${notes}${C.reset}`
    );
  }

  console.log('─'.repeat(72));

  const total         = ledger.length;
  const autoApp       = ledger.filter(t => t.status === 'AUTO_APPROVED').length;
  const gated1        = ledger.filter(t => t.status === 'GATED_1_CLICK').length;
  const gated2        = ledger.filter(t => t.status === 'GATED_2FA').length;
  const blocked       = ledger.filter(t => t.status === 'BLOCKED').length;
  const failed        = ledger.filter(t => t.status === 'FAILED').length;
  const gdegraded     = ledger.filter(t => t.status === 'GATEWAY_DEGRADED').length;
  const upsellIssued  = ledger.filter(t => t.offerId).length;
  const upsellTaken   = ledger.filter(t => t.upsellRef).length;

  console.log(
    `${C.bold}  ${total} requests:${C.reset}` +
    ` ${C.green}${autoApp} AUTO${C.reset}` +
    (gdegraded ? ` ${C.yellow}(${gdegraded} GATEWAY_DEGRADED — add real Razorpay keys to see ORDER_CREATED)${C.reset}` : '') +
    ` | ${C.yellow}${gated1} GATED_1${C.reset}` +
    ` | ${C.orange}${gated2} GATED_2FA${C.reset}` +
    ` | ${C.red}${blocked} BLOCKED  ${failed} FAILED${C.reset}`
  );
  if (upsellIssued > 0) {
    const rate = ((upsellTaken / upsellIssued) * 100).toFixed(0);
    console.log(`  Upsell: ${upsellIssued} offered → ${upsellTaken} accepted (${rate}% conversion this session)`);
  }
  console.log('═'.repeat(72) + '\n');
}

// ── Entry Point ───────────────────────────────────────────────────────────────────────────
runAgent().catch((err) => {
  console.error(`\n${C.red}[FATAL]${C.reset}`, err.message ?? err);

  // Helpful hints for common failures
  if (err?.message?.includes('API_KEY') || err?.status === 400) {
    console.error('        Check that GEMINI_API_KEY is valid in .env');
  } else if (err?.message?.includes('model') || err?.message?.includes('404')) {
    console.error(`        Model "${MODEL_NAME}" may not be available.`);
    console.error('        Try: GEMINI_MODEL=gemini-2.5-flash or GEMINI_MODEL=gemini-1.5-flash in .env');
  } else if (err?.message?.includes('fetch') || err?.code === 'ECONNREFUSED') {
    console.error(`        Cannot reach the gateway at ${BASE_URL}. Is "npm run dev" running?`);
  }

  process.exit(1);
});
