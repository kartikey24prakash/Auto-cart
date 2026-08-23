// src/routes/webhookRoutes.js
//
// NOTE: express.raw({ type: '*/*' }) is applied in app.js BEFORE express.json()
// for the /api/webhook prefix, so req.body arrives as a Buffer here.
// The webhook controller uses that Buffer to compute the HMAC signature.

import { Router } from 'express';
import { handleRazorpayWebhook } from '../controllers/webhookController.js';

const router = Router();

// POST /api/webhook/razorpay
// No auth middleware here — verification is the HMAC signature check inside the controller.
router.post('/razorpay', handleRazorpayWebhook);

export default router;
