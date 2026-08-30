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

    socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
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
        <div className="flex-1 flex flex-col bg-[#09090b] relative min-w-0">
          {!activeChatId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-inner">
                <Bot className="w-8 h-8 text-white/80" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2 tracking-tight">Merchant AI Assistant</h2>
              <p className="mb-8 text-sm">Select a previous chat from the sidebar, or start a new one.</p>
              <button
                onClick={async () => {
                  try {
                    const res = await apiClient.post('/api/chat');
                    window.location.href = `/merchant/agent?chatId=${res.data.chat._id}`;
                  } catch (err) {
                    console.error(err);
                  }
                }}
                className="bg-white hover:bg-slate-200 text-black px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-white/5 hover:shadow-white/10 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Start New Chat
              </button>
            </div>
          ) : (
            <>
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-6 scroll-smooth">
                {messages.map((m, i) => (
                  <div key={i} className={`flex w-full max-w-4xl mx-auto ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>

                    {m.role !== 'user' && (
                      <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/5 flex items-center justify-center mr-4 shrink-0 shadow-inner mt-1">
                        <Bot className="w-5 h-5 text-slate-300" />
                      </div>
                    )}

                    <div className={`px-5 py-4 text-[15px] shadow-sm leading-relaxed ${m.role === 'user'
                        ? 'bg-[#262626] text-white font-medium rounded-3xl rounded-tr-sm max-w-[85%] md:max-w-[75%]'
                        : 'text-slate-200 max-w-[90%] md:max-w-[85%]'
                      }`}>
                      {m.role === 'user' ? (
                        m.content
                      ) : (
                        <div className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-[#111113] prose-pre:border prose-pre:border-white/10 prose-a:text-white prose-a:underline prose-strong:text-white max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {m.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex w-full max-w-4xl mx-auto justify-start">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center mr-4 shrink-0 mt-1">
                      <Bot className="w-5 h-5 text-slate-500" />
                    </div>
                    <div className="text-slate-400 px-5 py-4 flex items-center gap-1.5 h-10">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 md:p-6 bg-gradient-to-t from-[#09090b] via-[#09090b] to-transparent pt-10">
                <form onSubmit={handleSubmit} className="relative flex items-center max-w-3xl mx-auto shadow-2xl shadow-black/50">
                  <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Ask AI to analyze metrics, configure limits, or inspect logs..."
                    disabled={isTyping}
                    className="w-full bg-[#111113] border border-white/10 rounded-2xl pl-6 pr-14 py-4 text-[15px] text-white focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all disabled:opacity-50 placeholder:text-slate-500"
                  />
                  <button
                    type="submit"
                    disabled={isTyping || !query.trim()}
                    className="absolute right-2 p-2.5 bg-white hover:bg-slate-200 disabled:bg-white/10 disabled:text-white/30 text-black rounded-xl transition-all cursor-pointer"
                  >
                    <Send className="w-[18px] h-[18px]" strokeWidth={2} />
                  </button>
                </form>
                <div className="text-center mt-4 text-[11px] text-slate-500 font-medium tracking-wide">
                  AI Agents can make mistakes. Verify critical configuration changes manually.
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
