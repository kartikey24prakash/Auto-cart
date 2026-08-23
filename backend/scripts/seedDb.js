// scripts/seedDb.js
// Populates the database with:
//   • 10 tech products (matching Part 25 of the master spec exactly)
//   • 1 AgentMandate (maxPerTx: 30000, dailyLimit: 50000, apiKey: 'agentkey_demo_alpha')
//   • 20 synthetic historical AuditLog rows (synthetic: true, excluded from live stream)
//     These give the AOV metric a baseline so the dashboard doesn't render ₹0.
//
// Run with:   npm run seed
//             (or: node scripts/seedDb.js)

import 'dotenv/config';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

import { connectDB } from '../src/config/db.js';
import { Product } from '../src/models/Product.js';
import { AgentMandate } from '../src/models/AgentMandate.js';
import { AuditLog } from '../src/models/AuditLog.js';

// ── Product Catalog (Part 25) ────────────────────────────────────────────────────────────
// Each entry maps directly to a named demo path from the spec.
const PRODUCTS = [
  {
    // Tier 1 demo: ₹349 → AUTO_APPROVED
    sku: 'prod_usb_c_cable',
    title: 'Braided 65W USB-C Cable',
    category: 'Accessories',
    price: 349,
    stock: 50,
    aiTags: ['charging', 'usb-c', 'braided', '65w'],
    upsellTargetCategory: null,
  },
  {
    // Tier 2 demo: ₹2800 → GATED_1_CLICK; also DENIED demo target
    sku: 'prod_mech_keyboard',
    title: 'RGB Mechanical Keyboard (TKL)',
    category: 'Electronics',
    price: 2800,
    stock: 12,
    aiTags: ['gaming', 'typing', 'hot-swappable', 'rgb'],
    upsellTargetCategory: 'Accessories',
  },
  {
    // Upsell accessory for keyboard; ₹450 → AUTO_APPROVED when accepted
    sku: 'prod_wrist_rest',
    title: 'Ergonomic Wrist Rest',
    category: 'Accessories',
    price: 450,
    stock: 30,
    aiTags: ['ergonomic', 'keyboard', 'comfort'],
    upsellTargetCategory: null,
  },
  {
    // Out-of-stock → FAILED demo. Stock is 0.
    sku: 'prod_nc_headset',
    title: 'Noise-Canceling Headset',
    category: 'Electronics',
    price: 6499,
    stock: 0,
    aiTags: ['noise-canceling', 'wireless', 'headset', 'premium'],
    upsellTargetCategory: null,
  },
  {
    // Mid-tier: ₹1299 → GATED_1_CLICK
    sku: 'prod_power_bank',
    title: '10,000mAh Power Bank',
    category: 'Electronics',
    price: 1299,
    stock: 25,
    aiTags: ['portable', 'charging', 'power-bank'],
    upsellTargetCategory: 'Accessories',
  },
  {
    // Mid-tier: ₹1899 → GATED_1_CLICK
    sku: 'prod_wireless_mouse',
    title: 'Wireless Gaming Mouse',
    category: 'Electronics',
    price: 1899,
    stock: 18,
    aiTags: ['gaming', 'wireless', 'mouse', 'ergonomic'],
    upsellTargetCategory: 'Accessories',
  },
  {
    // Line-total test: qty 2 = ₹998 → GATED_1_CLICK (not AUTO_APPROVED).
    // Unit price ₹499 would auto-approve, but 2 × ₹499 = ₹998 is in tier 2.
    sku: 'prod_mousepad_xl',
    title: 'Mousepad XL',
    category: 'Accessories',
    price: 499,
    stock: 40,
    aiTags: ['gaming', 'mousepad', 'xl', 'desk'],
    upsellTargetCategory: null,
  },
  {
    // Tier 3 demo: ₹24000 → GATED_2FA.
    // Also: 2 × ₹24000 = ₹48000 > maxPerTx ₹30000 → BLOCKED(max_per_tx_exceeded)
    sku: 'prod_4k_monitor',
    title: '27-inch 4K Monitor',
    category: 'Electronics',
    price: 24000,
    stock: 5,
    aiTags: ['4k', 'monitor', 'display', 'productivity', 'gaming'],
    upsellTargetCategory: 'Accessories',
  },
  {
    // ₹1500 → GATED_1_CLICK; upsell target for the monitor
    sku: 'prod_monitor_mount',
    title: 'Monitor Desk Mount',
    category: 'Accessories',
    price: 1500,
    stock: 20,
    aiTags: ['desk-mount', 'monitor', 'ergonomic', 'adjustable'],
    upsellTargetCategory: null,
  },
  {
    // ₹2100 → GATED_1_CLICK
    sku: 'prod_gan_charger',
    title: 'GaN Fast Charger 100W',
    category: 'Electronics',
    price: 2100,
    stock: 35,
    aiTags: ['gan', 'fast-charging', '100w', 'charger', 'compact'],
    upsellTargetCategory: 'Accessories',
  },
];

// ── Mandate (Part 25) ────────────────────────────────────────────────────────────────────
const MANDATE = {
  agentId: 'agent_autonomous_alpha',
  apiKey: process.env.AGENT_DEMO_KEY || 'agentkey_demo_alpha',
  maxPerTx: 30000,
  dailyLimit: 50000,
  spentToday: 0,
  lastResetDate: null,
};

// ── Synthetic Historical Orders (Part 25 / DECISIONS §10) ───────────────────────────────
// ~20 completed orders across a spread of SKUs and amounts.
// Flagged synthetic: true so the live agent activity stream filters them out.
// They exist solely so the AOV baseline metric renders a non-zero number.
//
// We use a realistic mix:
//   • 8 small AUTO_APPROVED orders (cables, accessories) — baseline low-AOV bucket
//   • 7 medium GATED_1_CLICK orders (keyboards, mice, chargers) — mid AOV
//   • 5 high GATED_2FA orders (monitors) — high AOV, some with upsell accepted

function makeSyntheticOrders() {
  const orders = [];
  const agentId = 'agent_autonomous_alpha';

  // Helper to produce a timestamp a given number of days ago
  const daysAgo = (d) => new Date(Date.now() - d * 86400_000).toISOString();

  // ── 8 AUTO_APPROVED (small) ────────────────────────────────────────────────────────
  const smallItems = [
    { sku: 'prod_usb_c_cable',  price: 349,  qty: 1 },
    { sku: 'prod_wrist_rest',   price: 450,  qty: 1 },
    { sku: 'prod_usb_c_cable',  price: 349,  qty: 1 },
    { sku: 'prod_wrist_rest',   price: 450,  qty: 1 },
    { sku: 'prod_usb_c_cable',  price: 349,  qty: 1 },
    { sku: 'prod_mousepad_xl',  price: 499,  qty: 1 }, // unit price < 500, so auto
    { sku: 'prod_wrist_rest',   price: 450,  qty: 1 },
    { sku: 'prod_usb_c_cable',  price: 349,  qty: 1 },
  ];
  smallItems.forEach((item, i) => {
    orders.push({
      auditId: `syn_auto_${i + 1}_${uuidv4().slice(0, 8)}`,
      agentId,
      sku: item.sku,
      qty: item.qty,
      reason: 'Synthetic historical order for AOV baseline computation.',
      amount: item.price * item.qty,
      status: 'ORDER_CREATED',
      blockReason: null,
      totpAttempts: 0,
      idempotencyKey: `syn_auto_${i + 1}_${uuidv4()}`,
      upsellRef: null,
      offerIssued: null,
      synthetic: true,
      razorpayOrderId: `order_syn_auto_${i + 1}`,
      privacyReceipt: {
        dataAccessed: ['catalog_pricing', 'agent_spend_mandate'],
        transmittedToThirdParty: false,
        pii_recorded: null,
      },
      createdAt: daysAgo(Math.floor(Math.random() * 14) + 1),
    });
  });

  // ── 7 GATED_1_CLICK (medium, approved) ─────────────────────────────────────────────
  const midItems = [
    { sku: 'prod_mech_keyboard', price: 2800, qty: 1 },
    { sku: 'prod_wireless_mouse',price: 1899, qty: 1 },
    { sku: 'prod_gan_charger',   price: 2100, qty: 1 },
    { sku: 'prod_power_bank',    price: 1299, qty: 1 },
    { sku: 'prod_monitor_mount', price: 1500, qty: 1 },
    { sku: 'prod_mech_keyboard', price: 2800, qty: 1 },
    { sku: 'prod_gan_charger',   price: 2100, qty: 1 },
  ];
  midItems.forEach((item, i) => {
    // Some mid-tier orders include an upsell offer that was issued but not accepted
    const offerIssued = i % 3 === 0 ? {
      offerId: `off_syn_mid_${i}`,
      sku: 'prod_wrist_rest',
      price: 450,
      pitch: 'Synthetic historical upsell offer.',
    } : null;

    orders.push({
      auditId: `syn_mid_${i + 1}_${uuidv4().slice(0, 8)}`,
      agentId,
      sku: item.sku,
      qty: item.qty,
      reason: 'Synthetic historical order for AOV baseline computation.',
      amount: item.price * item.qty,
      status: 'ORDER_CREATED',
      blockReason: null,
      totpAttempts: 0,
      idempotencyKey: `syn_mid_${i + 1}_${uuidv4()}`,
      upsellRef: null,
      offerIssued,
      synthetic: true,
      razorpayOrderId: `order_syn_mid_${i + 1}`,
      privacyReceipt: {
        dataAccessed: ['catalog_pricing', 'agent_spend_mandate'],
        transmittedToThirdParty: false,
        pii_recorded: null,
      },
      createdAt: daysAgo(Math.floor(Math.random() * 14) + 1),
    });
  });

  // ── 5 GATED_2FA (high-value, approved) — 2 of which accepted the upsell ─────────────
  const highItems = [
    { sku: 'prod_4k_monitor', price: 24000, qty: 1, upsellAccepted: false },
    { sku: 'prod_4k_monitor', price: 24000, qty: 1, upsellAccepted: true },
    { sku: 'prod_4k_monitor', price: 24000, qty: 1, upsellAccepted: false },
    { sku: 'prod_4k_monitor', price: 24000, qty: 1, upsellAccepted: true },
    { sku: 'prod_4k_monitor', price: 24000, qty: 1, upsellAccepted: false },
  ];
  highItems.forEach((item, i) => {
    const offerId = `off_syn_high_${i}`;
    const offerIssued = {
      offerId,
      sku: 'prod_monitor_mount',
      price: 1500,
      pitch: 'Synthetic upsell: pair the monitor with this desk mount.',
    };

    // Primary order
    orders.push({
      auditId: `syn_high_${i + 1}_${uuidv4().slice(0, 8)}`,
      agentId,
      sku: item.sku,
      qty: item.qty,
      reason: 'Synthetic historical order for AOV baseline computation.',
      amount: item.price * item.qty,
      status: 'ORDER_CREATED',
      blockReason: null,
      totpAttempts: 0,
      idempotencyKey: `syn_high_${i + 1}_${uuidv4()}`,
      upsellRef: null,
      offerIssued,
      synthetic: true,
      razorpayOrderId: `order_syn_high_${i + 1}`,
      privacyReceipt: {
        dataAccessed: ['catalog_pricing', 'agent_spend_mandate'],
        transmittedToThirdParty: false,
        pii_recorded: null,
      },
      createdAt: daysAgo(Math.floor(Math.random() * 14) + 1),
    });

    // Upsell-accepted follow-up order (second request_purchase with upsellRef)
    if (item.upsellAccepted) {
      orders.push({
        auditId: `syn_upsell_${i + 1}_${uuidv4().slice(0, 8)}`,
        agentId,
        sku: 'prod_monitor_mount',
        qty: 1,
        reason: 'Synthetic historical upsell acceptance for AOV baseline.',
        amount: 1500,
        status: 'AUTO_APPROVED',
        blockReason: null,
        totpAttempts: 0,
        idempotencyKey: `syn_upsell_${i + 1}_${uuidv4()}`,
        upsellRef: offerId,
        offerIssued: null,
        synthetic: true,
        razorpayOrderId: `order_syn_upsell_${i + 1}`,
        privacyReceipt: {
          dataAccessed: ['catalog_pricing', 'agent_spend_mandate'],
          transmittedToThirdParty: false,
          pii_recorded: null,
        },
        createdAt: daysAgo(Math.floor(Math.random() * 14) + 1),
      });
    }
  });

  return orders;
}

// ── Main ─────────────────────────────────────────────────────────────────────────────────
async function seed() {
  await connectDB();

  console.log('\n[SEED] Clearing existing data…');
  await Promise.all([
    Product.deleteMany({}),
    AgentMandate.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);

  // ── Products ───────────────────────────────────────────────────────────────────────
  console.log('[SEED] Inserting 10 products…');
  const insertedProducts = await Product.insertMany(PRODUCTS);
  console.log(`[SEED] ✓ ${insertedProducts.length} products inserted`);

  // ── Mandate ────────────────────────────────────────────────────────────────────────
  console.log('[SEED] Inserting agent mandate…');
  const mandate = await AgentMandate.create(MANDATE);
  console.log(
    `[SEED] ✓ Mandate created — agentId: ${mandate.agentId} | apiKey: ${mandate.apiKey} | ` +
    `maxPerTx: ₹${mandate.maxPerTx} | dailyLimit: ₹${mandate.dailyLimit}`
  );

  // ── Synthetic Historical Orders ────────────────────────────────────────────────────
  console.log('[SEED] Generating synthetic historical orders…');
  const syntheticOrders = makeSyntheticOrders();

  // insertMany with ordered: false so a single duplicate doesn't abort the batch
  const inserted = await AuditLog.insertMany(syntheticOrders, { ordered: false });
  console.log(`[SEED] ✓ ${inserted.length} synthetic historical orders inserted`);

  // ── Summary ────────────────────────────────────────────────────────────────────────
  console.log('\n[SEED] ─── Demo paths unlocked by this seed ──────────────────────────────');
  console.log('  AUTO_APPROVED   → buy prod_usb_c_cable qty:1  (₹349 < ₹500)');
  console.log('  GATED_1_CLICK   → buy prod_mech_keyboard qty:1 (₹2800)');
  console.log('  GATED_2FA       → buy prod_4k_monitor qty:1   (₹24000)');
  console.log('  FAILED          → buy prod_nc_headset (stock: 0)');
  console.log('  BLOCKED(maxPerTx) → buy prod_4k_monitor qty:2  (₹48000 > ₹30000 ceiling)');
  console.log('  BLOCKED(daily)  → approve two ₹24K monitors, then request any item >₹2K');
  console.log('  DENIED          → request keyboard, then click Deny in the dashboard');
  console.log('  LINE-TOTAL TEST → buy prod_mousepad_xl qty:2  (2×₹499=₹998 → GATED_1_CLICK)');
  console.log('[SEED] ─────────────────────────────────────────────────────────────────────\n');

  await mongoose.disconnect();
  console.log('[SEED] Done. MongoDB connection closed.');
}

seed().catch((err) => {
  console.error('[SEED ERROR]', err);
  mongoose.disconnect();
  process.exit(1);
});
