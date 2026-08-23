// src/routes/catalogRoutes.js
import { Router } from 'express';
import { agentAuth } from '../middleware/agentAuth.js';
import { agentRateLimiter } from '../middleware/rateLimiter.js';
import { getCatalog } from '../controllers/catalogController.js';

const router = Router();

// GET /api/catalog
// agentAuth resolves identity from x-agent-key; rateLimiter keyed by agentId (runs after)
router.get('/', agentAuth, agentRateLimiter, getCatalog);

export default router;
