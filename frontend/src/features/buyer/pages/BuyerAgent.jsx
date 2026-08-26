import React, { useEffect, useState, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Bot, Plus, MessageSquare, Send, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useSession } from '@/shared/state/SessionContext';
import apiClient from '@/shared/services/apiClient';
import { io } from 'socket.io-client';

export default function BuyerAgent() {
  const { user } = useSession();
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Fetch all chat threads for the sidebar
  const loadChats = async () => {
    try {
      const res = await apiClient.get('/api/chat');
      setChats(res.data.chats);
      if (res.data.chats.length > 0 && !activeChatId) {
        setActiveChatId(res.data.chats[0]._id);
      }
    } catch (err) {
      console.error('Failed to load chats', err);
    }
  };

  useEffect(() => {
    loadChats();
  }, []);

  // Connect socket and join chat room when activeChatId changes
  useEffect(() => {
    if (!activeChatId) return;

    socketRef.current = io('http://localhost:5000');
    socketRef.current.emit('join_chat', { userId: user.userId, chatId: activeChatId });

    socketRef.current.on('chat_history', (history) => {
      setMessages(history);
    });

    socketRef.current.on('receive_message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    socketRef.current.on('ai_typing', ({ isTyping }) => {
      setIsTyping(isTyping);
    });
    
    socketRef.current.on('chat_title_updated', ({ chatId, title }) => {
        setChats(prev => prev.map(c => c._id === chatId ? { ...c, title } : c));
    });

    socketRef.current.on('error', (err) => {
      setMessages(prev => [...prev, { role: 'system', content: `❌ Error: ${err.message}` }]);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [activeChatId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const createNewChat = async () => {
    try {
      const res = await apiClient.post('/api/chat');
      setChats([res.data.chat, ...chats]);
      setActiveChatId(res.data.chat._id);
    } catch (err) {
      console.error('Failed to create chat', err);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim() || !activeChatId) return;
    
    socketRef.current.emit('send_message', { userId: user.userId, chatId: activeChatId, message: query });
    setMessages(prev => [...prev, { role: 'user', content: query }]);
    setQuery('');
  };

  return (
    <DashboardLayout role="buyer">
      <div className="h-[calc(100vh-8rem)] bg-card border border-border rounded-xl shadow-sm flex overflow-hidden relative">
        
        {/* Sidebar */}
        <div className={`border-r border-border bg-muted/20 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
          <div className="p-4 border-b border-border flex items-center justify-between">
            <button 
              onClick={createNewChat}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" /> New Chat
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 w-64">
            {chats.map(chat => (
              <button
                key={chat._id}
                onClick={() => setActiveChatId(chat._id)}
                className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
                  activeChatId === chat._id ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`}
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span className="truncate">{chat.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-background relative min-w-0">
          {/* Toggle Button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="absolute top-4 left-4 z-10 p-2 bg-card border border-border rounded-lg text-muted-foreground hover:text-foreground shadow-sm transition-colors"
          >
            {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>

          {!activeChatId ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground flex-col">
              <Bot className="w-12 h-12 mb-4 opacity-50" />
              <p>Select a chat or start a new one to begin</p>
            </div>
          ) : (
            <>
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 pt-16 flex flex-col gap-6">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-5 py-3 ${
                      m.role === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-muted text-foreground border border-border whitespace-pre-wrap'
                    }`}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-muted text-muted-foreground border border-border rounded-2xl px-5 py-3 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Input Area */}
              <div className="p-4 border-t border-border bg-card">
                <form onSubmit={handleSubmit} className="relative flex items-center max-w-4xl mx-auto">
                  <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Ask Auto-Cart to find or buy something..."
                    disabled={isTyping}
                    className="w-full bg-background border border-border rounded-full pl-6 pr-12 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow disabled:opacity-50"
                  />
                  <button 
                    type="submit" 
                    disabled={isTyping || !query.trim()}
                    className="absolute right-2 p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-muted disabled:text-muted-foreground text-white rounded-full transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
                <div className="text-center mt-2 text-xs text-muted-foreground">
                  AI Agents can make mistakes. Always verify checkout mandates in your Command Center.
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
