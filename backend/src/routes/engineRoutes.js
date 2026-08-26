import express from 'express';
import { verifyIntent, approveTransaction, denyTransaction } from '../controllers/engineController.js';
import { syncCatalog } from '../controllers/dashboardController.js';
import { jwtMiddleware } from '../middleware/jwtMiddleware.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// The central Trust Engine firewall endpoints (SDK access)
router.post('/verify-intent', verifyIntent);

// Server-to-Server Sync
router.post('/sync', authMiddleware, syncCatalog);

// Dashboard routes (require JWT)
router.post('/approve', jwtMiddleware, approveTransaction);
router.post('/deny', jwtMiddleware, denyTransaction);

export default router;
