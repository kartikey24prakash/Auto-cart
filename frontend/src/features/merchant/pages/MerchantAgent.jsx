import React, { useEffect, useState, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Bot, Send } from 'lucide-react';
import { useSession } from '@/shared/state/SessionContext';
import { io } from 'socket.io-client';
import { useSearchParams } from 'react-router-dom';
import apiClient from '@/shared/services/apiClient';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function MerchantAgent() {
  const { user } = useSession();
  const [searchParams] = useSearchParams();
  const activeChatId = searchParams.get('chatId');

  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }

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
    
    socketRef.current.on('error', (err) => {
      setMessages(prev => [...prev, { role: 'system', content: `❌ Error: ${err.message}` }]);
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [activeChatId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim() || !activeChatId) return;
    
    socketRef.current.emit('send_message', { userId: user.userId, chatId: activeChatId, message: query });
    setMessages(prev => [...prev, { role: 'user', content: query }]);
    setQuery('');
  };

  return (
    <DashboardLayout role="merchant">
      <div className="h-[calc(100vh-8rem)] flex overflow-hidden relative">
        
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-background relative min-w-0">
          {!activeChatId ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground flex-col">
            <Bot className="w-12 h-12 mb-4 opacity-50" />
            <p className="mb-6">Select a previous chat from the sidebar, or start a new one.</p>
            <button 
              onClick={async () => {
                try {
                  const res = await apiClient.post('/api/chat');
                  window.location.href = `/merchant/agent?chatId=${res.data.chat._id}`;
                } catch (err) {
                  console.error(err);
                }
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-full font-medium transition-colors shadow-sm"
            >
              Start New Chat
            </button>
          </div>
        ) : (
            <>
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-8">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] md:max-w-[80%] px-5 py-3.5 text-[15px] ${
                      m.role === 'user' 
                        ? 'bg-blue-600 text-white font-medium rounded-2xl shadow-sm' 
                        : 'text-foreground leading-relaxed'
                    }`}>
                      {m.role === 'user' ? (
                        m.content
                      ) : (
                        <div className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-border/50 prose-a:text-blue-400 max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {m.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="text-muted-foreground px-5 py-4 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Input Area */}
              <div className="p-4 md:p-6 bg-background">
                <form onSubmit={handleSubmit} className="relative flex items-center max-w-4xl mx-auto shadow-sm">
                  <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Ask Auto-Cart to find or buy something..."
                    disabled={isTyping}
                    className="w-full bg-card border border-border/60 rounded-full pl-6 pr-14 py-4 text-[15px] focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all disabled:opacity-50"
                  />
                  <button 
                    type="submit" 
                    disabled={isTyping || !query.trim()}
                    className="absolute right-2 p-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-muted disabled:text-muted-foreground text-white rounded-full transition-colors shadow-sm"
                  >
                    <Send className="w-[18px] h-[18px]" strokeWidth={1.5} />
                  </button>
                </form>
                <div className="text-center mt-3 text-xs text-muted-foreground font-medium tracking-wide">
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
