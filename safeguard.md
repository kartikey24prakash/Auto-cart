# Security Safeguards (AutoCart)

AutoCart is fundamentally a security product designed to prevent "Rogue AI" spending and protect merchants from AI-driven fraud. This document outlines the cryptographic and architectural safeguards implemented.

## 1. Cryptographic Authentication
*   **Constant-Time Verification:** The `authMiddleware` in the Trust Engine does not use simple string equality `===` for API keys. It uses Node's `crypto.timingSafeEqual()`.
*   **Why?** This prevents malicious agents from executing "Timing-Oracle Attacks" (guessing the API key character-by-character based on server response times).
*   **Role Isolation:** The system strictly separates `x-buyer-key` and `x-merchant-key`. Buyers cannot access merchant analytic endpoints, preventing data leaks.

## 2. Immutable Audit Logging
*   **The Receipt System:** Every single time an AI interacts with the Merchant SDK, an `AuditLog` is permanently written to MongoDB *before* the transaction is evaluated. 
*   **Why?** This ensures undeniable cryptographic proof of an AI's intent. Even if a transaction is blocked by the firewall, the log is stored so the human manager (Buyer) can review the AI's exact behavior and IP address in their Approval Inbox.

## 3. The 3-Tier Firewall
Instead of binary "Block vs. Allow", the system uses a scalable risk model:
1.  **Auto-Approve:** For low-risk, everyday purchases (e.g., under ₹500).
2.  **1-Click Gated (`GATED_1_CLICK`):** Holds the transaction and routes it to the Buyer's dashboard for manual review.
3.  **Step-Up Auth (`GATED_2FA`):** For high-risk purchases (e.g., over ₹5,000), physically requiring the human to input a 6-digit TOTP code before the Trust Engine releases the hold.

---

## Future Security Implementations
1. **HMAC-SHA256 Payload Signing:** 
   * *Current state:* The SDK forwards the payload via HTTP POST. 
   * *Goal:* The SDK will sign the payload using the `merchantSecret` and attach an `x-signature` header. The Trust Engine will recompute the hash to guarantee the payload wasn't altered via a Man-in-the-Middle (MITM) attack.
2. **Actual TOTP Verification:** 
   * *Current state:* The 2FA modal accepts any 6-digit code.
   * *Goal:* Integrate a true authenticator flow (like Google Authenticator) where the backend validates the TOTP code against the user's secret before authorizing a `GATED_2FA` transaction.
