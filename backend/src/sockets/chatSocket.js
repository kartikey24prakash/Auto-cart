import { Server } from 'socket.io';
import { Chat } from '../models/Chat.js';
import { Message as ChatMessage } from '../models/Message.js';
import { aiService } from '../services/aiService.js';
import { User } from '../models/User.js';

let io;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Join a chat room based on chat document ID
    socket.on('join_chat', async ({ userId, chatId }) => {
      socket.join(chatId);
      console.log(`[Socket] User ${userId} joined chat ${chatId}`);
      
      const messages = await ChatMessage.find({ chat: chatId }).sort({ createdAt: 1 });
      
      if (messages.length > 0) {
        socket.emit('chat_history', messages);
      } else {
        // Create system greeting
        const greeting = await ChatMessage.create({
          chat: chatId,
          role: 'ai',
          content: "Hello! I am your Auto-Cart shopping agent. How can I help you find and buy things today?"
        });
        socket.emit('chat_history', [greeting]);
      }
    });

    socket.on('send_message', async ({ userId, chatId, message }) => {
      console.log(`[Socket] Message from ${userId}: ${message}`);
      
      try {
        const user = await User.findOne({ userId, role: 'BUYER' });
        if (!user || !user.buyerConfig) {
          socket.emit('error', { message: 'Invalid buyer profile' });
          return;
        }

        const buyerKey = user.buyerConfig.buyerKey;

        // 1. Save user message to DB
        await ChatMessage.create({ chat: chatId, role: 'user', content: message });

        // 2. Call Gemini AI Service (pass history)
        const messages = await ChatMessage.find({ chat: chatId }).sort({ createdAt: 1 });
        const history = messages.slice(0, -1); // Exclude the message we just added
        
        socket.emit('ai_typing', { isTyping: true });
        
        const aiResponseText = await aiService.generateResponse(history, message, buyerKey);
        
        // 3. Save AI response to DB
        const aiMessage = await ChatMessage.create({ chat: chatId, role: 'ai', content: aiResponseText });

        // Generate title if this is the very first user message
        const userMessageCount = messages.filter(m => m.role === 'user').length;
        if (userMessageCount === 1) {
           await Chat.findByIdAndUpdate(chatId, { title: message.substring(0, 30) + '...' });
           // we could notify frontend to refresh title here
           socket.emit('chat_title_updated', { chatId, title: message.substring(0, 30) + '...' });
        }

        // 4. Send response back to frontend
        socket.emit('receive_message', aiMessage);
        socket.emit('ai_typing', { isTyping: false });

      } catch (err) {
        console.error('[Socket] Chat Error:', err);
        socket.emit('error', { message: err.message || 'Failed to process message' });
        socket.emit('ai_typing', { isTyping: false });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  console.log('[Socket] Socket.io Server Initialized');
}

export function getIo() {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}
