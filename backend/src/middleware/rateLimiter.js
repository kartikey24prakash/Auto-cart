// src/middleware/rateLimiter.js
//
// Per-agent rate limiting: 5 requests/min, keyed by agentId derived from x-agent-key.
// This middleware MUST be applied AFTER agentAuth (so req.agent.agentId is set).
//
// DECISIONS §7: "Per-Agent Rate Limiting: 5 requests/min, keyed by the agentId derived
// from x-agent-key (see §1), not the body value."
//
// Falls back to IP if req.agent is somehow not set (defensive programming).

import rateLimit from 'express-rate-limit';

export const agentRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1-minute window
  max: 5,              // max requests per window per key
  keyGenerator: (req) => req.agent?.agentId || req.ip,
  handler: (_req, res) => {
    res.status(429).json({
      error: 'Rate limit exceeded. Maximum 5 requests per minute per agent.',
      retryAfterSeconds: 60,
    });
  },
  standardHeaders: true,  // Return RateLimit-* headers
  legacyHeaders: false,
});
