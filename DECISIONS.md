# Engineering Decisions (ADR)

This document outlines the core architectural trade-offs, AI boundaries, and failure recovery mechanisms designed into Auto-Cart.

### 1. Problem Taste: Why We Built This
* **The Problem:** The industry is obsessed with building AI agents, but ignores the infrastructure required to let them transact. A B2B merchant cannot simply expose their checkout endpoints to an autonomous LLM because AI hallucinates and can drain budgets instantly.
* **Our Decision:** Instead of building another conversational AI wrapper, we built the underlying **Zero-Trust Infrastructure**. We focused on the unsexy but critical problem of API gating, identity verification (DNS TXT), and out-of-band human approvals.

### 2. AI Judgment: Where We Chose *NOT* To Use AI
* **The Problem:** LLMs are probabilistic. They are excellent at reasoning, but they are dangerous when applied to deterministic financial rules.
* **Our Decision:** We established a strict boundary. We used LangChain and Mistral strictly for **intent parsing** and **catalog search**. However, we explicitly sandboxed the AI away from the authorization layer. The "Trust Firewall" contains absolutely zero AI; it is 100% deterministic Node.js code utilizing HMAC-SHA256 cryptography and Razorpay signature validation. We don't trust the AI; we trust the math.

### 3. Failure Recovery: Graceful Degradation
* **The Problem:** In a multi-step asynchronous flow (AI → Server → Twilio WhatsApp → Human → Razorpay), if the third-party messaging API fails, the entire transaction is permanently blocked.
* **Our Decision:** We built intentional graceful degradation into our notification pipeline. In `backend/src/services/whatsappService.js`, if the Twilio API times out, rate-limits us, or is missing environment variables, the system catches the failure and degrades into "Simulation Mode." It generates the cryptographically signed Magic Link and pipes it securely to the server console/logs. The transaction flow survives the outage.

### 4. Build Quality: Drop-in SDKs over Scripts
* **The Problem:** AI commerce adoption is blocked by integration friction. Asking a merchant to rewrite their backend for AI is unrealistic.
* **Our Decision:** We architected the solution as lightweight, modular NPM packages (`autocart-sdk` and `autocart-ai-tools`). By wrapping standard Express `app.use()` routes, merchants can inject the Zero-Trust gateway in under 10 minutes without altering their legacy database logic. 
