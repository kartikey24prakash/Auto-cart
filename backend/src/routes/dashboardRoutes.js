// src/routes/dashboardRoutes.js
import { Router } from 'express';
import { jwtMiddleware } from '../middleware/jwtMiddleware.js';
import { getLogs, getMetrics, getMandate, updateMandate, getShipping, updateShipping, getCatalog, getMerchantConfig, updateMerchantConfig } from '../controllers/dashboardController.js';

const router = Router();

// All dashboard routes require JWT token
router.use(jwtMiddleware);

// GET /api/dashboard/logs    — Paginated audit stream
router.get('/logs', getLogs);

// GET /api/dashboard/metrics — Conversion, prevention count, AOV
router.get('/metrics', getMetrics);

// GET /api/dashboard/mandate — Current mandate + spend meters
router.get('/mandate', getMandate);

// PUT /api/dashboard/mandate — Update buyer daily budget
router.put('/mandate', updateMandate);

// GET & PUT /api/dashboard/shipping — Manage buyer shipping profiles
router.get('/shipping', getShipping);
router.put('/shipping', updateShipping);

// GET /api/dashboard/catalog — Fetch merchant products
router.get('/catalog', getCatalog);

// GET & PUT /api/dashboard/config — Merchant settings
router.get('/config', getMerchantConfig);
router.put('/config', updateMerchantConfig);

export default router;
