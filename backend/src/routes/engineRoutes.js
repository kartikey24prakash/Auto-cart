import express from 'express';
import { verifyIntent, commitTransaction, approveTransaction, denyTransaction } from '../controllers/engineController.js';

const router = express.Router();

// The central Trust Engine firewall endpoints
router.post('/verify-intent', verifyIntent);
router.post('/commit', commitTransaction);
router.post('/approve', approveTransaction);
router.post('/deny', denyTransaction);

export default router;
