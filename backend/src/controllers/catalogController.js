// src/controllers/catalogController.js
//
// GET /api/catalog
// Returns the agent-readable product catalog (Part 21 format).
// Requires x-agent-key (agentAuth middleware applied in the route).
// Price is always read from MongoDB — agent cannot influence it.

import { Product } from '../models/Product.js';

/**
 * Returns all products in the token-lean JSON format designed for LLM consumption.
 * Only in-stock items are returned by default (stock > 0 filter is optional — the
 * out-of-stock headset is intentionally included so the agent can attempt it and
 * receive a FAILED response, demonstrating the failure-mode demo path).
 */
export const getCatalog = async (_req, res, next) => {
  try {
    const products = await Product.find({}).select(
      'sku title category price stock aiTags upsellTargetCategory -_id'
    );

    // Shape response to match the agent-readable format from Part 21
    const catalog = products.map((p) => ({
      sku: p.sku,
      name: p.title,
      price: p.price,
      currency: 'INR',
      stock: p.stock,
      category: p.category,
      ai_tags: p.aiTags,
      upsell_target_category: p.upsellTargetCategory ?? null,
    }));

    return res.json({ catalog, count: catalog.length });
  } catch (err) {
    next(err);
  }
};
