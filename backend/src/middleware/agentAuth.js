// src/middleware/agentAuth.js
//
// Resolves agent identity from the x-agent-key credential header.
// NEVER reads agentId from the request body (DECISIONS §1 — identity spoofing defense).
//
// On success: attaches req.agent (the full AgentMandate document, freshly reset if
//             a new IST day has started) and calls next().
// On failure: returns 401, NO audit row is created (nothing to attribute it to).
//
// Also handles the IST daily spend reset atomically using findOneAndUpdate with a
// condition on lastResetDate, so two simultaneous requests on a new day cannot both
// race and reset (one wins the conditional update, the other re-fetches the reset doc).

import { AgentMandate } from '../models/AgentMandate.js';

/**
 * Returns today's date string in Asia/Kolkata timezone as YYYY-MM-DD.
 * Used to detect when a new IST day starts and spentToday should reset to 0.
 */
function getISTDateString() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

export const agentAuth = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-agent-key'];

    if (!apiKey) {
      return res.status(401).json({
        error: 'Missing x-agent-key header. Agent identity must be credentialed.',
      });
    }

    // Credential lookup — agentId is derived from this, never from the body
    let mandate = await AgentMandate.findOne({ apiKey });

    if (!mandate) {
      return res.status(401).json({
        error: 'Invalid x-agent-key. Unknown agent credential.',
      });
    }

    // ── IST Daily Spend Reset ──────────────────────────────────────────────────────────
    // Evaluated on every request so the reset boundary is precise to the IST day.
    // Uses a conditional findOneAndUpdate so only one concurrent request performs the reset.
    const todayIST = getISTDateString();

    if (mandate.lastResetDate !== todayIST) {
      const resetMandate = await AgentMandate.findOneAndUpdate(
        // Condition: only update if STILL on an old date (prevents double-reset race)
        { apiKey, lastResetDate: { $ne: todayIST } },
        { $set: { spentToday: 0, lastResetDate: todayIST } },
        { new: true }
      );

      // If resetMandate is null, another concurrent request already reset it —
      // re-fetch to get the authoritative post-reset values.
      mandate = resetMandate ?? (await AgentMandate.findOne({ apiKey }));
    }

    // Attach the resolved mandate to the request. Downstream code uses req.agent.agentId
    // and req.agent.spentToday etc. — never the body.
    req.agent = mandate;
    next();
  } catch (err) {
    next(err);
  }
};
