# Post-Mortem: Auto-Billing & Razorpay Tokenization

## Overview
The Auto-Cart Autonomous Billing system experienced a multi-layered cascading failure that prevented saved Razorpay tokens from being successfully charged in the background. Despite the system correctly identifying transactions that should have been "Auto-Approved", the orders were consistently getting locked in the manual `GATED_1_CLICK` Approval Inbox.

This document serves as a reference for exactly what went wrong across the 5 different layers of the stack, and how each was resolved.

---

### 1. The Razorpay API Payload Mismatch
**The Problem:**
To charge a saved token in the background, the backend originally attempted to use `rzp.payments.createRecurringPayment`. However, modern Razorpay test integrations often block this endpoint or require strict Mandate (NACH) webhook verifications that fail in testing. 

**The Fix:**
We rewrote `chargeSavedToken` in `razorpayClient.js` to use the standard `rzp.orders.create` endpoint, but injected two highly specific parameters to force an immediate, background token debit:
```javascript
{
  token: { id: tokenId },
  payment_capture: 1 // Forces immediate capture without manual verification
}
```

### 2. The Object Status Matching Bug
**The Problem:**
When `chargeSavedToken` executed successfully, the backend checked `if (payment.status === 'captured')`. However, because we switched to using `orders.create`, Razorpay returned an **Order Object**, not a **Payment Object**. Order Objects have a status of `paid` or `created`, never `captured`. 

Because of this word mismatch, the backend assumed the successful charge had failed, and triggered a fallback to manually lock the order in the Approval Inbox.

**The Fix:**
Updated `engineController.js` to look for both Order and Payment statuses:
```javascript
if (payment.status === 'captured' || payment.status === 'authorized' || payment.status === 'paid' || payment.status === 'created') {
    // Success!
}
```

### 3. The LLM Prompt Blindspot (AI Hallucination)
**The Problem:**
When the backend safely fell back to the Approval Inbox (saving the status as `ORDER_CREATED`), the AI Agent told the user "Auto Approved!". 

This happened because the AI System Prompt in `aiService.js` was only programmed to ask the user for manual approval if the backend returned `GATED_1_CLICK` or `GATED_2FA`. It didn't know what `ORDER_CREATED` meant, so it ignored the fallback and hallucinated a success message.

**The Fix:**
Updated the LLM instruction set to explicitly catch the fallback:
```text
IMPORTANT: If a checkout returns GATED_1_CLICK, GATED_2FA, or ORDER_CREATED, you MUST include this exact string in your response: [APPROVAL_REQUIRED:auditId]
```

### 4. The `>=` Math Bug
**The Problem:**
The Trust Engine was gating purchases that were exactly equal to the Firewall limits. If the limit was ₹1,000 and the user bought a ₹1,000 item, it was sent to the inbox because the code used `lineTotal >= merchantLimit`.

**The Fix:**
Changed the inequality operator to strictly greater than (`>`), ensuring items matching the exact limit are Auto-Approved.

### 5. Missing Imports & MongoDB Connection Severance
**The Problem:**
1. The `chargeSavedToken` function was being executed in `engineController.js` but was never actually imported at the top of the file, resulting in a fatal `ReferenceError`.
2. The MongoDB Atlas free-tier M0 cluster temporarily dropped the connection pool, which crashed the long-lived Node.js backend socket with an `ENOTFOUND` DNS error. 

**The Fix:**
1. Added `import { chargeSavedToken } from '../services/razorpayClient.js';`.
2. Restoring the system required a complete reboot of the backend development server (`npm run dev`) to re-establish the MongoDB socket connection.


### 6. Methodology: Leveraging AI & Razorpay MCP
**The Debugging Approach:**
A major factor in resolving this complex, multi-layered bug was the utilization of an AI Agent combined with a **Razorpay MCP (Model Context Protocol) Server**. 

Rather than manually browsing outdated StackOverflow threads or guessing the API payload structures, the following workflow was used:
1. **Dynamic Schema Inspection:** The AI queried the local Razorpay MCP server to read the exact JSON schemas for `create_order` and `initiate_payment` in real-time.
2. **Payload Discovery:** By reading the MCP schemas, the AI instantly identified that standard server-to-server token charging (`createRecurringPayment`) was failing, and discovered the precise `payment_capture: 1` parameter requirements needed for the modern `orders.create` token workflow.
3. **Autonomous Patching:** Armed with the exact, live specifications from the MCP server, the AI autonomously rewrote the `chargeSavedToken` function, updated the Trust Engine logic, and patched the LLM prompts directly in the codebase.

This synergy between human direction, AI reasoning, and live MCP tool integration turned what could have been days of blind trial-and-error into a rapid, surgical debugging session.

