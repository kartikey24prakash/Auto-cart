import express from 'express';
import { verifyIntent, commitTransaction, approveTransaction, denyTransaction } from '../controllers/engineController.js';

const router = express.Router();

import { jwtMiddleware } from '../middleware/jwtMiddleware.js';

// The central Trust Engine firewall endpoints (SDK access)
router.post('/verify-intent', verifyIntent);
router.post('/commit', commitTransaction);

// Dashboard routes (require JWT)
router.post('/approve', jwtMiddleware, approveTransaction);
router.post('/deny', jwtMiddleware, denyTransaction);

export default router;
