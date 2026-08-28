import express from 'express';
import { searchCatalog } from '../controllers/catalogController.js';

const router = express.Router();

// Publicly accessible to AI agents using the @autocart/ai-tools SDK
router.get('/search', searchCatalog);

export default router;
