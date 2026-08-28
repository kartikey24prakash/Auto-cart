<div align="center">
  <h1>🛒 AutoCart Network</h1>
  <h3>The Zero-Trust B2B Payment Gateway for AI Agents</h3>

  <p align="center">
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
    <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" />
    <img src="https://img.shields.io/badge/Razorpay-02042B?style=for-the-badge&logo=razorpay&logoColor=3395FF" />
    <img src="https://img.shields.io/badge/LangChain-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white" />
  </p>
</div>

---

## 🎯 The Objective (The Problem)
By 2026, AI Agents will handle the majority of B2B procurement. However, the current financial internet is built for humans, relying on CAPTCHAs, OTPs, and visual checkout UIs. 

Furthermore, **trust is fundamentally broken**. If an AI agent buys a product, how does the buyer know the merchant is a real business? How does the merchant prevent an AI from draining a corporate budget?

## 🚀 The Solution: AutoCart
AutoCart is a headless, dual-sided commerce protocol that solves the "global protocol race" (ACP, AP2). We provide the infrastructure for AI-to-Agent commerce with 100% cryptographic explainability.

1. **For Merchants (`@autocart/sdk`):** A drop-in server SDK to securely receive headless API payments, guarded by a Zero-Trust Firewall (budget limits, 2FA gating).
2. **For AI Developers (`@autocart/ai-tools`):** LangChain-compatible tools that allow your LLM to securely search the global verified catalog and execute Razorpay checkouts with a single line of code.

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

## ✨ Key Features

- 🔐 **Zero-Trust Firewall:** Merchants set `autoApproveUnder` limits. Buyers set `dailyBudgetLimit`. The strict constraint always wins.
- 📱 **Out-of-Band (OOB) Approvals:** If an AI attempts to exceed the budget, the transaction is safely blocked (`GATED_1_CLICK`) and instantly pings the human supervisor via Twilio WhatsApp with a magic approval link.
- 🏢 **DNS Domain Verification:** Merchant Webhook endpoints are cryptographically verified via native DNS TXT record lookups to prevent domain spoofing.
- 🏦 **Razorpay Route (KYC):** Scammers are automatically hidden from the AI Catalog. Only businesses that pass real-world KYC via Razorpay Linked Accounts are visible to AI buyers, with payments instantly split (98% to Merchant, 2% Platform Fee).
- 🧾 **Immutable Audit Trail:** Every API ping, approval, and denial generates an un-deletable cryptographic Privacy Receipt for corporate compliance.

---

## 💻 Developer Experience (DX)

### Inject AutoCart into your LangChain LLM in 1 line:
```javascript
import { createReactAgent } from "@langchain/langgraph";
import { AutoCartSearchTool, AutoCartBuyerTool } from "@autocart/ai-tools";

// Connect to the AutoCart Network
const searchTool = new AutoCartSearchTool();
const buyTool = new AutoCartBuyerTool({ buyerKey: process.env.AUTOCART_BUYER_KEY });

const agent = createReactAgent({
  llm: mistralModel,
  tools: [searchTool, buyTool] // Your AI can now shop securely!
});
```

### Accept AutoCart traffic on your Express server in 1 line:
```javascript
import express from 'express';
import { AutoCartGateway } from '@autocart/sdk';

const app = express();
const gateway = new AutoCartGateway({
  merchantKey: process.env.MERCHANT_KEY,
  merchantSecret: process.env.MERCHANT_SECRET
});

// Automatically handle HMAC verification, catalog syncing, and checkout logic
app.use('/autocart', gateway.createRouter());
```

---

## 🛠️ How to run locally

### 1. Environment Variables
Clone the repository and configure your `.env` variables based on `.env.example`. You will need keys for MongoDB, Razorpay, Mistral AI, and Twilio.

### 2. Start the AutoCart Backend
```bash
cd backend
npm install
npm run start
```

### 3. Start the Frontend Dashboard
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
