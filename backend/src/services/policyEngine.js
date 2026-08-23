// src/services/policyEngine.js
//
// PURE FUNCTION — no DB writes, no DB reads, no side effects.
//
// Receives already-resolved data (product price, mandate values, daily headroom) and
// returns the routing decision. This keeps the policy engine testable in isolation and
// ensures the LLM can never influence pricing or math (Part 11, Part 18).
//
// ── Decision Reference (DECISIONS.md §2) ─────────────────────────────────────────────
//  Hard ceilings (mandate walls):
//    amount > maxPerTx        → BLOCKED  blockReason: max_per_tx_exceeded
//    amount > dailyRemaining  → BLOCKED  blockReason: daily_limit_exceeded
//
//  Gating tiers (within mandate):
//    amount < 500             → AUTO_APPROVED
//    500 <= amount <= 5000    → GATED_1_CLICK
//    amount > 5000            → GATED_2FA
//
//  All comparisons use the LINE TOTAL (unitPrice × qty), never the unit price.
//  Two ₹499 items = ₹998 → GATED_1_CLICK, not AUTO_APPROVED.
//
// ── Stock check ──────────────────────────────────────────────────────────────────────
//  Out of stock at request time → FAILED (no blockReason; it's not a policy violation)
//  The stock decrement itself happens atomically at approval time (DECISIONS §3).
//
// ────────────────────────────────────────────────────────────────────────────────────────

/**
 * Evaluate a requested purchase against mandate ceilings and routing tier rules.
 *
 * @param {Object} params
 * @param {number}  params.unitPrice     - Authoritative price from MongoDB Product document
 * @param {number}  params.qty           - Requested quantity (integer ≥ 1)
 * @param {number}  params.stock         - Current stock level from MongoDB
 * @param {number}  params.maxPerTx      - AgentMandate.maxPerTx hard ceiling (INR)
 * @param {number}  params.dailyLimit    - AgentMandate.dailyLimit hard ceiling (INR)
 * @param {number}  params.spentToday    - AgentMandate.spentToday at request time (INR)
 *
 * @returns {PolicyResult}
 *
 * @typedef {Object} PolicyResult
 * @property {'AUTO_APPROVED'|'GATED_1_CLICK'|'GATED_2FA'|'BLOCKED'|'FAILED'} tier
 * @property {number}  amount        - Line total (unitPrice × qty) in INR
 * @property {number}  dailyRemaining - Spend headroom remaining before hitting dailyLimit
 * @property {string|null} blockReason - Set only when tier === 'BLOCKED'
 * @property {string}  explanation   - Human-readable summary of the decision
 */
export function evaluatePurchase({ unitPrice, qty, stock, maxPerTx, dailyLimit, spentToday }) {
  // ── 1. Input validation ──────────────────────────────────────────────────────────────
  if (typeof unitPrice !== 'number' || unitPrice < 0) {
    throw new TypeError(`policyEngine: invalid unitPrice "${unitPrice}"`);
  }
  if (!Number.isInteger(qty) || qty < 1) {
    throw new TypeError(`policyEngine: qty must be a positive integer, got "${qty}"`);
  }
  if (typeof stock !== 'number' || typeof maxPerTx !== 'number' ||
      typeof dailyLimit !== 'number' || typeof spentToday !== 'number') {
    throw new TypeError('policyEngine: stock, maxPerTx, dailyLimit, spentToday must be numbers');
  }

  // ── 2. Line total (THE canonical amount for all comparisons) ─────────────────────────
  const amount = unitPrice * qty;

  // ── 3. Daily headroom ────────────────────────────────────────────────────────────────
  const dailyRemaining = Math.max(0, dailyLimit - spentToday);

  // ── 4. Stock check (request-time only; decrement is deferred to approval) ───────────
  if (stock < qty) {
    return {
      tier: 'FAILED',
      amount,
      dailyRemaining,
      blockReason: null,
      explanation: `Insufficient stock: requested ${qty}, available ${stock}.`,
    };
  }

  // ── 5. Hard ceiling: per-transaction limit ───────────────────────────────────────────
  //    No human override path exists for a ceiling breach (DECISIONS §2).
  if (amount > maxPerTx) {
    return {
      tier: 'BLOCKED',
      amount,
      dailyRemaining,
      blockReason: 'max_per_tx_exceeded',
      explanation:
        `Line total ₹${amount} exceeds per-transaction ceiling ₹${maxPerTx}. ` +
        `No override path exists for mandate wall violations.`,
    };
  }

  // ── 6. Hard ceiling: daily spending limit ────────────────────────────────────────────
  //    Note: spentToday is the request-time snapshot. A re-check also happens atomically
  //    at approval time (AgentMandate.findOneAndUpdate guard, DECISIONS §3).
  if (amount > dailyRemaining) {
    return {
      tier: 'BLOCKED',
      amount,
      dailyRemaining,
      blockReason: 'daily_limit_exceeded',
      explanation:
        `Line total ₹${amount} exceeds remaining daily headroom ₹${dailyRemaining} ` +
        `(dailyLimit ₹${dailyLimit} − spentToday ₹${spentToday}).`,
    };
  }

  // ── 7. Gating tier routing ───────────────────────────────────────────────────────────
  //    Boundaries are explicit and non-overlapping so ₹500 and ₹5,000 land deterministically
  //    (DECISIONS §2 boundary handling).
  let tier;
  let explanation;

  if (amount < 500) {
    tier = 'AUTO_APPROVED';
    explanation = `Line total ₹${amount} < ₹500 threshold — auto-approved. Razorpay order will be created immediately.`;
  } else if (amount <= 5000) {
    tier = 'GATED_1_CLICK';
    explanation = `Line total ₹${amount} is within ₹500–₹5,000 band — queued for merchant 1-click confirmation.`;
  } else {
    // amount > 5000 and <= maxPerTx (ceiling check already passed above)
    tier = 'GATED_2FA';
    explanation = `Line total ₹${amount} exceeds ₹5,000 — queued for merchant TOTP 2FA verification.`;
  }

  return {
    tier,
    amount,
    dailyRemaining,
    blockReason: null,
    explanation,
  };
}

// ── Convenience: compute clamped upsell headroom ─────────────────────────────────────────
//
// headroom = max(0, min(maxBudget, mandateRemaining) - primaryLineTotal)
//
// The raw agent-supplied maxBudget is NEVER used unclamped:
//   - maxBudget: 1 must not produce a negative bound.
//   - maxBudget: 999999 must not allow the agent to exceed its actual mandate.
//
// This value is passed to the upsell engine and to the LLM (the pitch sentence only).
// The agent's `reason` is never passed to the LLM (DECISIONS §7 prompt injection defense).

/**
 * @param {Object} params
 * @param {number} params.maxBudget          - Agent-supplied advisory budget (untrusted)
 * @param {number} params.dailyLimit         - AgentMandate.dailyLimit
 * @param {number} params.spentToday         - AgentMandate.spentToday at request time
 * @param {number} params.primaryLineTotal   - Line total of the just-evaluated primary item
 * @returns {number} upsellHeadroom in INR, floored at 0
 */
export function computeUpsellHeadroom({ maxBudget, dailyLimit, spentToday, primaryLineTotal }) {
  const mandateRemaining = Math.max(0, dailyLimit - spentToday);
  const clampedBudget = Math.min(maxBudget, mandateRemaining);
  return Math.max(0, clampedBudget - primaryLineTotal);
}
