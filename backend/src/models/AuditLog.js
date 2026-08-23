// src/models/AuditLog.js
// Immutable event log for every checkout action.
// The compound unique index on (agentId, idempotencyKey) is the primary replay-safety
// mechanism — a read-then-write check would lose the race; the index makes the DB the
// arbiter (DECISIONS §4).

import mongoose from 'mongoose';

// ── Status enum vocabulary (Part 8 & Part 22) ──────────────────────────────────────────
const STATUS_VALUES = [
  'PENDING',
  'AUTO_APPROVED',
  'GATED_1_CLICK',
  'GATED_2FA',
  'BLOCKED',
  'DENIED',               // [NEW] Terminal: merchant explicitly rejected a gated row
  'ORDER_PENDING_CONFIRM',// [NEW] Write-ahead state set immediately before Razorpay call
  'ORDER_CREATED',
  'PAYMENT_CAPTURED',
  'FAILED',
  'GATEWAY_DEGRADED',
];

// ── blockReason vocabulary (Part 22 & DECISIONS §5) ────────────────────────────────────
// Required whenever status === 'BLOCKED'. Kept as a plain string (not an enum) so that
// downstream code can set it and validation catches typos via the explicit check below.
const BLOCK_REASON_VALUES = [
  'max_per_tx_exceeded',
  'daily_limit_exceeded',
  'daily_limit_exhausted_at_approval',
  'stock_depleted_at_approval',
  'totp_lockout',
];

const auditLogSchema = new mongoose.Schema(
  {
    auditId: {
      type: String,
      required: true,
      unique: true,
    },
    agentId: {
      type: String,
      required: true,
      index: true,
    },
    sku: {
      type: String,
      required: true,
    },
    qty: {
      type: Number,
      required: true,
      min: 1,
    },
    reason: {
      type: String,
      required: true,
      minlength: 10,
    },
    // Line total (price × qty) in INR. This is what the policy engine operates on.
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: STATUS_VALUES,
      required: true,
      default: 'PENDING',
    },
    // Required when status === 'BLOCKED'. Describes which ceiling/condition fired.
    blockReason: {
      type: String,
      enum: BLOCK_REASON_VALUES,
      default: null,
      validate: {
        validator: function (v) {
          // blockReason must be set if and only if status is BLOCKED
          if (this.status === 'BLOCKED') return v != null && v.length > 0;
          return true; // non-BLOCKED rows may omit it
        },
        message: 'blockReason is required when status is BLOCKED',
      },
    },
    // TOTP brute-force counter — 5 failed attempts → BLOCKED(totp_lockout)
    totpAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Replay-safety key, scoped per-agent (see compound index below)
    idempotencyKey: {
      type: String,
      required: true,
    },
    // Set on the second request_purchase that accepts a prior upsell offer
    upsellRef: {
      type: String,
      default: null,
    },
    // The upsell offer object returned alongside this transaction (if any)
    offerIssued: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    // true for the 20 synthetic historical rows inserted by seedDb.js
    synthetic: {
      type: Boolean,
      default: false,
    },
    razorpayOrderId: {
      type: String,
      default: null,
    },
    privacyReceipt: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt + updatedAt
  }
);

// ── CRITICAL: Compound unique index for idempotency (DECISIONS §4) ─────────────────────
// The database rejects any duplicate (agentId, idempotencyKey) pair with E11000.
// The checkout controller catches E11000 and returns the existing row with replayed: true.
auditLogSchema.index({ agentId: 1, idempotencyKey: 1 }, { unique: true });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export { STATUS_VALUES, BLOCK_REASON_VALUES };
