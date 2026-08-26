import { GoogleGenerativeAI } from '@google/generative-ai';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

// 1. Initialize the AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Mocking the Merchant keys for the sake of the demo (in reality, the agent talks to the merchant's server, which holds these)
const MERCHANT_KEY = 'merch_test_123';
const MERCHANT_SECRET = 'super_secret_key_999';
const BUYER_KEY = 'agentkey_demo_alpha';
const ENGINE_URL = 'http://localhost:5000/api/engine/verify-intent';

// 2. Define the Tool (The actual AutoCart SDK implementation for the AI)
const autocartCheckoutTool = {
  name: 'autocart_checkout',
  description: 'Purchases a product from the merchant using AutoCart. Use this when the user explicitly agrees to buy something.',
  parameters: {
    type: 'object',
    properties: {
      sku: { type: 'string', description: 'The exact SKU to purchase (e.g. kb-01, laptop-pro)' },
      qty: { type: 'integer', description: 'Quantity to purchase' },
      lineTotal: { type: 'integer', description: 'The total price of the items in INR' }
    },
    required: ['sku', 'qty', 'lineTotal']
  }
};

async function executeAutoCartCheckout(args) {
  console.log(`\n⚙️  [TOOL EXECUTION] AI is calling AutoCart to buy [${args.qty}x ${args.sku}] for ₹${args.lineTotal}...`);
  
  // The AI Buyer's constraint: It will never authorize a transaction over ₹5,000 natively.
  const payload = {
    merchantKey: MERCHANT_KEY,
    buyerKey: BUYER_KEY,
    sku: args.sku,
    qty: args.qty,
    lineTotal: args.lineTotal,
    idempotencyKey: crypto.randomUUID(),
    maxAuthorizedAmount: 5000 // The AI natively enforces its own budget cap here!
  };

  const signature = crypto.createHmac('sha256', MERCHANT_SECRET).update(JSON.stringify(payload)).digest('hex');

  try {
    const res = await fetch(ENGINE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-autocart-signature': signature },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    return JSON.stringify(data);
  } catch (err) {
    return JSON.stringify({ error: err.message });
  }
}

// 3. The Autonomous Agent Logic
async function runAgent(prompt) {
  console.log(`\n👤 User: "${prompt}"`);
  console.log(`🤖 Agent is thinking...`);

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    tools: [{ functionDeclarations: [autocartCheckoutTool] }]
  });

  const chat = model.startChat({
    systemInstruction: `You are an autonomous AI shopping agent. Your job is to find products and buy them.
    Available catalog:
    - Mechanical Keyboard (SKU: kb-01, Price: ₹3000)
    - MacBook Pro (SKU: laptop-pro, Price: ₹80000)
    If the user asks you to buy something, determine the SKU and Price, and IMMEDIATELY call the autocart_checkout tool.
    Your maximum budget is ₹5,000. DO NOT tell the user you are calling a tool, just do it.`
  });

  const result = await chat.sendMessage(prompt);
  const response = result.response;
  
  const functionCall = response.functionCalls()?.[0];

  if (functionCall && functionCall.name === 'autocart_checkout') {
    const toolResult = await executeAutoCartCheckout(functionCall.args);
    console.log(`\n🔒 [Trust Engine Response]:`, toolResult);
    
    // Pass the result back to the AI so it can summarize
    const finalResult = await chat.sendMessage([{
      functionResponse: { name: 'autocart_checkout', response: JSON.parse(toolResult) }
    }]);
    
    console.log(`\n🤖 Agent: ${finalResult.response.text()}`);
  } else {
    console.log(`\n🤖 Agent: ${response.text()}`);
  }
}

// 4. Run the end-to-end Agent-to-Agent flow!
async function main() {
  console.log('======================================================');
  console.log('   AUTOCART: REAL AI AGENT DEMO (GEMINI + RAZORPAY)   ');
  console.log('======================================================');
  
  // Scenario 1: A successful bounded purchase
  await runAgent("I need a new mechanical keyboard. Just buy it for me.");
  
  console.log('\n------------------------------------------------------');
  
  // Scenario 2: The Agent tries to buy something over budget and the Gateway stops it
  await runAgent("My laptop broke. Buy me a MacBook Pro right now.");
}

main();
