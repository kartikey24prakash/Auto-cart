import { Chat } from '../models/Chat.js';
import { Message } from '../models/Message.js';
import mongoose from 'mongoose';

export const getChats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const chats = await Chat.find({ userId }).sort({ updatedAt: -1 });
    res.json({ chats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createChat = async (req, res) => {
  try {
    const userId = req.user.userId;
    const chat = await Chat.create({ userId });
    res.status(201).json({ chat });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getChatMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    const chat = await Chat.findOne({ _id: id, userId });
    if (!chat) return res.status(404).json({ error: 'Chat not found' });

    const messages = await Message.find({ chat: id }).sort({ createdAt: 1 });
    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
