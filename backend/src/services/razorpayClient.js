// src/services/razorpayClient.js
//
// Wraps Razorpay SDK's orders.create with:
//   • INR → paise conversion (× 100) at the API boundary (DECISIONS §8)
//   • receipt: auditId for traceability (every Razorpay order links to its AuditLog row)
//   • 2-retry exponential backoff on 5xx and network errors ONLY
//   • 4xx responses are permanent failures and are NEVER retried (DECISIONS §8)
//   • SIMULATE_GATEWAY_FAILURE=true: always throws a simulated 5xx (demo mode)
//
// This keeps the Razorpay concern isolated — the checkout controller does NOT import rzp
// directly. All callers see a simple createRazorpayOrder(amountINR, auditId) interface.

import { rzp } from '../config/razorpay.js';

const MAX_RETRIES = 2;
const INITIAL_BACKOFF_MS = 300;

/**
 * Pauses execution for `ms` milliseconds.
 * @param {number} ms
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Determines whether an error qualifies for a retry.
 * Only 5xx status codes and network-level errors are retried.
 * 4xx errors are permanent failures (bad key, malformed payload, etc.).
 *
 * @param {Error|Object} err
 * @returns {boolean}
 */
function isRetryable(err) {
  // Razorpay SDK wraps HTTP errors with a statusCode field
  const status = err?.statusCode ?? err?.status ?? null;
  if (status !== null) {
    return status >= 500; // 5xx only
  }
  // Network-level errors (ECONNRESET, ETIMEDOUT, etc.) have no statusCode
  return true;
}

/**
 * Creates a Razorpay order in test mode.
 * Converts rupee amount to paise before the API call.
 * Includes receipt: auditId for idempotency and audit traceability.
 *
 * @param {number} amountINR - Line total in Indian Rupees
 * @param {string} auditId   - AuditLog document ID (used as Razorpay receipt)
 * @returns {Promise<Object>} Razorpay order object (contains .id = razorpayOrderId)
 * @throws Will throw after MAX_RETRIES on 5xx/network errors, or immediately on 4xx.
 */
export async function createRazorpayOrder(amountINR, auditId) {
  // ── Demo failure simulation (DECISIONS §8 / Part 16) ──────────────────────────────────
  // Triggered by SIMULATE_GATEWAY_FAILURE=true. Distinct from a bad API key (which would
  // return 401, not a timeout — and 401 is not retried).
  if (process.env.SIMULATE_GATEWAY_FAILURE === 'true') {
    const simulatedError = new Error('Gateway failure simulation active (SIMULATE_GATEWAY_FAILURE=true)');
    simulatedError.statusCode = 503;
    throw simulatedError;
  }

  const orderPayload = {
    amount: Math.round(amountINR * 100), // INR → paise; Math.round handles floating-point edge cases
    currency: 'INR',
    receipt: auditId,                    // Links Razorpay order back to MongoDB AuditLog (DECISIONS §8)
    notes: {
      source: 'SafeAgent Gateway',
      auditId,
    },
  };

  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const order = await rzp.orders.create(orderPayload);
      return order; // Success — return immediately
    } catch (err) {
      lastError = err;

      if (!isRetryable(err)) {
        // 4xx or other permanent failure — do not retry (DECISIONS §8)
        console.error(
          `[RAZORPAY] Permanent failure (status ${err?.statusCode}) on attempt ${attempt + 1}. ` +
          'Will not retry. auditId:', auditId
        );
        throw err;
      }

      if (attempt < MAX_RETRIES) {
        const backoffMs = INITIAL_BACKOFF_MS * Math.pow(2, attempt); // 300ms, 600ms
        console.warn(
          `[RAZORPAY] Retryable error (status ${err?.statusCode ?? 'network'}) on attempt ` +
          `${attempt + 1}/${MAX_RETRIES + 1}. Retrying in ${backoffMs}ms. auditId: ${auditId}`
        );
        await sleep(backoffMs);
      }
    }
  }

  // All retries exhausted → caller transitions AuditLog to GATEWAY_DEGRADED
  console.error(`[RAZORPAY] All ${MAX_RETRIES + 1} attempts exhausted. auditId: ${auditId}`);
  throw lastError;
}
