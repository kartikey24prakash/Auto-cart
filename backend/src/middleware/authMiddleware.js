// src/middleware/authMiddleware.js
//
// Protects all merchant-facing routes (approve, deny, dashboard/*).
// The x-merchant-key header must exactly match MERCHANT_SHARED_SECRET.
//
// SECURITY NOTES (DECISIONS §7):
//   • MERCHANT_SHARED_SECRET must NEVER carry a VITE_ prefix or appear in the client bundle.
//   • The dashboard obtains the key at runtime via the Key Gate screen (held in React state,
//     never written to localStorage or sessionStorage).
//   • This middleware is stateless — no DB lookup required, constant-time comparison via
//     timingSafeEqual to prevent timing-oracle attacks.

import { timingSafeEqual } from 'crypto';

export const authMiddleware = (req, res, next) => {
  const secret = process.env.MERCHANT_SHARED_SECRET;

  if (!secret) {
    // Fail loudly on startup misconfiguration rather than silently passing all requests
    console.error('[AUTH] MERCHANT_SHARED_SECRET is not set — all merchant routes are unprotected!');
    return res.status(503).json({ error: 'Server misconfiguration: merchant secret not configured.' });
  }

  const provided = req.headers['x-merchant-key'];

  if (!provided) {
    return res.status(401).json({ error: 'Missing x-merchant-key header.' });
  }

  // Constant-time comparison to prevent timing-based key enumeration
  let match = false;
  try {
    const a = Buffer.from(provided);
    const b = Buffer.from(secret);
    // timingSafeEqual requires same-length buffers; if lengths differ it throws
    match = a.length === b.length && timingSafeEqual(a, b);
  } catch {
    match = false;
  }

  if (!match) {
    return res.status(401).json({ error: 'Invalid x-merchant-key.' });
  }

  next();
};
