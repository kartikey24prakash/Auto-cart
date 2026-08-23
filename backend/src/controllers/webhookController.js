// src/controllers/webhookController.js
//
// POST /api/webhook/razorpay
//
// Handles Razorpay payment.captured events.
//
// SECURITY (Part 16 / DECISIONS §8):
//   • MUST verify x-razorpay-signature via HMAC-SHA256 against the raw request body.
//   • If the signature is invalid or missing → 400, NO state change.
//   • Amount from Razorpay is in paise → divide by 100 to reconcile with INR stored in DB.
//
// IMPORTANT: This route requires express.raw() to be applied BEFORE express.json() so
// that req.body is a Buffer (needed for HMAC computation). See app.js for mount order.

import crypto from 'crypto';
import { AuditLog } from '../models/AuditLog.js';

/**
 * Verifies the Razorpay webhook HMAC signature.
 *
 * @param {Buffer} rawBody       - Raw request body buffer (from express.raw())
 * @param {string} receivedSig   - Value of x-razorpay-signature header
 * @param {string} webhookSecret - RAZORPAY_WEBHOOK_SECRET env var
 * @returns {boolean}
 */
function verifyRazorpaySignature(rawBody, receivedSig, webhookSecret) {
  if (!receivedSig || !webhookSecret) return false;
  const expectedSig = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody) // raw Buffer — must be computed before JSON.parse
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  try {
    const a = Buffer.from(receivedSig);
    const b = Buffer.from(expectedSig);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export const handleRazorpayWebhook = async (req, res, next) => {
  try {
    // ── 1. Signature verification (DECISIONS §8 / Part 17) ──────────────────────────
    const receivedSig = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // req.body is a Buffer here (express.raw() applied in app.js before express.json())
    const rawBody = req.body;

    if (!Buffer.isBuffer(rawBody) || rawBody.length === 0) {
      return res.status(400).json({ error: 'Empty or non-raw body received. Check app.js mount order.' });
    }

    const isValid = verifyRazorpaySignature(rawBody, receivedSig, webhookSecret);

    if (!isValid) {
      // Bad signature — reject immediately, no state change (Part 17 failure scenario 4)
      console.warn('[WEBHOOK] Invalid x-razorpay-signature — rejecting request.');
      return res.status(400).json({ error: 'Invalid webhook signature.' });
    }

    // ── 2. Parse the verified payload ───────────────────────────────────────────────
    let payload;
    try {
      payload = JSON.parse(rawBody.toString('utf8'));
    } catch {
      return res.status(400).json({ error: 'Malformed JSON in webhook body.' });
    }

    const event = payload?.event;

    // ── 3. Dispatch on event type ────────────────────────────────────────────────────
    if (event === 'payment.captured') {
      const payment = payload?.payload?.payment?.entity;
      const orderId = payment?.order_id;
      const amountPaise = payment?.amount; // Razorpay sends paise

      if (!orderId) {
        return res.status(422).json({ error: 'Missing order_id in payment.captured payload.' });
      }

      // Amount reconciliation: paise → INR (DECISIONS §8)
      const amountINR = amountPaise != null ? amountPaise / 100 : null;

      // Update AuditLog by razorpayOrderId (not auditId — the webhook only knows the Razorpay order)
      const updated = await AuditLog.findOneAndUpdate(
        { razorpayOrderId: orderId, status: 'ORDER_CREATED' },
        {
          $set: {
            status: 'PAYMENT_CAPTURED',
            ...(amountINR != null && { 'privacyReceipt.capturedAmountINR': amountINR }),
          },
        },
        { new: true }
      );

      if (!updated) {
        // Order not found or already in a terminal state — idempotent 200 (Razorpay retries)
        console.warn(`[WEBHOOK] No ORDER_CREATED row found for orderId: ${orderId}. Possible duplicate delivery.`);
        return res.status(200).json({ received: true, note: 'No matching ORDER_CREATED row found.' });
      }

      console.log(`[WEBHOOK] payment.captured — auditId: ${updated.auditId}, amount: ₹${amountINR}`);
      return res.status(200).json({ received: true, auditId: updated.auditId, status: 'PAYMENT_CAPTURED' });
    }

    // ── 4. Unhandled events → acknowledge receipt without error (Razorpay expects 200) ─
    console.log(`[WEBHOOK] Unhandled event type: ${event}`);
    return res.status(200).json({ received: true, note: `Event type "${event}" not handled.` });
  } catch (err) {
    next(err);
  }
};
