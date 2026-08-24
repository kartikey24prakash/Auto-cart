import crypto from 'crypto';
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

export const verifyIntent = async (req, res) => {
  try {
    const signature = req.headers['x-autocart-signature'];
    const { merchantKey, buyerId, sku, qty, lineTotal, idempotencyKey } = req.body;

    if (!signature) {
      return res.status(401).json({ error: 'Missing x-autocart-signature header' });
    }

    // 1. Fetch Merchant to get their secret and firewall rules
    const merchant = await User.findOne({ 'merchantConfig.merchantKey': merchantKey, role: 'MERCHANT' });
    if (!merchant) {
      return res.status(404).json({ error: 'Invalid merchantKey' });
    }

    // 2. Verify Cryptographic Signature
    if (!verifySignature(req.body, signature, merchant.merchantConfig.merchantSecret)) {
      return res.status(403).json({ error: 'Invalid payload signature' });
    }

    // 3. Fetch Buyer to check budget
    const buyer = await User.findOne({ userId: buyerId, role: 'BUYER' });
    if (!buyer) {
      return res.status(404).json({ error: 'Invalid buyerId' });
    }

    // 4. Evaluate Policy: Buyer Budget
    if (buyer.buyerConfig.spentToday + lineTotal > buyer.buyerConfig.dailyBudgetLimit) {
      const log = await AuditLog.create({
        auditId: `aud_${uuidv4()}`,
        buyerId, merchantId: merchant.userId, sku, qty, amount: lineTotal,
        status: 'BLOCKED', blockReason: 'daily_limit_exceeded',
        idempotencyKey, sdkSignature: signature
      });
      return res.json({ status: 'BLOCKED', auditId: log.auditId });
    }

    // 5. Evaluate Policy: Merchant Risk Tiers
    const rules = merchant.merchantConfig.firewallRules;
    let verdict = 'AUTO_APPROVED';
    
    if (lineTotal >= rules.require2FAOver) {
      verdict = 'GATED_2FA';
    } else if (lineTotal >= rules.autoApproveUnder) {
      verdict = 'GATED_1_CLICK';
    }

    // 6. Generate Pending Audit Log
    const log = await AuditLog.create({
      auditId: `aud_${uuidv4()}`,
      buyerId, merchantId: merchant.userId, sku, qty, amount: lineTotal,
      status: verdict === 'AUTO_APPROVED' ? 'ORDER_PENDING_CONFIRM' : verdict,
      idempotencyKey, sdkSignature: signature
    });

    return res.json({ status: verdict, auditId: log.auditId });

  } catch (error) {
    // Handle E11000 duplicate key error for idempotency
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Idempotency key collision. Transaction already processed.' });
    }
    console.error('[Trust Engine] Verify Intent Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const commitTransaction = async (req, res) => {
  try {
    const signature = req.headers['x-autocart-signature'];
    const { auditId, razorpayOrderId } = req.body;

    // To verify this signature, we need the merchant secret. We have to look up the audit log first.
    const log = await AuditLog.findOne({ auditId });
    if (!log) return res.status(404).json({ error: 'Audit record not found' });

    const merchant = await User.findOne({ userId: log.merchantId });
    if (!verifySignature(req.body, signature, merchant.merchantConfig.merchantSecret)) {
      return res.status(403).json({ error: 'Invalid payload signature' });
    }

    // Update the ledger with the Razorpay receipt
    log.status = 'PAYMENT_CAPTURED';
    log.razorpayOrderId = razorpayOrderId;
    log.privacyReceipt = {
      timestamp: new Date().toISOString(),
      merchantName: merchant.email,
      total: log.amount,
      gateway: 'Razorpay Test'
    };
    
    // Also deduct from buyer's budget
    const buyer = await User.findOne({ userId: log.buyerId });
    buyer.buyerConfig.spentToday += log.amount;
    
    await log.save();
    await buyer.save();

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
    
    log.status = 'ORDER_CREATED';
    await log.save();
    
    console.log(`[Approve] Success for ${auditId}`);
    res.json({ success: true, status: 'ORDER_CREATED' });
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