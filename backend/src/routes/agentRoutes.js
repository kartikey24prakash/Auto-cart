// src/routes/agentRoutes.js
import { Router } from 'express';
import { runAgentSimulation } from '../controllers/agentSimulatorController.js';

const router = Router();

// POST /api/agent/run — Interactive AI Buyer Agent Execution
router.post('/run', runAgentSimulation);

export default router;