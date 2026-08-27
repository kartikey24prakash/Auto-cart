import express from 'express';
import { getDomainConfig, requestVerification, verifyDomain } from '../controllers/domainController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getDomainConfig);
router.post('/request', requestVerification);
router.post('/verify', verifyDomain);

export default router;
