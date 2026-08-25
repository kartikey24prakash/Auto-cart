import crypto from 'crypto';
import Razorpay from 'razorpay';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
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
  if (!merchant.merchantConfig.razorpayKeyId || !merchant.merchantConfig.razorpayKeySecret) {
    throw new Error('Merchant Razorpay keys not configured');
  }
  const rzp = new Razorpay({
    key_id: merchant.merchantConfig.razorpayKeyId,
    key_secret: merchant.merchantConfig.razorpayKeySecret
  });
  return await rzp.orders.create({
    amount: amount * 100, // in paise
    currency: 'INR',
    receipt: receiptId
  });
};

export const verifyIntent = async (req, res) => {
  try {
    const signature = req.headers['x-autocart-signature'];
    const { merchantKey, buyerKey, sku, qty, lineTotal, idempotencyKey } = req.body;

    if (!signature) {
      return res.status(401).json({ error: 'Missing x-autocart-signature header' });
    }

    // 1. Fetch Merchant
    const merchant = await User.findOne({ 'merchantConfig.merchantKey': merchantKey, role: 'MERCHANT' });
    if (!merchant) return res.status(404).json({ error: 'Invalid merchantKey' });

    // 2. Verify Cryptographic Signature
    if (!verifySignature(req.body, signature, merchant.merchantConfig.merchantSecret)) {
      return res.status(403).json({ error: 'Invalid payload signature' });
    }

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
        buyerId: buyer.userId, merchantId: merchant.userId, sku, qty, amount: lineTotal,
        status: 'BLOCKED', blockReason: 'daily_limit_exceeded',
        idempotencyKey, sdkSignature: signature, shippingAddress: defaultShipping
      });
      return res.json({ status: 'BLOCKED', auditId: log.auditId });
    }

    // 5. Evaluate Policy: Merchant Risk Tiers
    const rules = merchant.merchantConfig.firewallRules;
    let verdict = 'AUTO_APPROVED';
    
    if (lineTotal >= rules.require2FAOver) verdict = 'GATED_2FA';
    else if (lineTotal >= rules.autoApproveUnder) verdict = 'GATED_1_CLICK';

    // 6. Generate Pending Audit Log
    const auditId = `aud_${uuidv4()}`;
    let razorpayOrderId = null;

    // If AUTO_APPROVED, generate the real order immediately
    if (verdict === 'AUTO_APPROVED') {
      try {
        const order = await createRazorpayOrder(merchant, lineTotal, auditId);
        razorpayOrderId = order.id;
      } catch (err) {
        console.error('Razorpay Error:', err);
        return res.status(500).json({ error: 'Failed to create Razorpay order' });
      }
    }

    const log = await AuditLog.create({
      auditId, buyerId: buyer.userId, merchantId: merchant.userId, sku, qty, amount: lineTotal,
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

export const commitTransaction = async (req, res) => {
  try {
    const signature = req.headers['x-autocart-signature'];
    const { auditId, razorpayPaymentId, razorpaySignature } = req.body;

    const log = await AuditLog.findOne({ auditId });
    if (!log) return res.status(404).json({ error: 'Audit record not found' });

    const merchant = await User.findOne({ userId: log.merchantId });
    // Localhost Demo Bypass: Since we don't have public webhook URLs, we allow the frontend to simulate it.
    // In production, we remove temp-bypass and Razorpay's cryptographically signed webhook hits this endpoint.
    if (signature !== 'temp-bypass' && !verifySignature(req.body, signature, merchant.merchantConfig.merchantSecret)) {
      return res.status(403).json({ error: 'Invalid payload signature' });
    }

    // Optional: We can verify Razorpay signature here if sent from frontend, 
    // but typically webhook handles final confirmation. We will assume the frontend 
    // sends proof of payment here, or we wait for webhook. 
    // For now, let's just mark it PAYMENT_CAPTURED based on the SDK call.
    log.status = 'PAYMENT_CAPTURED';
    if (razorpayPaymentId) log.razorpayPaymentId = razorpayPaymentId;
    log.privacyReceipt = {
      timestamp: new Date().toISOString(),
      merchantName: merchant.email,
      total: log.amount,
      gateway: 'Razorpay Test'
    };
    await log.save();
    
    await User.updateOne({ userId: log.buyerId, role: 'BUYER' }, { $inc: { 'buyerConfig.spentToday': log.amount } });

    res.json({ success: true });
  } catch (error) {
    console.error('[Trust Engine] Commit Error:', error);
    res.status(500).json({ error: 'Commit failed' });
  }
};

export const approveTransaction = async (req, res) => {
  try {
    const { auditId } = req.body;
    const log = await AuditLog.findOne({ auditId });
    if (!log) return res.status(404).json({ error: 'Not found' });
    
    const merchant = await User.findOne({ userId: log.merchantId });
    if (!merchant) return res.status(404).json({ error: 'Merchant not found' });

    // Generate real Razorpay Order
    const order = await createRazorpayOrder(merchant, log.amount, log.auditId);
    
    log.status = 'ORDER_CREATED';
    log.razorpayOrderId = order.id;
    await log.save();
    
    res.json({ success: true, status: 'ORDER_CREATED', razorpayOrderId: order.id, amount: log.amount, keyId: merchant.merchantConfig.razorpayKeyId });
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