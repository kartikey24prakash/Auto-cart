// src/routes/dashboardRoutes.js
import { Router } from 'express';
import { jwtMiddleware } from '../middleware/jwtMiddleware.js';
import { getLogs, getMetrics, getMandate } from '../controllers/dashboardController.js';

const router = Router();

// All dashboard routes require JWT token
router.use(jwtMiddleware);

// GET /api/dashboard/logs    — Paginated audit stream
router.get('/logs', getLogs);

// GET /api/dashboard/metrics — Conversion, prevention count, AOV
router.get('/metrics', getMetrics);

// GET /api/dashboard/mandate — Current mandate + spend meters
router.get('/mandate', getMandate);

export default router;
