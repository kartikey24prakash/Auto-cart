// src/routes/dashboardRoutes.js
import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { getLogs, getMetrics, getMandate } from '../controllers/dashboardController.js';

const router = Router();

// All dashboard routes require x-merchant-key
router.use(authMiddleware);

// GET /api/dashboard/logs    — Paginated audit stream
router.get('/logs', getLogs);

// GET /api/dashboard/metrics — Conversion, prevention count, AOV
router.get('/metrics', getMetrics);

// GET /api/dashboard/mandate — Current mandate + spend meters
router.get('/mandate', getMandate);

export default router;
