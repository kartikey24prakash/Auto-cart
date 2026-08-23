// src/routes/checkoutRoutes.js
import { Router } from 'express';
import { agentAuth } from '../middleware/agentAuth.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { agentRateLimiter } from '../middleware/rateLimiter.js';
import {
  requestCheckout,
  approveCheckout,
  denyCheckout,
} from '../controllers/checkoutController.js';

const router = Router();

// POST /api/checkout/request — agent route (x-agent-key required)
// Rate limiter is applied per-agent AFTER agentAuth resolves the agentId.
router.post('/request', agentAuth, agentRateLimiter, requestCheckout);

// POST /api/checkout/approve — merchant route (x-merchant-key required)
router.post('/approve', authMiddleware, approveCheckout);

// POST /api/checkout/deny — merchant route (x-merchant-key required) [NEW]
router.post('/deny', authMiddleware, denyCheckout);

export default router;
