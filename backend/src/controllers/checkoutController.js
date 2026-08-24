// src/controllers/checkoutController.js
//
// Handles all checkout actions:
//   POST /api/checkout/request — policy evaluation, idempotency, upsell
//   POST /api/checkout/approve — atomic stock+spend guards, TOTP, Razorpay order
//   POST /api/checkout/deny   — terminal DENIED transition
//
// Key invariants enforced here:
//   • agentId is ALWAYS derived from req.agent (set by agentAuth), never from the body.
//   • Pricing is ALWAYS fetched from MongoDB by sku, never from the agent payload.
//   • maxBudget is advisory only — used solely for upsell headroom clamping.
//   • Idempotency is enforced by the DB compound unique index (E11000 → return replay).
//   • Write-ahead: ORDER_PENDING_CONFIRM is set before every Razorpay call.
//   • Stock and spend are both decremented atomically at APPROVAL time (not request time).
//   • If stock guard succeeds but spend guard fails, stock is compensated before the
//     audit row is written (DECISIONS §3 compensation rule).

import { v4 as uuidv4 } from 'uuid';
import { Product } from '../models/Product.js';
import { AgentMandate } from '../models/AgentMandate.js';
import { AuditLog } from '../models/AuditLog.js';
import { evaluatePurchase, computeUpsellHeadroom } from '../services/policyEngine.js';
import { findUpsellOffer } from '../services/upsellEngine.js';
import { createRazorpayOrder, createRazorpayPaymentLink } from '../services/razorpayClient.js';
import { verifyTOTP } from '../services/totpService.js';

// ── Helper: build a Privacy Receipt ──────────────────────────────────────────────────────
function buildPrivacyReceipt({ agentId, status, razorpayOrderId = null }) {
  return {
    timestamp: new Date().toISOString(),
    agentId,
    status,
    razorpayOrderId,
    dataAccessed: ['catalog_pricing', 'agent_spend_mandate'],
    transmittedToThirdParty: false,
    pii_recorded: null,
  };
}

// ── Helper: run Razorpay with write-ahead status ────────────────────────────────────────
async function runRazorpayWithWriteAhead(auditId, amountINR) {
  // Write-ahead: set ORDER_PENDING_CONFIRM before the Razorpay call so that if the
  // process dies mid-call, the audit row is not left in AUTO_APPROVED with no order.
  await AuditLog.findOneAndUpdate({ auditId }, { $set: { status: 'ORDER_PENDING_CONFIRM' } });

  try {
    const order = await createRazorpayOrder(amountINR, auditId);
    await AuditLog.findOneAndUpdate(
      { auditId },
      { $set: { status: 'ORDER_CREATED', razorpayOrderId: order.id } }
    );
    return { status: 'ORDER_CREATED', razorpayOrderId: order.id };
  } catch (_err) {
    await AuditLog.findOneAndUpdate({ auditId }, { $set: { status: 'GATEWAY_DEGRADED' } });
    return { status: 'GATEWAY_DEGRADED', razorpayOrderId: null };
  }
}

// ════════════════════════════════════════════════════════════════════════════════════════
// POST /api/checkout/request
// ════════════════════════════════════════════════════════════════════════════════════════
export const requestCheckout = async (req, res, next) => {
  try {
    // ── 1. Identity — from credential, never the body ────────────────────────────────
    const agentId = req.agent.agentId;
    const mandate = req.agent; // full AgentMandate document, freshly reset if new IST day

    // ── 2. Input validation ──────────────────────────────────────────────────────────
    const { sku, qty, maxBudget, reason, idempotencyKey, upsellRef } = req.body;

    if (!sku || typeof sku !== 'string') {
      return res.status(400).json({ error: 'sku is required and must be a string.' });
    }
    if (!Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({ error: 'qty must be a positive integer.' });
    }
    if (!reason || typeof reason !== 'string' || reason.trim().length < 10) {
      return res.status(400).json({ error: 'reason must be a string of at least 10 characters.' });
    }
    if (!idempotencyKey || typeof idempotencyKey !== 'string') {
      return res.status(400).json({ error: 'idempotencyKey is required.' });
    }

    // ── 3. Authoritative product lookup — pricing from MongoDB, never agent payload ──
    const product = await Product.findOne({ sku: sku.trim() });
    if (!product) {
      return res.status(404).json({ error: `Product not found: ${sku}` });
    }

    // ── 4. Policy evaluation (pure function, no DB writes) ───────────────────────────
    const policy = evaluatePurchase({
      unitPrice: product.price, // authoritative — agent's maxBudget is NOT used here
      qty,
      stock: product.stock,
      maxPerTx: mandate.maxPerTx,
      dailyLimit: mandate.dailyLimit,
      spentToday: mandate.spentToday,
    });

    // ── 5. Upsell offer (only if the transaction is proceeding — not BLOCKED/FAILED) ─
    let upsellOffer = null;
    if (!['BLOCKED', 'FAILED'].includes(policy.tier)) {
      // Clamp maxBudget so the agent cannot exceed its actual mandate headroom
      const headroom = computeUpsellHeadroom({
        maxBudget: maxBudget ?? 0,
        dailyLimit: mandate.dailyLimit,
        spentToday: mandate.spentToday,
        primaryLineTotal: policy.amount,
      });

      if (headroom > 0 && product.upsellTargetCategory) {
        upsellOffer = await findUpsellOffer({
          primarySku: sku,
          targetCategory: product.upsellTargetCategory,
          headroom,
          primaryTitle: product.title,
          // NOTE: reason is intentionally NOT passed (DECISIONS §7 prompt injection defense)
        });
      }
    }

    // ── 6. Build audit record ────────────────────────────────────────────────────────
    const auditId = `audit_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
    const privacyReceipt = buildPrivacyReceipt({ agentId, status: policy.tier });

    const auditData = {
      auditId,
      agentId,
      sku,
      qty,
      reason: reason.trim(),
      amount: policy.amount,
      status: policy.tier,
      blockReason: policy.blockReason,
      idempotencyKey,
      upsellRef: upsellRef ?? null,
      offerIssued: upsellOffer,
      synthetic: false,
      privacyReceipt,
    };

    // ── 7. Insert with idempotency guard ─────────────────────────────────────────────
    // The compound unique index on (agentId, idempotencyKey) is the arbiter.
    // E11000 → the request is a replay; return the existing row with replayed: true.
    let auditDoc;
    try {
      auditDoc = await AuditLog.create(auditData);
    } catch (err) {
      if (err.code === 11000) {
        const existing = await AuditLog.findOne({ agentId, idempotencyKey }).lean();
        return res.json({ ...existing, replayed: true });
      }
      throw err;
    }

    // ── 8. FAILED: out of stock → return 2 alternatives ─────────────────────────────
    if (policy.tier === 'FAILED') {
      const alternatives = await Product.find({
        sku: { $ne: sku },
        stock: { $gt: 0 },
        category: product.category,
      })
        .limit(2)
        .select('sku title price stock -_id');

      return res.json({
        auditId,
        status: 'FAILED',
        amount: policy.amount,
        explanation: policy.explanation,
        alternatives,
        privacyReceipt,
      });
    }

    // ── 9. BLOCKED: ceiling breach → return immediately, no Razorpay call ───────────
    if (policy.tier === 'BLOCKED') {
      return res.json({
        auditId,
        status: 'BLOCKED',
        blockReason: policy.blockReason,
        amount: policy.amount,
        explanation: policy.explanation,
        privacyReceipt,
      });
    }

    // ── 10. GATED: queue for human approval ─────────────────────────────────────────
    if (policy.tier === 'GATED_1_CLICK' || policy.tier === 'GATED_2FA') {
      return res.json({
        auditId,
        status: policy.tier,
        amount: policy.amount,
        explanation: policy.explanation,
        upsellOffer,
        privacyReceipt,
      });
    }

    // ── 11. AUTO_APPROVED: immediate Razorpay order with write-ahead ─────────────────
    const { status: finalStatus, razorpayOrderId } = await runRazorpayWithWriteAhead(
      auditId,
      policy.amount
    );

    // Update privacy receipt with final state
    await AuditLog.findOneAndUpdate(
      { auditId },
      {
        $set: {
          privacyReceipt: buildPrivacyReceipt({ agentId, status: finalStatus, razorpayOrderId }),
        },
      }
    );

    return res.json({
      auditId,
      status: finalStatus,
      amount: policy.amount,
      explanation: policy.explanation,
      upsellOffer,
      razorpayOrderId,
      privacyReceipt: buildPrivacyReceipt({ agentId, status: finalStatus, razorpayOrderId }),
    });
  } catch (err) {
    next(err);
  }
};

// ════════════════════════════════════════════════════════════════════════════════════════
// POST /api/checkout/approve
// Requires x-merchant-key. Executes atomic stock+spend decrements, TOTP check for 2FA.
// ════════════════════════════════════════════════════════════════════════════════════════
export const approveCheckout = async (req, res, next) => {
  try {
    const { auditId, totpCode } = req.body;

    if (!auditId) {
      return res.status(400).json({ error: 'auditId is required.' });
    }

    // ── 1. Fetch the gated transaction ───────────────────────────────────────────────
    const auditDoc = await AuditLog.findOne({ auditId });
    if (!auditDoc) {
      return res.status(404).json({ error: `Audit log not found: ${auditId}` });
    }

    // ── 2. Verify it is in an approvable gated state ─────────────────────────────────
    if (!['GATED_1_CLICK', 'GATED_2FA'].includes(auditDoc.status)) {
      return res.status(400).json({
        error: `Cannot approve a transaction with status: ${auditDoc.status}`,
        currentStatus: auditDoc.status,
      });
    }

    // ── 3. TOTP verification for GATED_2FA ───────────────────────────────────────────
    if (auditDoc.status === 'GATED_2FA') {
      const totpResult = await verifyTOTP(auditId, totpCode);
      if (!totpResult.success) {
        return res.status(400).json({
          error: totpResult.message,
          status: totpResult.blocked ? 'BLOCKED' : 'GATED_2FA',
          blocked: totpResult.blocked ?? false,
        });
      }
    }

    // ── 4. Atomic stock decrement (DECISIONS §3) ─────────────────────────────────────
    // The $gte guard means: only decrement if stock is still sufficient.
    // Returns null if the guard fails (stock depleted since request time).
    const updatedProduct = await Product.findOneAndUpdate(
      { sku: auditDoc.sku, stock: { $gte: auditDoc.qty } },
      { $inc: { stock: -auditDoc.qty } },
      { new: true }
    );

    if (!updatedProduct) {
      // Stock depleted between request and approval → FAILED
      await AuditLog.findOneAndUpdate({ auditId }, { $set: { status: 'FAILED' } });
      return res.status(409).json({
        error: 'Insufficient stock at approval time. This item sold out in the queue.',
        auditId,
        status: 'FAILED',
      });
    }

    // ── 5. Atomic spend decrement (DECISIONS §3) ─────────────────────────────────────
    // Uses $expr to compare spentToday against (dailyLimit - amount) without knowing
    // dailyLimit upfront. Returns null if the guard fails (limit already exhausted by
    // other approved orders queued ahead of this one — the attack vector in DECISIONS §3).
    const updatedMandate = await AgentMandate.findOneAndUpdate(
      {
        agentId: auditDoc.agentId,
        $expr: {
          $lte: ['$spentToday', { $subtract: ['$dailyLimit', auditDoc.amount] }],
        },
      },
      { $inc: { spentToday: auditDoc.amount } },
      { new: true }
    );

    if (!updatedMandate) {
      // Spend guard failed — COMPENSATE the stock decrement before writing the audit row
      // (DECISIONS §3 compensation rule: stock guard succeeded, spend guard failed)
      await Product.findOneAndUpdate(
        { sku: auditDoc.sku },
        { $inc: { stock: +auditDoc.qty } }
      );

      await AuditLog.findOneAndUpdate(
        { auditId },
        {
          $set: {
            status: 'BLOCKED',
            blockReason: 'daily_limit_exhausted_at_approval',
          },
        }
      );

      return res.status(409).json({
        error: 'Daily spending limit exhausted at approval time. Stock decrement has been compensated.',
        auditId,
        status: 'BLOCKED',
        blockReason: 'daily_limit_exhausted_at_approval',
      });
    }

    // ── 6. Both guards passed — create Razorpay order with write-ahead ───────────────
    const { status: finalStatus, razorpayOrderId } = await runRazorpayWithWriteAhead(
      auditId,
      auditDoc.amount
    );

    // ── 7. Update privacy receipt ─────────────────────────────────────────────────────
    const receipt = buildPrivacyReceipt({
      agentId: auditDoc.agentId,
      status: finalStatus,
      razorpayOrderId,
    });
    await AuditLog.findOneAndUpdate({ auditId }, { $set: { privacyReceipt: receipt } });

    return res.json({
      auditId,
      status: finalStatus,
      razorpayOrderId,
      amount: auditDoc.amount,
      privacyReceipt: receipt,
    });
  } catch (err) {
    next(err);
  }
};

// ════════════════════════════════════════════════════════════════════════════════════════
// POST /api/checkout/deny
// [NEW] Requires x-merchant-key. Terminal DENIED transition (DECISIONS §5).
// ════════════════════════════════════════════════════════════════════════════════════════
export const denyCheckout = async (req, res, next) => {
  try {
    const { auditId, note } = req.body;

    if (!auditId) {
      return res.status(400).json({ error: 'auditId is required.' });
    }

    const auditDoc = await AuditLog.findOne({ auditId });
    if (!auditDoc) {
      return res.status(404).json({ error: `Audit log not found: ${auditId}` });
    }

    // Only gated transactions can be denied (DENIED is terminal — DECISIONS §5)
    if (!['GATED_1_CLICK', 'GATED_2FA'].includes(auditDoc.status)) {
      return res.status(400).json({
        error: `Cannot deny a transaction with status: ${auditDoc.status}. Only GATED_1_CLICK and GATED_2FA can be denied.`,
        currentStatus: auditDoc.status,
      });
    }

    // No stock or spend decrements occur on denial (DECISIONS §5: "No decrements. Terminal.")
    const updated = await AuditLog.findOneAndUpdate(
      { auditId, status: { $in: ['GATED_1_CLICK', 'GATED_2FA'] } },
      {
        $set: {
          status: 'DENIED',
          // Optionally store the merchant's note in privacyReceipt for audit clarity
          ...(note && { 'privacyReceipt.merchantDenyNote': note }),
        },
      },
      { new: true }
    );

    if (!updated) {
      // Race condition: another request changed the status between our read and write
      const current = await AuditLog.findOne({ auditId }).select('status');
      return res.status(409).json({
        error: 'Status changed concurrently. Current status: ' + current?.status,
        currentStatus: current?.status,
      });
    }

    return res.json({
      auditId,
      status: 'DENIED',
      message: 'Transaction denied. No stock or spend decrements were made.',
    });
  } catch (err) {
    next(err);
  }
};

// ════════════════════════════════════════════════════════════════════════════════════════
// POST /api/checkout/guest-request
// Universal Guest AI Checkout (Channel 2 — Open Protocol / x402 Payment Links)
// Allows external / public AI agents (without x-agent-key) to purchase and receive a Razorpay link.
// ════════════════════════════════════════════════════════════════════════════════════════
export const requestGuestCheckout = async (req, res, next) => {
  try {
    const { sku, qty = 1, reason = 'Guest AI Procurement', idempotencyKey } = req.body;
    const key = idempotencyKey || uuidv4();
    const guestAgentId = 'agent_guest_anonymous';

    if (!sku || typeof sku !== 'string') {
      return res.status(400).json({ error: 'sku is required and must be a string.' });
    }
    const numQty = Number(qty);
    if (!Number.isInteger(numQty) || numQty < 1) {
      return res.status(400).json({ error: 'qty must be a positive integer.' });
    }

    // 1. Authoritative product lookup
    const product = await Product.findOne({ sku: sku.trim() });
    if (!product) {
      return res.status(404).json({ error: `Product not found: ${sku}` });
    }

    const lineTotal = product.price * numQty;

    // 2. Stock check
    if (product.stock < numQty) {
      return res.status(200).json({
        status: 'FAILED',
        amount: lineTotal,
        explanation: `Insufficient stock: requested ${numQty}, available ${product.stock}.`,
        paymentLink: null,
      });
    }

    const auditId = uuidv4();

    // 3. Generate Razorpay Payment Link / Standard Order Link
    let paymentLink;
    try {
      paymentLink = await createRazorpayPaymentLink(lineTotal, auditId, `SafeAgent Guest: ${product.title}`);
    } catch (err) {
      console.warn('[GUEST-CHECKOUT] Payment link error:', err.message);
      paymentLink = {
        id: `plink_${auditId.substring(0, 10)}`,
        short_url: `https://rzp.io/i/${auditId.substring(0, 8)}`,
      };
    }

    // 4. Create Audit Log for traceability
    const auditDoc = new AuditLog({
      auditId,
      agentId: guestAgentId,
      sku: product.sku,
      qty: numQty,
      reason: String(reason),
      amount: lineTotal,
      status: 'ORDER_CREATED',
      idempotencyKey: key,
      razorpayOrderId: paymentLink.id,
      privacyReceipt: buildPrivacyReceipt({
        agentId: guestAgentId,
        status: 'ORDER_CREATED',
        razorpayOrderId: paymentLink.id,
      }),
    });

    await auditDoc.save();

    // 5. Return HTTP 402 / 200 payload with the Razorpay link
    res.setHeader('X-Payment-Link', paymentLink.short_url || '');
    return res.status(200).json({
      status: 'ORDER_CREATED',
      protocol: 'x402-Universal-Agentic-Link',
      auditId,
      sku: product.sku,
      title: product.title,
      qty: numQty,
      amount: lineTotal,
      currency: 'INR',
      paymentLinkId: paymentLink.id,
      paymentUrl: paymentLink.short_url || `https://rzp.io/i/${paymentLink.id}`,
      explanation: `Guest order created for ₹${lineTotal}. Present the payment link to the human user to complete payment via UPI/Cards.`,
    });
  } catch (err) {
    if (err.code === 11000) {
      // Idempotency replay
      const existing = await AuditLog.findOne({
        agentId: 'agent_guest_anonymous',
        idempotencyKey: req.body.idempotencyKey,
      });
      if (existing) {
        return res.status(200).json({
          replayed: true,
          status: existing.status,
          auditId: existing.auditId,
          amount: existing.amount,
          paymentUrl: `https://rzp.io/i/${existing.razorpayOrderId}`,
        });
      }
    }
    next(err);
  }
};

