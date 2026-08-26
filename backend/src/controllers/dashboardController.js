// src/controllers/dashboardController.js
//
// Merchant & Buyer-facing read-only analytics.
// All routes require JWT authentication (jwtMiddleware applied in the route).

import { AuditLog } from '../models/AuditLog.js';
import { User } from '../models/User.js';

// Helper to scope queries by role
const getQueryFilter = (req) => {
  return req.user.role.toUpperCase() === 'MERCHANT' 
    ? { merchantId: req.user.userId } 
    : { buyerId: req.user.userId };
};

// ════════════════════════════════════════════════════════════════════════════════════════
// GET /api/dashboard/logs
// [NEW] Paginated audit stream. Excludes synthetic rows from the live activity view.
// ════════════════════════════════════════════════════════════════════════════════════════
export const getLogs = async (req, res, next) => {
  try {
    const filter = getQueryFilter(req);
    
    // Phase 5: Pagination support
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AuditLog.countDocuments(filter)
    ]);
    
    // Fetch products to get real names
    const { Product } = await import('../models/Product.js');
    const skus = [...new Set(logs.map(l => l.sku))];
    const products = await Product.find({ sku: { $in: skus } }).lean();
    const productMap = products.reduce((acc, p) => ({ ...acc, [p.sku]: p.name }), {});

    // Format for frontend
    const formattedLogs = logs.map(l => ({
      ...l,
      details: { title: productMap[l.sku] || l.sku }
    }));

    return res.json({
      logs: formattedLogs,
      pagination: { 
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
};

// ════════════════════════════════════════════════════════════════════════════════════════
// GET /api/dashboard/metrics
// [NEW] AI upsell conversion rate, policy violation prevention count, AOV comparison.
// ════════════════════════════════════════════════════════════════════════════════════════
export const getMetrics = async (req, res, next) => {
  try {
    const filter = getQueryFilter(req);

    // Run all aggregations in parallel for speed
    const [
      offersIssuedCount,
      offersAcceptedCount,
      preventionAgg,
      baselineAOVAgg,
      aiAssistedAOVAgg,
      statusCountsAgg,
    ] = await Promise.all([
      // 1. Offers issued: rows where offerIssued is not null
      AuditLog.countDocuments({ ...filter, offerIssued: { $ne: null } }),

      // 2. Offers accepted: rows where upsellRef is not null
      AuditLog.countDocuments({ ...filter, upsellRef: { $ne: null } }),

      // 3. Prevention count: BLOCKED + DENIED rows, broken down by blockReason
      AuditLog.aggregate([
        { $match: { ...filter, status: { $in: ['BLOCKED', 'DENIED'] } } },
        {
          $group: {
            _id: { status: '$status', blockReason: '$blockReason' },
            count: { $sum: 1 },
          },
        },
      ]),

      // 4. Baseline AOV
      AuditLog.aggregate([
        {
          $match: {
            ...filter,
            synthetic: true,
            status: { $in: ['ORDER_CREATED', 'PAYMENT_CAPTURED'] },
            upsellRef: null,
          },
        },
        { $group: { _id: null, avgAmount: { $avg: '$amount' }, count: { $sum: 1 } } },
      ]),

      // 5. AI-Assisted AOV
      AuditLog.aggregate([
        {
          $match: {
            ...filter,
            synthetic: false,
            status: { $in: ['ORDER_CREATED', 'PAYMENT_CAPTURED'] },
            upsellRef: { $ne: null },
          },
        },
        { $group: { _id: null, avgAmount: { $avg: '$amount' }, count: { $sum: 1 } } },
      ]),

      // 6. Full status breakdown for the dashboard stats bar
      AuditLog.aggregate([
        { $match: { ...filter, synthetic: { $ne: true } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    // ── Format prevention breakdown ────────────────────────────────────────────────
    const preventionBreakdown = {};
    let preventionTotal = 0;
    for (const row of preventionAgg) {
      const key = row._id.blockReason || row._id.status;
      preventionBreakdown[key] = (preventionBreakdown[key] || 0) + row.count;
      preventionTotal += row.count;
    }

    // ── Format status counts ───────────────────────────────────────────────────────
    const statusCounts = {};
    for (const row of statusCountsAgg) {
      statusCounts[row._id] = row.count;
    }

    const conversionRate =
      offersIssuedCount > 0
        ? parseFloat(((offersAcceptedCount / offersIssuedCount) * 100).toFixed(1))
        : 0;

    return res.json({
      upsell: {
        offersIssued: offersIssuedCount,
        offersAccepted: offersAcceptedCount,
        conversionRate: `${conversionRate}%`,
      },
      policyViolations: {
        total: preventionTotal,
        breakdown: preventionBreakdown,
      },
      aov: {
        baselineINR: baselineAOVAgg[0]?.avgAmount?.toFixed(2) ?? '0.00',
        baselineOrderCount: baselineAOVAgg[0]?.count ?? 0,
        aiAssistedINR: aiAssistedAOVAgg[0]?.avgAmount?.toFixed(2) ?? '0.00',
        aiAssistedOrderCount: aiAssistedAOVAgg[0]?.count ?? 0,
      },
      statusCounts,
    });
  } catch (err) {
    next(err);
  }
};

// ════════════════════════════════════════════════════════════════════════════════════════
// GET /api/dashboard/mandate
// [NEW] Current AgentMandate values + computed spend meters.
// ════════════════════════════════════════════════════════════════════════════════════════
export const getMandate = async (req, res, next) => {
  try {
    // Only Buyers have spending limits in the new multi-tenant design
    if (req.user.role.toUpperCase() !== 'BUYER') {
      return res.json({ mandates: [] });
    }

    const user = await User.findOne({ userId: req.user.userId, role: 'BUYER' }).lean();
    if (!user || !user.buyerConfig) {
      return res.json({ mandates: [] });
    }

    const config = user.buyerConfig;
    const formatted = [{
      agentId: user.userId,
      maxPerTx: config.dailyBudgetLimit, // Fallback if no maxPerTx
      dailyLimit: config.dailyBudgetLimit,
      spentToday: config.spentToday,
      dailyRemaining: Math.max(0, config.dailyBudgetLimit - config.spentToday),
      spentPercent: parseFloat(((config.spentToday / config.dailyBudgetLimit) * 100).toFixed(1)),
      lastResetDate: 'N/A', // To be implemented in Phase 2
      updatedAt: user.updatedAt,
    }];

    return res.json({ mandates: formatted });
  } catch (err) {
    next(err);
  }
};

export const updateMandate = async (req, res, next) => {
  try {
    if (req.user.role.toUpperCase() !== 'BUYER') {
      return res.status(403).json({ error: 'Only buyers can update their mandate' });
    }
    const { dailyLimit } = req.body;
    if (typeof dailyLimit !== 'number' || dailyLimit < 1) {
      return res.status(400).json({ error: 'Invalid dailyLimit' });
    }

    const user = await User.findOne({ userId: req.user.userId, role: 'BUYER' });
    if (!user) return res.status(404).json({ error: 'Buyer not found' });

    user.buyerConfig.dailyBudgetLimit = dailyLimit;
    await user.save();

    res.json({ success: true, dailyLimit: user.buyerConfig.dailyBudgetLimit });
  } catch (err) {
    next(err);
  }
};

export const getShipping = async (req, res, next) => {
  try {
    if (req.user.role.toUpperCase() !== 'BUYER') return res.status(403).json({ error: 'Only buyers can manage shipping profiles' });
    const user = await User.findOne({ userId: req.user.userId, role: 'BUYER' }).lean();
    if (!user) return res.status(404).json({ error: 'Buyer not found' });
    res.json({ shippingProfiles: user.buyerConfig.shippingProfiles || [] });
  } catch (err) {
    next(err);
  }
};

export const updateShipping = async (req, res, next) => {
  try {
    if (req.user.role.toUpperCase() !== 'BUYER') return res.status(403).json({ error: 'Only buyers can manage shipping profiles' });
    const { addressLine1, city, state, postalCode, country } = req.body;
    if (!addressLine1 || !city || !state || !postalCode || !country) {
      return res.status(400).json({ error: 'All address fields are required' });
    }
    const user = await User.findOne({ userId: req.user.userId, role: 'BUYER' });
    if (!user) return res.status(404).json({ error: 'Buyer not found' });
    
    user.buyerConfig.shippingProfiles = [{ addressLine1, city, state, postalCode, country }];
    await user.save();
    res.json({ success: true, shippingProfiles: user.buyerConfig.shippingProfiles });
  } catch (err) {
    next(err);
  }
};

export const getCatalog = async (req, res, next) => {
  try {
    if (req.user.role.toUpperCase() !== 'MERCHANT') return res.status(403).json({ error: 'Only merchants can view catalog' });
    // Need to import Product if not imported
    const { Product } = await import('../models/Product.js');
    const products = await Product.find({ merchantId: req.user.userId }).sort({ createdAt: -1 });
    res.json({ products });
  } catch (err) {
    next(err);
  }
};


export const syncCatalog = async (req, res, next) => {
  try {
    if (req.userRole !== 'MERCHANT') return res.status(403).json({ error: 'Only merchants can sync catalog' });
    const { products } = req.body;
    const { Product } = await import('../models/Product.js');
    // Bulk insert or update
    const ops = products.map(p => ({
      updateOne: {
        filter: { sku: p.sku, merchantId: req.user.userId },
        update: { $set: { name: p.name, price: p.price, stock: p.stock, category: p.category || 'General' } },
        upsert: true
      }
    }));
    await Product.bulkWrite(ops);
    res.json({ success: true, message: 'Catalog synced successfully' });
  } catch (err) {
    next(err);
  }
};


export const getMerchantConfig = async (req, res, next) => {
  try {
    if (req.user.role.toUpperCase() !== 'MERCHANT') return res.status(403).json({ error: 'Only merchants have merchant config' });
    const user = await import('../models/User.js').then(m => m.User.findOne({ userId: req.user.userId }));
    res.json({ config: user.merchantConfig || {} });
  } catch (err) {
    next(err);
  }
};

export const updateMerchantConfig = async (req, res, next) => {
  try {
    if (req.user.role.toUpperCase() !== 'MERCHANT') return res.status(403).json({ error: 'Only merchants can update config' });
    const { storefrontUrl, linkedAccountId } = req.body;
    const user = await import('../models/User.js').then(m => m.User.findOne({ userId: req.user.userId }));
    if (!user.merchantConfig) user.merchantConfig = {};
    if (storefrontUrl !== undefined) user.merchantConfig.storefrontUrl = storefrontUrl;
    if (linkedAccountId !== undefined) user.merchantConfig.linkedAccountId = linkedAccountId;
    await user.save();
    res.json({ success: true, config: user.merchantConfig });
  } catch (err) {
    next(err);
  }
};

