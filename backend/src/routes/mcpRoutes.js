// src/routes/mcpRoutes.js
import { Router } from 'express';
import { getMcpTools, callMcpTool } from '../controllers/mcpController.js';

const router = Router();

// GET /api/mcp/tools — Discover tools for Claude/Cursor/CrewAI
router.get('/tools', getMcpTools);

// POST /api/mcp/call — Execute a tool call
router.post('/call', callMcpTool);

export default router;