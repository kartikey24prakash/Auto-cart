# Auto-Cart: End-to-End Flow Audit

This document maps out the complete production lifecycle of an Auto-Cart transaction—from the moment a merchant decides to sell a product, to the moment a buyer's AI agent successfully purchases it. 

For each step, we rigorously audit whether the feature is **[BUILT]**, **[PARTIALLY BUILT]**, or **[NOT BUILT]** in our current codebase.

---

## Phase 1: Merchant Configuration & Catalogue Indexing

The goal of this phase is for the merchant to make their products securely available to the global network of AI Buyers.

### Step 1.1: Account Creation & Onboarding
- **The Flow:** The merchant visits the landing page, clicks "Merchant SDK", and creates an account.
- **Status:** **[BUILT]** 
  - *Location:* \`AuthPage.jsx\` securely registers the user with a \`MERCHANT\` role and issues a JWT.

### Step 1.2: Cryptographic Key Generation
- **The Flow:** The merchant accesses their dashboard to retrieve their \`MERCHANT_KEY\` and \`MERCHANT_SECRET\`.
- **Status:** **[BUILT]** 
  - *Location:* \`MerchantKeys.jsx\` provides a UI to copy these keys securely.

### Step 1.3: SDK Installation & Storefront Setup
- **The Flow:** The merchant installs the \`@autocart/sdk\` via NPM into their own Node.js backend. They initialize the SDK with their secret keys and expose a \`/autocart/checkout\` route.
- **Status:** **[BUILT]** 
  - *Location:* The production-ready SDK exists in \`packages/sdk/\`, and a simulated implementation exists in \`mock-storefront/server.js\`.

### Step 1.4: Catalogue Display & Indexing
- **The Flow:** Instead of merchants manually typing products into our dashboard, the Auto-Cart Central Hub periodically pings the merchant's SDK to index their live catalogue into the global AI search engine.
- **Status:** **[PARTIALLY BUILT]** 
  - *What we have:* The merchant can manually add products via \`MerchantCatalog.jsx\`, which saves to our central MongoDB. 
  - *What is missing:* We do not have the automated cron-job to scrape the SDK's \`/catalog\` route.

---

## Phase 2: Buyer Configuration

The goal of this phase is for the buyer to set strict financial boundaries before letting their AI loose on the internet.

### Step 2.1: Mandate & Firewall Setup
- **The Flow:** The buyer logs in and configures a "Daily Budget Limit" (e.g., ₹5000) and their default Shipping Address.
- **Status:** **[BUILT]** 
  - *Location:* \`BuyerSettings.jsx\` allows configuring both the Mandate and the Shipping profile, saving it to MongoDB via \`/api/dashboard/mandate\`.

### Step 2.2: Buyer Tooling Plugin
- **The Flow:** A developer building a custom LangChain AI installs \`@autocart/ai-tools\` and configures it with their \`BUYER_KEY\`.
- **Status:** **[PARTIALLY BUILT]** 
  - *What we have:* The NPM package exists in \`packages/ai-tools/\`.
  - *What is missing:* We have not added a UI section in the Buyer Dashboard to let them easily copy their \`BUYER_KEY\`.

---

## Phase 3: The Autonomous Purchase Flow

This is the core loop where the AI actually buys the product.

### Step 3.1: Intent & Search
- **The Flow:** The buyer tells their AI (via the Auto-Cart Chat Hub or their own UI) to buy a specific item (e.g., "Buy the Snitch oversized jacket"). The AI uses the \`search_catalog\` tool to find the SKU.
- **Status:** **[BUILT]** 
  - *Location:* The LangChain ReAct agent in \`aiService.js\` successfully queries the central catalogue.

### Step 3.2: The Cryptographic Handshake
- **The Flow:** 
  1. The AI calls the \`autocart_checkout\` tool.
  2. The Auto-Cart Trust Engine pings the Merchant's external storefront.
  3. The Merchant's SDK looks up the real-time price in their private DB and signs the payload with their \`merchantSecret\`.
  4. The payload is sent back to the Auto-Cart Trust Engine.
- **Status:** **[BUILT]** 
  - *Location:* \`aiService.js\` executes this exact sequence, communicating perfectly with \`mock-storefront/server.js\`.

### Step 3.3: Firewall Validation
- **The Flow:** The Trust Engine intercepts the signed payload. It verifies the HMAC signature. It then checks if the signed price exceeds the Buyer's Daily Budget.
- **Status:** **[BUILT]** 
  - *Location:* \`backend/src/controllers/engineController.js\` securely validates the cryptographic signature and checks the Mandate limits.

---

## Phase 4: Resolution & Approvals

### Step 4.1: Auto-Approval (Under Budget)
- **The Flow:** If the price is under the budget, the transaction is marked \`ORDER_CREATED\`.
- **Status:** **[BUILT]**

### Step 4.2: Gated Approval (Over Budget)
- **The Flow:** If the price exceeds the budget, the transaction is halted (\`GATED_1_CLICK\`).
- **Status:** **[BUILT]** 
  - *Location:* The transaction is securely parked in MongoDB.

### Step 4.3: Out-of-Band Notification
- **The Flow:** The backend instantly pings the buyer's WhatsApp with an "Approve / Deny" button.
- **Status:** **[NOT BUILT]** 
  - *Location:* Currently sitting as Task #8 on our roadmap.

### Step 4.4: Manual Override
- **The Flow:** The buyer goes to their Approval Inbox, reviews the cryptographically signed price, and clicks "Approve".
- **Status:** **[BUILT]** 
  - *Location:* \`ApprovalQueuePage.jsx\` flawlessly renders pending transactions and allows 1-click approvals.
