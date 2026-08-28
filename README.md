<div align="center">
  <h1>🛒 AutoCart Network</h1>
  <h3>The Zero-Trust B2B Payment Gateway for AI Agents</h3>

  <p align="center">
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
    <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" />
    <img src="https://img.shields.io/badge/Razorpay-02042B?style=for-the-badge&logo=razorpay&logoColor=3395FF" />
    <img src="https://img.shields.io/badge/Twilio-F22F46?style=for-the-badge&logo=twilio&logoColor=white" />
    <img src="https://img.shields.io/badge/LangChain-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white" />
  </p>
</div>

---

## 🤖 What does it do? (The "Explain it to me like I'm 5" version)

Imagine you tell your AI Assistant: *"Our company is running out of cloud storage. Find the best deal and buy 500GB."*

Normally, the AI can't do this. It can't click through visual checkout screens, solve CAPTCHAs, or receive an SMS OTP to approve a credit card charge. **AutoCart fixes this.** 

AutoCart is a headless network where **AI agents can autonomously search for products and purchase them for you**, while remaining securely trapped inside a cryptographic budget firewall so they can never spend more money than you authorize.

---

## 🎯 The Problem
By 2026, AI Agents will handle the majority of B2B procurement. However, the current financial internet is built for humans. 

Furthermore, **trust is fundamentally broken** in agent-to-agent commerce:
1. **For the Buyer:** How do you prevent your AI from hallucinating and spending $10,000 on a product? How does the AI know the merchant isn't a scammer?
2. **For the Merchant:** How do you accept automated API payments without humans, while verifying the AI actually has the authority to spend the company's money?

---

## 💡 How does this Benefit Merchants?
Merchants who integrate AutoCart unlock a massive new revenue stream that is currently impossible to capture on traditional e-commerce platforms. 
- **Zero-Friction Sales:** AI buyers don't abandon their shopping carts, get distracted, or need marketing funnels. If your product matches their requirements, they execute the JSON payload and buy it instantly.
- **New Revenue Channels:** By exposing an "Agent-Readable Catalog," you tap into a global network of corporate AI assistants doing automated B2B procurement.
- **Guaranteed Settlement:** Through Razorpay Tokenization and AutoCart's Trust Engine, merchants are guaranteed that the AI buyer has pre-authorized the funds *before* the API payload hits their server. 

---

## 🤖↔️🤖 How AI-to-AI Commerce is Enabled

AutoCart solves the "Global Protocol Race" by acting as the **Trust Engine** sitting perfectly between the Buyer AI and the Merchant Server.

1. **The Merchant Side:** A merchant configures their catalog and Razorpay Linked Account on the AutoCart Dashboard. Our system acts as an "Agent-Readable Catalog" that synchronizes their products globally.
2. **The Buyer Side:** A corporate Buyer AI (using LangChain) queries the global catalog via our API. It finds the best product and sends a cryptographic `buy` payload.
3. **The Trust Engine:** Before the transaction reaches the merchant, the AutoCart Trust Engine intercepts the payload. It checks the buyer's `dailyBudgetLimit`, verifies the merchant's KYC status, and cryptographically signs the transaction via HMAC-SHA256. If everything passes, the AI-to-AI transaction executes in milliseconds.

---

## 🚀 The Solution: A Dual-Sided SDK Protocol

AutoCart provides tools for both sides of the marketplace:

### 1. For AI Developers (The Buyer Side)
If you are building an AI agent (using LangChain or OpenAI), you can use our `@autocart/ai-tools` package. It gives your AI the superpower to query our global catalog and execute secure API purchases.

**How to use it:**
```javascript
import { createReactAgent } from "@langchain/langgraph";
import { AutoCartSearchTool, AutoCartBuyerTool } from "@autocart/ai-tools";

// 1. Initialize the AutoCart Tools
const searchTool = new AutoCartSearchTool();
const buyTool = new AutoCartBuyerTool({ buyerKey: 'buyer_secret_key' });

// 2. Inject the tools directly into your AI Model
const agent = createReactAgent({
  llm: mistralModel,
  tools: [searchTool, buyTool] 
});

// 3. Just ask the AI to do the work!
await agent.invoke({ messages: [{ role: "user", content: "Buy 10 enterprise licenses from Microsoft." }]});
// The AI will automatically search the catalog, find the Merchant webhook URL, and execute the purchase securely.
```

### 2. For Merchants (The Seller Side)
If you want to sell products to AI agents, you can't rely on a visual shopping cart. You need to accept automated JSON payloads. By dropping `@autocart/sdk` into your Node.js server, you instantly get a secure "AI Checkout Endpoint".

**How to use it:**
```javascript
import express from 'express';
import { AutoCartGateway } from '@autocart/sdk';

const app = express();

// 1. Initialize the SDK with your Merchant Credentials
const gateway = new AutoCartGateway({
  merchantKey: 'your_merchant_key',
  merchantSecret: 'your_merchant_secret'
});

// 2. The SDK automatically sets up secure POST routes on /autocart
// It validates HMAC-SHA256 signatures, ensuring the AI is authorized to spend the money!
app.use('/autocart', gateway.createRouter());

app.listen(3000, () => console.log('Merchant Server ready to receive AI orders!'));
```

---

## 🛡️ Zero-Trust Security & KYC Features

- 🔐 **Dual-Policy Firewall:** Merchants set `autoApproveUnder` limits. Buyers set `dailyBudgetLimit`. The strictest constraint always wins.
- 📱 **Out-of-Band (OOB) Approvals:** If an AI attempts to exceed the budget, the transaction is safely blocked (`GATED_1_CLICK`). The human supervisor instantly receives a **Twilio WhatsApp message** with a magic approval link to manually override the AI.
- 🏢 **DNS Domain Verification:** Merchant Webhook endpoints are cryptographically verified via native DNS TXT record lookups to prevent domain spoofing and Man-in-the-Middle attacks.
- 🏦 **Razorpay Route (KYC):** Scammers are automatically hidden from the AI Catalog. Only businesses that pass real-world KYC via Razorpay Linked Accounts are visible to AI buyers. Payments are instantly split (98% to Merchant, 2% Platform Fee).

---

## 🏗️ System Architecture

```text
 ┌─────────────────┐             ┌──────────────────┐             ┌─────────────────┐
 │                 │   Search &  │                  │   Sync      │                 │
 │   Buyer's AI    │ ◄─────────► │ AutoCart Gateway │ ◄─────────► │ Merchant Server │
 │  (LangChain)    │     Buy     │   (Trust Engine) │   Catalog   │  (AutoCart SDK) │
 │                 │             │                  │             │                 │
 └───────┬─────────┘             └────────┬─────────┘             └────────┬────────┘
         │                                │                                │
         ▼                                ▼                                ▼
 ┌─────────────────┐             ┌──────────────────┐             ┌─────────────────┐
 │ Twilio (OOB)    │             │   MongoDB Atlas  │             │ Razorpay Route  │
 │ WhatsApp Auth   │             │  Audit & Config  │             │ KYC & Splits    │
 └─────────────────┘             └──────────────────┘             └─────────────────┘
```

---

## 🛠️ How to run locally

### 1. Environment Variables
Clone the repository and configure your `.env` variables based on `.env.example`. You will need keys for MongoDB, Razorpay, Mistral AI, and Twilio.

### 2. Start the AutoCart Central Gateway (Backend)
```bash
cd backend
npm install
npm run start
```

### 3. Start the Dashboard (Frontend)
```bash
cd frontend
npm install
npm run dev
```

### 4. Start the Mock Merchant Server (Testing SDK)
```bash
cd mock-storefront
npm install
node server.js
```

---
*Built with ❤️ for the Razorpay "AI Growth & Agentic Commerce" Hackathon.*
