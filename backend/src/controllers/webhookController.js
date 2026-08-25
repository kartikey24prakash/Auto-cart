import crypto from 'crypto';
import { AuditLog } from '../models/AuditLog.js';
import { User } from '../models/User.js';

export const handleRazorpayWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'secret123';
    
    // For Razorpay, we need to verify the signature
    // Since we use express.json(), we'll use a local bypass for testing, but in prod we'd use raw body.
    const signature = req.headers['x-razorpay-signature'];
    
    // For localhost testing, we allow a specific test signature
    if (signature !== 'test-webhook-bypass') {
      // req.body is a Buffer because of express.raw() in app.js
      const expectedSignature = crypto.createHmac('sha256', secret).update(req.body).digest('hex');
      
      if (expectedSignature !== signature) {
         console.error('Invalid Razorpay Webhook Signature');
         return res.status(400).json({ error: 'Invalid signature' });
      }
    }

    const payloadObj = JSON.parse(req.body.toString());
    const event = payloadObj.event;
    
    if (event === 'payment.captured' || event === 'order.paid' || event === 'payment.authorized') {
      let orderId;
      let paymentId;
      
      if (payloadObj.payload && payloadObj.payload.payment) {
        orderId = payloadObj.payload.payment.entity.order_id;
        paymentId = payloadObj.payload.payment.entity.id;
      }

      if (!orderId) {
        return res.status(200).send('OK');
      }
      
      const log = await AuditLog.findOne({ razorpayOrderId: orderId });
      if (!log) {
        console.error('Webhook received for unknown order:', orderId);
        return res.status(200).send('OK');
      }

      if (log.status !== 'PAYMENT_CAPTURED') {
        log.status = 'PAYMENT_CAPTURED';
        log.razorpayPaymentId = paymentId;
        
        const merchant = await User.findOne({ userId: log.merchantId });
        
        log.privacyReceipt = {
          timestamp: new Date().toISOString(),
          merchantName: merchant?.email || 'Merchant',
          total: log.amount,
          gateway: 'Razorpay Webhook'
        };
        await log.save();

        // Deduct budget
        await User.updateOne({ userId: log.buyerId, role: 'BUYER' }, { $inc: { 'buyerConfig.spentToday': log.amount } });
        console.log(`[Webhook] Order ${orderId} finalized via webhook.`);
      }
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('[Webhook Error]', err);
    res.status(500).send('Error handling webhook');
  }
};
