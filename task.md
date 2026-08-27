# Production Checklist (The Hackathon "Wow" Factors)

This is the exact roadmap we outlined to take this from a cool MVP to a bulletproof, enterprise-ready B2B platform.

- [ ] **1. The Razorpay Webhook (Cryptographic Security):** Replace our simulated "success" bypass with a true `/api/webhooks/razorpay` endpoint that validates Razorpay's native `x-razorpay-signature` payload to prove absolute financial integrity.
- [ ] **2. Money Routing (Razorpay Route):** Implement Razorpay Linked Accounts. Right now all funds go to AutoCart. We need to split the payment at checkout, routing 98% directly to the Merchant's bank and keeping a 2% platform fee.
- [ ] **3. SDK Versioning & Distribution:** We need to finalize the `@autocart/sdk` package, add strict TypeScript definitions (`index.d.ts`), and theoretically publish it so merchants can just `npm install`.
- [ ] **4. Buyer Tooling (AI Plugins/Tools):** Finalize the `@autocart/ai-tools` package so that developers building LangChain or OpenAI agents can inject our "shopping plugin" into their agents with one line of code.
- [ ] **5. Database Indexes & Pagination:** Ensure our MongoDB schemas have compound indexes (e.g. `{ merchantId: 1, createdAt: -1 }`) and implement cursor pagination so the dashboard doesn't crash when a merchant gets 100,000 AI queries a day.
- [ ] **7. Developer Documentation Portal:** A world-class `/docs` section where developers can view the API reference, grab their API keys, and read the integration guides for the SDK and AI Plugin.
- [ ] **8. Out-of-Band Approvals (WhatsApp):** (Do this last). The absolute killer feature for the demo. When the AI hits a firewall limit, the Node backend instantly pings the user's phone via WhatsApp with a secure "Approve / Deny" button to bypass the mandate.
