// src/app.js
// Express application entry point — SafeAgent Gateway
//
// CRITICAL MOUNT ORDER:
//   1. /api/webhook uses express.raw() so req.body is a Buffer for HMAC verification.
//      It MUST be mounted BEFORE express.json(), otherwise the parsed object overwrites
//      the Buffer and signature verification always fails.
//   2. express.json() then covers all remaining routes normally.

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { connectDB } from './config/db.js';
import webhookRoutes   from './routes/webhookRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import engineRoutes    from './routes/engineRoutes.js';

const app = express();

// ── Security Headers ──────────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());

// ── [ORDER MATTERS] Webhook raw-body parser BEFORE global JSON parser ─────────────────────
// express.raw() captures the body as a Buffer so the webhook controller can compute
// the HMAC-SHA256 against the exact bytes Razorpay signed.
app.use('/api/webhook', express.raw({ type: '*/*' }), webhookRoutes);

// ── Global JSON body parser (all other routes) ───────────────────────────────────────────
app.use(express.json());

// ── Health Check ──────────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'SafeAgent Gateway',
    ts: new Date().toISOString(),
    simulateGatewayFailure: process.env.SIMULATE_GATEWAY_FAILURE === 'true',
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────────────────
app.use('/api/dashboard', dashboardRoutes);  // GET  /api/dashboard/logs    (x-merchant-key)
                                              // GET  /api/dashboard/metrics (x-merchant-key)
                                              // GET  /api/dashboard/mandate (x-merchant-key)
app.use('/api/engine',    engineRoutes);     // POST /api/engine/verify-intent & /commit
// Note: /api/webhook is already mounted above the JSON parser

// ── 404 Fallback ──────────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global Error Handler ───────────────────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// ── Bootstrap ─────────────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[APP] SafeAgent Gateway running on http://localhost:${PORT}`);
    console.log(`[APP] SIMULATE_GATEWAY_FAILURE=${process.env.SIMULATE_GATEWAY_FAILURE}`);
  });
});

export default app;
