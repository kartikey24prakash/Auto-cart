import express from 'express';
import { getChats, createChat, getChatMessages } from '../controllers/chatController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware); // Protect all chat routes

router.get('/', getChats);
router.post('/', createChat);
router.get('/:id/messages', getChatMessages);

export default router;
