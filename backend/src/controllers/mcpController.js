// src/controllers/mcpController.js
//
// Model Context Protocol (MCP) Server Endpoint for SafeAgent Gateway.
// Allows any external MCP client (Claude Desktop, Cursor, CrewAI, LangChain) to connect
// directly as an AI Buyer Agent and transact over Razorpay.

import { v4 as uuidv4 } from 'uuid';
import { Product } from '../models/Product.js';
import { AgentMandate } from '../models/AgentMandate.js';
import { evaluatePurchase } from '../services/policyEngine.js';
import { createRazorpayOrder, createRazorpayPaymentLink } from '../services/razorpayClient.js';
import { AuditLog } from '../models/AuditLog.js';

export const getMcpTools = async (_req, res) => {
  return res.json({
    protocol: 'model-context-protocol',
    version: '2024-11-05',
    serverInfo: {
      name: 'safeagent-razorpay-gateway',
      version: '1.0.0',
      description: 'Deterministic Policy Firewall and Payment Gateway for Autonomous AI Buyers on Razorpay',
    },
    tools: [
      {
        name: 'browse_catalog',
        description: 'Discover available merchant products, authoritative pricing, categories, and real-time inventory counts.',
        inputSchema: {
          type: 'object',
          properties: {
            category: { type: 'string', description: 'Optional category filter' },
          },
        },
      },
      {
        name: 'request_purchase',
        description: 'Submit an authenticated purchase order. Evaluates spending mandates (<Rs 500 Auto, Rs 500-5000 1-Click, >Rs 5000 2FA).',
        inputSchema: {
          type: 'object',
          properties: {
            sku: { type: 'string', description: 'Exact Product SKU' },
            qty: { type: 'integer', description: 'Quantity (>= 1)' },
            maxBudget: { type: 'number', description: 'Advisory budget in INR' },
            reason: { type: 'string', description: 'Natural language justification (min 10 chars)' },
            upsellRef: { type: 'string', description: 'Optional offerId from prior upsell offer' },
          },
          required: ['sku', 'qty', 'maxBudget', 'reason'],
        },
      },
      {
        name: 'request_guest_purchase',
        description: 'Universal guest checkout without a pre-registered key. Returns an instant Razorpay Smart Payment Link (x402).',
        inputSchema: {
          type: 'object',
          properties: {
            sku: { type: 'string', description: 'Product SKU' },
            qty: { type: 'integer', description: 'Quantity (default 1)' },
            reason: { type: 'string', description: 'Justification' },
          },
          required: ['sku'],
        },
      },
      {
        name: 'get_mandate_status',
        description: 'Inspect current daily budget, spent today, and remaining headroom for the agent.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  });
};

export const callMcpTool = async (req, res, next) => {
  try {
    const { name, arguments: args = {}, agentKey = process.env.AGENT_DEMO_KEY || 'agentkey_demo_alpha' } = req.body;

    let result;

    if (name === 'browse_catalog') {
      const query = args.category ? { category: args.category } : {};
      const products = await Product.find(query).select('sku title category price stock aiTags').lean();
      result = { products, total: products.length };
    } else if (name === 'request_purchase') {
      // Find mandate
      const mandate = await AgentMandate.findOne({ apiKey: agentKey });
      if (!mandate) {
        return res.status(401).json({ error: 'Invalid or missing agentKey for authenticated purchase' });
      }

      const product = await Product.findOne({ sku: args.sku });
      if (!product) {
        return res.status(404).json({ error: `Product not found: ${args.sku}` });
      }

      const policy = evaluatePurchase({
        unitPrice: product.price,
        qty: Number(args.qty) || 1,
        stock: product.stock,
        maxPerTx: mandate.maxPerTx,
        dailyLimit: mandate.dailyLimit,
        spentToday: mandate.spentToday,
      });

      const auditId = uuidv4();
      let razorpayOrderId = null;

      if (policy.tier === 'AUTO_APPROVED') {
        const order = await createRazorpayOrder(policy.amount, auditId);
        razorpayOrderId = order.id;
        await Product.findOneAndUpdate({ sku: product.sku }, { $inc: { stock: -args.qty } });
        await AgentMandate.findOneAndUpdate({ agentId: mandate.agentId }, { $inc: { spentToday: policy.amount } });
      }

      const log = new AuditLog({
        auditId,
        agentId: mandate.agentId,
        sku: product.sku,
        qty: Number(args.qty) || 1,
        reason: args.reason,
        amount: policy.amount,
        status: policy.tier === 'AUTO_APPROVED' ? 'ORDER_CREATED' : policy.tier,
        blockReason: policy.blockReason,
        idempotencyKey: uuidv4(),
        razorpayOrderId,
      });
      await log.save();

      result = {
        status: log.status,
        auditId,
        amount: policy.amount,
        blockReason: policy.blockReason,
        explanation: policy.explanation,
        razorpayOrderId,
      };
    } else if (name === 'request_guest_purchase') {
      const product = await Product.findOne({ sku: args.sku });
      if (!product) return res.status(404).json({ error: `Product not found: ${args.sku}` });

      const lineTotal = product.price * (Number(args.qty) || 1);
      const auditId = uuidv4();
      const paymentLink = await createRazorpayPaymentLink(lineTotal, auditId, product.title);

      result = {
        status: 'ORDER_CREATED',
        amount: lineTotal,
        paymentLinkId: paymentLink.id,
        paymentUrl: paymentLink.short_url,
        explanation: 'Guest payment link created. Complete payment via UPI/Card.',
      };
    } else if (name === 'get_mandate_status') {
      const mandate = await AgentMandate.findOne({ apiKey: agentKey }).select('-apiKey');
      result = { mandate };
    } else {
      return res.status(400).json({ error: `Unknown tool: ${name}` });
    }

    return res.json({
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
      isError: false,
    });
  } catch (err) {
    next(err);
  }
};