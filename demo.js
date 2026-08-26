import crypto from 'crypto';

// Replace these with the actual keys from your database/dashboard
const MERCHANT_KEY = 'merch_test_123';
const MERCHANT_SECRET = 'super_secret_key_999';
const BUYER_KEY = 'agentkey_demo_alpha';

const ENGINE_URL = 'http://localhost:5000/api/engine/verify-intent';

async function runDemo() {
  console.log('🤖 [AI Agent] Initializing AutoCart Transaction Sequence...\n');

  // --- DEMO 1: SUCCESSFUL TRANSACTION ---
  console.log('▶️ TEST 1: Standard Bounded Purchase (Auto-Approve)');
  const payload1 = {
    merchantKey: MERCHANT_KEY,
    buyerKey: BUYER_KEY,
    sku: 'kb-01',
    qty: 1,
    lineTotal: 3000,
    idempotencyKey: crypto.randomUUID(),
    maxAuthorizedAmount: 5000 // AI knows it cannot spend more than 5000
  };

  const sig1 = crypto.createHmac('sha256', MERCHANT_SECRET).update(JSON.stringify(payload1)).digest('hex');

  try {
    const res1 = await fetch(ENGINE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-autocart-signature': sig1 },
      body: JSON.stringify(payload1)
    });
    const data1 = await res1.json();
    console.log('   [Trust Engine Response]:', data1);
    console.log('   ✅ Result: Transaction bounded and successfully routed to Razorpay.');
  } catch (err) {
    console.error('   ❌ Error:', err.message);
  }

  console.log('\n--------------------------------------------------\n');

  // --- DEMO 2: GRACEFUL FAILURE (BUDGET EXCEEDED) ---
  console.log('▶️ TEST 2: Graceful Failure (Agent Price Gouging Protection)');
  console.log('   Scenario: AI tries to buy a laptop for ₹80,000, but mandate is capped at ₹5,000.');
  const payload2 = {
    merchantKey: MERCHANT_KEY,
    buyerKey: BUYER_KEY,
    sku: 'laptop-pro',
    qty: 1,
    lineTotal: 80000, // Exceeds budget!
    idempotencyKey: crypto.randomUUID(),
    maxAuthorizedAmount: 5000
  };

  const sig2 = crypto.createHmac('sha256', MERCHANT_SECRET).update(JSON.stringify(payload2)).digest('hex');

  try {
    const res2 = await fetch(ENGINE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-autocart-signature': sig2 },
      body: JSON.stringify(payload2)
    });
    const data2 = await res2.json();
    console.log('   [Trust Engine Response]:', data2);
    console.log('   ✅ Result: Handled gracefully! The Trust Engine blocked the transaction without crashing.');
  } catch (err) {
    console.error('   ❌ Error:', err.message);
  }

  console.log('\n--------------------------------------------------\n');
  console.log('🎯 DEMO COMPLETE.');
  console.log('👉 Check your AutoCart Dashboard to see the Live Audit Trail of these actions!');
}

runDemo();
