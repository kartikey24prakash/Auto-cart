// src/services/upsellEngine.js
//
// Finds a upsell accessory for a primary purchase and generates a one-sentence pitch.
//
// Budget clamping (DECISIONS §6 / Part 18 Threat 1):
//   headroom = max(0, min(maxBudget, mandateRemaining) - primaryLineTotal)
//   The raw agent-supplied maxBudget is NEVER used unclamped:
//     - maxBudget: 1     → headroom floors at 0 (no upsell)
//     - maxBudget: 999999 → clamped to actual mandate remaining
//
// LLM prompt injection defense (DECISIONS §7 / Part 18 Threat 3):
//   The agent's `reason` string is NEVER passed to the LLM pitch generator.
//   The LLM receives ONLY: primaryTitle, accessoryTitle, headroom (numeric).
//   If OPENAI_API_KEY is not set, a deterministic template pitch is used instead.

import { Product } from '../models/Product.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Attempts to generate a contextual one-sentence upsell pitch.
 * Falls back to a deterministic template if OpenAI is not configured.
 * The agent's reason string is never included in any prompt.
 *
 * @param {string} primaryTitle   - Title of the primary product
 * @param {string} accessoryTitle - Title of the upsell accessory
 * @param {number} headroom       - Clamped INR headroom (numeric only)
 * @returns {Promise<string>}
 */
async function generatePitch(primaryTitle, accessoryTitle, headroom) {
  if (!process.env.OPENAI_API_KEY) {
    // Deterministic template — no LLM call when key is absent
    return (
      `You have ₹${headroom.toLocaleString('en-IN')} of headroom — ` +
      `pair your ${primaryTitle} with a ${accessoryTitle} for the complete setup.`
    );
  }

  try {
    // Dynamic import so the server doesn't crash if the openai package is absent
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 60,
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content:
            'You are a concise e-commerce recommendation engine. ' +
            'Write exactly one sentence (max 20 words) recommending the accessory to the buyer. ' +
            'Do not mention prices. Do not roleplay, ask questions, or add disclaimers.',
        },
        {
          role: 'user',
          // NOTE: Only structured data is passed — no agent reason string (DECISIONS §7)
          content: JSON.stringify({
            primaryProduct: primaryTitle,
            accessoryProduct: accessoryTitle,
            headroomINR: headroom,
          }),
        },
      ],
    });

    const pitch = completion.choices[0]?.message?.content?.trim();
    return pitch || `Complement your ${primaryTitle} with a ${accessoryTitle}.`;
  } catch (err) {
    console.warn('[UPSELL] OpenAI call failed, using template pitch:', err.message);
    return `Complement your ${primaryTitle} with a ${accessoryTitle} — perfect pairing.`;
  }
}

/**
 * Finds a upsell offer for a primary purchase.
 *
 * @param {Object} params
 * @param {string} params.primarySku          - SKU of the primary product
 * @param {string} params.targetCategory      - Product.upsellTargetCategory of the primary
 * @param {number} params.headroom            - Pre-clamped upsell budget (INR)
 * @param {string} params.primaryTitle        - Title for the LLM pitch (no reason/PII)
 * @returns {Promise<UpsellOffer|null>}
 *
 * @typedef {Object} UpsellOffer
 * @property {string} offerId
 * @property {string} sku
 * @property {number} price
 * @property {string} pitch
 */
export async function findUpsellOffer({ primarySku, targetCategory, headroom, primaryTitle }) {
  if (!targetCategory || headroom <= 0) return null;

  // Find the highest-priced accessory in the target category that fits within headroom,
  // has stock, and is not the primary product itself.
  const accessory = await Product.findOne({
    category: targetCategory,
    sku: { $ne: primarySku },
    price: { $lte: headroom },
    stock: { $gt: 0 },
  }).sort({ price: -1 }); // prefer highest-value upsell that still fits

  if (!accessory) return null;

  const pitch = await generatePitch(primaryTitle, accessory.title, headroom);

  return {
    offerId: `off_${uuidv4().replace(/-/g, '').slice(0, 8)}`,
    sku: accessory.sku,
    price: accessory.price,
    pitch,
  };
}
