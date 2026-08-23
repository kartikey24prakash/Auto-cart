// src/services/totpService.js
//
// TOTP verification with 5-attempt lockout per auditId.
//
// State machine for TOTP (DECISIONS §7 / Part 15):
//   Invalid code  → increment totpAttempts
//   5th failure   → AuditLog.status = BLOCKED, blockReason = 'totp_lockout' (terminal)
//   Valid code    → reset totpAttempts to 0, return success
//
// The lockout is per-auditId so retrying with a different audit row does not help.
// Already-BLOCKED rows are rejected immediately before any TOTP check.

import speakeasy from 'speakeasy';
import { AuditLog } from '../models/AuditLog.js';

const MAX_ATTEMPTS = 5;

/**
 * Verify a TOTP code for a given auditId.
 *
 * @param {string} auditId   - The AuditLog document to verify against
 * @param {string} totpCode  - 6-digit TOTP token from the merchant
 * @returns {Promise<{success: boolean, message: string, blocked?: boolean}>}
 */
export async function verifyTOTP(auditId, totpCode) {
  // 1. Fetch current state
  const auditDoc = await AuditLog.findOne({ auditId }).select('status totpAttempts');

  if (!auditDoc) {
    return { success: false, message: 'Audit log not found.' };
  }

  // 2. Reject already-locked transactions immediately
  if (auditDoc.status === 'BLOCKED') {
    return {
      success: false,
      message: 'This transaction is locked due to TOTP brute-force protection.',
      blocked: true,
    };
  }

  // 3. Guard: totpCode must be present
  if (!totpCode || typeof totpCode !== 'string' || totpCode.trim().length === 0) {
    return { success: false, message: 'totpCode is required for GATED_2FA transactions.' };
  }

  // 4. Verify against the shared TOTP secret (speakeasy, base32 encoded, ±1 window = 30s drift)
  const isValid = speakeasy.totp.verify({
    secret: process.env.TOTP_SECRET,
    encoding: 'base32',
    token: totpCode.trim(),
    window: 1, // allows 1 step (30 s) of clock drift in either direction
  });

  if (isValid) {
    // ── SUCCESS: reset attempt counter (DECISIONS §7) ───────────────────────────────
    await AuditLog.findOneAndUpdate(
      { auditId },
      { $set: { totpAttempts: 0 } }
    );
    return { success: true, message: 'TOTP verified successfully.' };
  }

  // ── FAILURE: atomically increment attempts ──────────────────────────────────────────
  // Use $inc for safety under concurrent requests (two simultaneous incorrect attempts
  // should both count, not overwrite each other).
  const updated = await AuditLog.findOneAndUpdate(
    { auditId },
    { $inc: { totpAttempts: 1 } },
    { new: true }
  );

  const newAttempts = updated?.totpAttempts ?? auditDoc.totpAttempts + 1;
  const remaining = MAX_ATTEMPTS - newAttempts;

  if (newAttempts >= MAX_ATTEMPTS) {
    // ── LOCKOUT: transition to BLOCKED (terminal) ────────────────────────────────────
    await AuditLog.findOneAndUpdate(
      { auditId },
      { $set: { status: 'BLOCKED', blockReason: 'totp_lockout' } }
    );
    return {
      success: false,
      message: `Transaction locked after ${MAX_ATTEMPTS} failed TOTP attempts. blockReason: totp_lockout`,
      blocked: true,
    };
  }

  return {
    success: false,
    message: `Invalid TOTP code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining before lockout.`,
    blocked: false,
  };
}
