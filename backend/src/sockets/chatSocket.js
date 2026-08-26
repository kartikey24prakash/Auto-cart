import { Server } from 'socket.io';
import { ChatSession } from '../models/ChatSession.js';
import { aiService } from '../services/aiService.js';
import { User } from '../models/User.js';

let io;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: '*', // For hackathon, allow all
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Join a chat room based on user ID
    socket.on('join_chat', async ({ userId, sessionId }) => {
      socket.join(sessionId);
      console.log(`[Socket] User ${userId} joined session ${sessionId}`);
      
      // Load history
      const session = await ChatSession.findOne({ sessionId });
      if (session) {
        socket.emit('chat_history', session.messages);
      } else {
        // Create new session with system greeting
        const newSession = await ChatSession.create({
          sessionId,
          userId,
          messages: [{
            role: 'ai',
            content: "Hello! I am your Auto-Cart shopping agent. How can I help you find and buy things today?"
          }]
        });
        socket.emit('chat_history', newSession.messages);
      }
    });

    // Handle incoming chat messages
    socket.on('send_message', async ({ userId, sessionId, message }) => {
      console.log(`[Socket] Message from ${userId}: ${message}`);
      
      try {
        // Fetch buyer key
        const user = await User.findOne({ userId, role: 'BUYER' });
        if (!user || !user.buyerConfig) {
          socket.emit('error', { message: 'Invalid buyer profile' });
          return;
        }

        const buyerKey = user.buyerConfig.buyerKey;

        // 1. Save user message to DB
        const session = await ChatSession.findOne({ sessionId });
        session.messages.push({ role: 'user', content: message });
        await session.save();

        // 2. Call Gemini AI Service (pass history)
        const history = session.messages.slice(0, -1); // Exclude the message we just added (GenAI takes history + new prompt separately)
        
        socket.emit('ai_typing', { isTyping: true });
        
        const aiResponseText = await aiService.generateResponse(history, message, buyerKey);
        
        // 3. Save AI response to DB
        session.messages.push({ role: 'ai', content: aiResponseText });
        await session.save();

        // 4. Send response back to frontend
        socket.emit('receive_message', { role: 'ai', content: aiResponseText });
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
