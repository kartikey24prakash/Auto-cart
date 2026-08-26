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
  if (merchant.merchantConfig.razorpayLinkedAccountId) {
    orderPayload.transfers = [
      {
        account: merchant.merchantConfig.razorpayLinkedAccountId,
        amount: amountPaise - platformFeePaise,
        currency: 'INR',
        notes: { auditId: receiptId },
        on_hold: false
      }
    ];
  }

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