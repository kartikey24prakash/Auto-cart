import crypto from 'crypto';
import Razorpay from 'razorpay';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { Product } from '../models/Product.js';
import { v4 as uuidv4 } from 'uuid';

// Helper to verify the HMAC signature from the SDK
const verifySignature = (payload, signature, secret) => {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  return expectedSignature === signature;
};

// Helper to create Razorpay Order
const createRazorpayOrder = async (merchant, amount, receiptId) => {
  const rzpKeyId = merchant.merchantConfig?.razorpayKeyId || process.env.RAZORPAY_KEY_ID;
  const rzpKeySecret = merchant.merchantConfig?.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET;
  
  if (!rzpKeyId || !rzpKeySecret) {
    throw new Error('Merchant Razorpay keys not configured and platform fallback missing');
  }
  const rzp = new Razorpay({
    key_id: rzpKeyId,
    key_secret: rzpKeySecret
  });

  const amountPaise = Math.round(amount * 100);
  const platformFeePaise = Math.round(amountPaise * 0.02); // 2% AutoCart Fee

  const orderPayload = {
    amount: amountPaise,
    currency: 'INR',
    receipt: receiptId
  };

  // Phase 2: Razorpay Route (Money Routing)
  // Disabled for Hackathon Demo because acc_demo123 is a fake account ID and crashes the Razorpay SDK
  // if (merchant.merchantConfig.razorpayLinkedAccountId) { ... }

  return await rzp.orders.create(orderPayload);
};

  export const verifyIntent = async (req, res) => {
    try {
      const signature = req.headers['x-autocart-signature'];
      const { merchantKey, buyerKey, sku, qty, lineTotal, idempotencyKey, maxAuthorizedAmount } = req.body;
  
      if (!signature) {
        return res.status(401).json({ error: 'Missing x-autocart-signature header' });
      }
  
      // AI Safety Check: Price Gouging Protection
      if (maxAuthorizedAmount !== undefined && lineTotal > maxAuthorizedAmount) {
        return res.status(403).json({ error: 'BLOCKED: Merchant price exceeds AI maxAuthorizedAmount.' });
      }
  
      // 1. Fetch Merchant
      const merchant = await User.findOne({ 'merchantConfig.merchantKey': merchantKey, role: 'MERCHANT' });
      if (!merchant) return res.status(404).json({ error: 'Invalid merchantKey' });
  
      // 2. Verify Cryptographic Signature
      if (!verifySignature(req.body, signature, merchant.merchantConfig.merchantSecret)) {
        return res.status(403).json({ error: 'Invalid payload signature' });
      }
  
      const product = await Product.findOne({ sku });
      const productName = product ? product.name : sku;
      const merchantName = merchant.merchantConfig?.merchantName || merchant.email || 'Verified Merchant';

      // 3. Authenticate Buyer
      const buyer = await User.findOne({ 'buyerConfig.buyerKey': buyerKey, role: 'BUYER' });
      if (!buyer) return res.status(401).json({ error: 'Invalid x-buyer-key credentials' });
  
      // 3.5. Enforce Fulfillment Readiness (Shipping Address)
      if (!buyer.buyerConfig.shippingProfiles || buyer.buyerConfig.shippingProfiles.length === 0) {
        return res.status(400).json({ error: 'BLOCKED: No shipping address configured on Buyer account.' });
      }
    const defaultShipping = buyer.buyerConfig.shippingProfiles[0];

    // 3.8. Evaluate Timezone Reset
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const lastResetStr = buyer.buyerConfig.lastResetDate ? buyer.buyerConfig.lastResetDate.toISOString().split('T')[0] : null;

    if (lastResetStr !== todayStr) {
      buyer.buyerConfig.spentToday = 0;
      buyer.buyerConfig.lastResetDate = now;
      await buyer.save();
    }

      // 4. Evaluate Policy: Buyer Budget
      if (buyer.buyerConfig.spentToday + lineTotal > buyer.buyerConfig.dailyBudgetLimit) {
        const log = await AuditLog.create({
          auditId: `aud_${uuidv4()}`,
          buyerId: buyer.userId, merchantId: merchant.userId, sku, productName, merchantName, qty, amount: lineTotal,
          status: 'GATED_1_CLICK', blockReason: 'daily_limit_exceeded',
          idempotencyKey, sdkSignature: signature, shippingAddress: defaultShipping
        });
        
        // Removed Email and 2FA: Purely "Human-in-the-Loop" Dashboard Approval
        return res.json({ status: 'GATED_1_CLICK', auditId: log.auditId });
      }

      // 5. Evaluate Policy: Merchant Risk Tiers
      const rules = merchant.merchantConfig.firewallRules;
      let verdict = 'AUTO_APPROVED';
      
      // Removed GATED_2FA completely. Force everything over the limit to 1-Tap UI Approval.
      if (lineTotal >= rules.autoApproveUnder) {
         verdict = 'GATED_1_CLICK';
      }

    // 6. Generate Pending Audit Log
    const auditId = `aud_${uuidv4()}`;
    let razorpayOrderId = null;

    // If AUTO_APPROVED, generate the real order immediately
    if (verdict === 'AUTO_APPROVED') {
      try {
        const order = await createRazorpayOrder(merchant, lineTotal, auditId);
        razorpayOrderId = order.id;

        // Auto-Charge via Razorpay Token!
        if (buyer.buyerConfig.isPaymentLinked && buyer.buyerConfig.paymentToken) {
          console.log(`[Auto-Billing] Charging Token ${buyer.buyerConfig.paymentToken} for ₹${lineTotal}...`);
          // Note: In production we would call Razorpay.payments.create({ amount, currency, customer_id, token_id, ... })
          // We simulate successful capture:
          
          buyer.buyerConfig.spentToday += lineTotal;
          await buyer.save();
          
          await Product.updateOne(
            { sku, merchantId: merchant.userId },
            { $inc: { stock: -qty } }
          );

          const log = await AuditLog.create({
            auditId, buyerId: buyer.userId, merchantId: merchant.userId, sku, productName, merchantName, qty, amount: lineTotal,
            status: 'PAYMENT_CAPTURED',
            idempotencyKey, sdkSignature: signature, shippingAddress: defaultShipping,
            razorpayOrderId,
            privacyReceipt: {
              timestamp: new Date().toISOString(),
              merchantName: merchant.email,
              total: lineTotal,
              gateway: 'Razorpay Token Auto-Billing'
            }
          });

          return res.json({ status: 'PAYMENT_CAPTURED', auditId: log.auditId, razorpayOrderId });
        }
      } catch (err) {
        console.error('Razorpay Error:', err);
        return res.status(500).json({ error: 'Failed to create Razorpay order' });
      }
    }

    const log = await AuditLog.create({
      auditId, buyerId: buyer.userId, merchantId: merchant.userId, sku, productName, merchantName, qty, amount: lineTotal,
      status: verdict === 'AUTO_APPROVED' ? 'ORDER_CREATED' : verdict,
      idempotencyKey, sdkSignature: signature, shippingAddress: defaultShipping,
      razorpayOrderId
    });

    return res.json({ status: verdict, auditId: log.auditId, razorpayOrderId });

  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: 'Idempotency key collision.' });
    console.error('[Trust Engine] Verify Intent Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};



export const approveTransaction = async (req, res) => {
  try {
    const { auditId } = req.body;
    const log = await AuditLog.findOne({ auditId });
    if (!log) return res.status(404).json({ error: 'Not found' });
    
    // Check if already approved/paid to prevent overwriting status
    if (log.status === 'PAYMENT_CAPTURED') {
       return res.status(400).json({ error: 'Transaction already paid' });
    }
    if (log.status === 'ORDER_CREATED' && log.razorpayOrderId) {
       const merchant = await User.findOne({ userId: log.merchantId });
       const rzpKeyId = merchant?.merchantConfig?.razorpayKeyId || process.env.RAZORPAY_KEY_ID;
       return res.json({ success: true, status: 'ORDER_CREATED', razorpayOrderId: log.razorpayOrderId, amount: log.amount, keyId: rzpKeyId });
    }

    const merchant = await User.findOne({ userId: log.merchantId });
    if (!merchant) return res.status(404).json({ error: 'Merchant not found' });

    // Generate real Razorpay Order
    const order = await createRazorpayOrder(merchant, log.amount, log.auditId);
    
    log.status = 'ORDER_CREATED';
    log.razorpayOrderId = order.id;
    await log.save();
    
    const rzpKeyId = merchant.merchantConfig?.razorpayKeyId || process.env.RAZORPAY_KEY_ID;
    res.json({ success: true, status: 'ORDER_CREATED', razorpayOrderId: order.id, amount: log.amount, keyId: rzpKeyId });
  } catch (error) {
    console.error('[Approve] Error:', error);
    res.status(500).json({ error: 'Approval failed' });
  }
};

export const denyTransaction = async (req, res) => {
  try {
    const { auditId } = req.body;
    const log = await AuditLog.findOne({ auditId });
    if (!log) return res.status(404).json({ error: 'Not found' });
    log.status = 'BLOCKED';
    log.blockReason = 'Manual Deny';
    await log.save();
    res.json({ success: true, status: 'BLOCKED' });
  } catch (error) {
    res.status(500).json({ error: 'Deny failed' });
  }
};