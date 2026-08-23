// src/models/AgentMandate.js
// Per-agent spending policy. agentId is ALWAYS derived server-side from apiKey — never
// from the request body. This is what makes the ceilings enforceable (Decision §1).

import mongoose from 'mongoose';

const agentMandateSchema = new mongoose.Schema(
  {
    agentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // x-agent-key value. Unique index enables O(1) credential lookup.
    apiKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    // Hard ceiling per single transaction (line total). Exceeding this → BLOCKED immediately.
    // No human override path exists for a ceiling breach (Decision §2).
    maxPerTx: {
      type: Number,
      required: true,
      min: 0,
    },

    // Hard ceiling for cumulative daily spend. Evaluated in IST (TZ=Asia/Kolkata env var).
    dailyLimit: {
      type: Number,
      required: true,
      min: 0,
    },

    // Atomically incremented at approval time (Decision §3). Never decremented on denial.
    spentToday: {
      type: Number,
      default: 0,
      min: 0,
    },

    // IST date string (YYYY-MM-DD) of the last request. When a new IST day begins,
    // spentToday is reset to 0 and this date is updated.
    lastResetDate: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export const AgentMandate = mongoose.model('AgentMandate', agentMandateSchema);
