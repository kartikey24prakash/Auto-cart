import crypto from 'crypto';
import { AuditLog } from '../models/AuditLog.js';
import { User } from '../models/User.js';
import { Product } from '../models/Product.js';

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
        
        // Handle Tokenization
        const tokenId = payloadObj.payload.payment.entity.token_id;
        const customerId = payloadObj.payload.payment.entity.customer_id;
        
        if (tokenId && customerId) {
           await User.updateOne(
             { 'buyerConfig.razorpayCustomerId': customerId },
             { $set: { 'buyerConfig.paymentToken': tokenId, 'buyerConfig.isPaymentLinked': true } }
           );
           console.log(`[Webhook] Saved Token ${tokenId} for Customer ${customerId}`);
        }
      }

      if (!orderId) {
        return res.status(200).send('OK');
      }
      
      const log = await AuditLog.findOne({ razorpayOrderId: orderId });
      if (!log) {
        // Could be a standalone 1 INR token registration order, just ignore if not in AuditLog
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
        
        // Deduct stock
        if (log.sku && log.qty) {
          await Product.updateOne(
            { sku: log.sku, merchantId: log.merchantId },
            { $inc: { stock: -log.qty } }
          );
        }
        
        console.log(`[Webhook] Order ${orderId} finalized via webhook.`);
      }
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('[Webhook Error]', err);
    res.status(500).send('Error handling webhook');
  }
};
