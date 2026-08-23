// src/controllers/dashboardController.js
//
// Merchant-facing read-only analytics.
// All routes require x-merchant-key (authMiddleware applied in the route).
//
// GET /api/dashboard/logs    — Paginated audit stream (newest first, synthetic excluded)
// GET /api/dashboard/metrics — Conversion rate, prevention count, AOV comparison
// GET /api/dashboard/mandate — Current mandate + live spend meters

import { AuditLog } from '../models/AuditLog.js';
import { AgentMandate } from '../models/AgentMandate.js';

// ════════════════════════════════════════════════════════════════════════════════════════
// GET /api/dashboard/logs
// [NEW] Paginated audit stream. Excludes synthetic rows from the live activity view.
// ════════════════════════════════════════════════════════════════════════════════════════
export const getLogs = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    // Allow optional filters via query params
    const statusFilter = req.query.status;
    const agentFilter = req.query.agentId;
    const includeSynthetic = req.query.synthetic === 'true'; // default: exclude synthetic

    const query = {
      ...(includeSynthetic ? {} : { synthetic: { $ne: true } }),
      ...(statusFilter && { status: statusFilter }),
      ...(agentFilter && { agentId: agentFilter }),
    };

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 }) // newest first
        .skip(skip)
        .limit(limit)
        .select('-__v')
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    return res.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ════════════════════════════════════════════════════════════════════════════════════════
// GET /api/dashboard/metrics
// [NEW] AI upsell conversion rate, policy violation prevention count, AOV comparison.
// DECISIONS §10: synthetic rows provide the baseline AOV so the metric renders non-zero.
// ════════════════════════════════════════════════════════════════════════════════════════
export const getMetrics = async (req, res, next) => {
  try {
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
      AuditLog.countDocuments({ offerIssued: { $ne: null } }),

      // 2. Offers accepted: rows where upsellRef is not null (the agent accepted a prior offer)
      AuditLog.countDocuments({ upsellRef: { $ne: null } }),

      // 3. Prevention count: BLOCKED + DENIED rows, broken down by blockReason
      AuditLog.aggregate([
        { $match: { status: { $in: ['BLOCKED', 'DENIED'] } } },
        {
          $group: {
            _id: { status: '$status', blockReason: '$blockReason' },
            count: { $sum: 1 },
          },
        },
      ]),

      // 4. Baseline AOV: synthetic historical ORDER_CREATED rows (seeded by seedDb.js)
      //    These represent normal (non-AI-assisted) orders.
      AuditLog.aggregate([
        {
          $match: {
            synthetic: true,
            status: { $in: ['ORDER_CREATED', 'PAYMENT_CAPTURED'] },
            upsellRef: null,
          },
        },
        { $group: { _id: null, avgAmount: { $avg: '$amount' }, count: { $sum: 1 } } },
      ]),

      // 5. AI-Assisted AOV: live rows where the agent accepted an upsell offer
      AuditLog.aggregate([
        {
          $match: {
            synthetic: false,
            status: { $in: ['ORDER_CREATED', 'PAYMENT_CAPTURED'] },
            upsellRef: { $ne: null },
          },
        },
        { $group: { _id: null, avgAmount: { $avg: '$amount' }, count: { $sum: 1 } } },
      ]),

      // 6. Full status breakdown for the dashboard stats bar
      AuditLog.aggregate([
        { $match: { synthetic: { $ne: true } } },
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

    // ── Upsell conversion rate ─────────────────────────────────────────────────────
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
    // Return all mandates (hackathon scope: there is one agent)
    const mandates = await AgentMandate.find({})
      .select('-apiKey -__v') // never expose the credential to the dashboard
      .lean();

    const formatted = mandates.map((m) => ({
      agentId: m.agentId,
      maxPerTx: m.maxPerTx,
      dailyLimit: m.dailyLimit,
      spentToday: m.spentToday,
      dailyRemaining: Math.max(0, m.dailyLimit - m.spentToday),
      spentPercent: parseFloat(((m.spentToday / m.dailyLimit) * 100).toFixed(1)),
      lastResetDate: m.lastResetDate,
      updatedAt: m.updatedAt,
    }));

    return res.json({ mandates: formatted });
  } catch (err) {
    next(err);
  }
};
