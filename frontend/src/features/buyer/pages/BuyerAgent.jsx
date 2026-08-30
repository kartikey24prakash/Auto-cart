import React, { useEffect, useState, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Bot, Send } from 'lucide-react';
import { useSession } from '@/shared/state/SessionContext';
import { io } from 'socket.io-client';
import { useSearchParams } from 'react-router-dom';
import apiClient from '@/shared/services/apiClient';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import RazorpayModal from '@/shared/components/RazorpayModal';
import { approvalApi } from '@/features/approval-queue/services/approvalApi';

export default function BuyerAgent() {
  const { user } = useSession();
  const [searchParams] = useSearchParams();
  const activeChatId = searchParams.get('chatId');

  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [paymentModalState, setPaymentModalState] = useState({ isOpen: false, orderDetails: null });

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
      setMessages(prev => [...prev, { role: 'system', content: `🚨 Error: ${err.message}` }]);
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

  const parseInlineApproval = (text) => {
    // Make regex resilient to spaces and case
    const match = text.match(/\[APPROVAL_REQUIRED:\s*(aud_[a-zA-Z0-9-]+)\s*\]/i);
    if (match) {
      return {
        cleanText: text.replace(match[0], '').trim(),
        auditId: match[1]
      };
    }
    // Also check for bold markdown around it e.g. **[APPROVAL_REQUIRED:aud_123]**
    const matchBold = text.match(/\*\*\[APPROVAL_REQUIRED:\s*(aud_[a-zA-Z0-9-]+)\s*\]\*\*/i);
    if (matchBold) {
      return {
        cleanText: text.replace(matchBold[0], '').trim(),
        auditId: matchBold[1]
      };
    }
    return { cleanText: text, auditId: null };
  };

  const handleInlineApprove = async (auditId) => {
    setApprovalLoading(true);
    try {
      const res = await approvalApi.approve(auditId);
      setPaymentModalState({
        isOpen: true,
        orderDetails: {
          auditId: auditId,
          razorpayOrderId: res.razorpayOrderId,
          amount: res.amount,
          keyId: res.keyId
        }
      });
    } catch (err) {
      console.error('Failed to approve', err);
      alert('Failed to approve: ' + (err.response?.data?.error || err.message));
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleInlineDeny = async (auditId) => {
    setApprovalLoading(true);
    try {
      await approvalApi.deny(auditId);
      const msg = `I have denied the transaction (Ref: ${auditId}). Please cancel the purchase.`;
      socketRef.current.emit('send_message', { userId: user.userId, chatId: activeChatId, message: msg });
      setMessages(prev => [...prev, { role: 'user', content: msg }]);
    } catch (err) {
      console.error('Failed to deny', err);
      alert('Failed to deny: ' + (err.response?.data?.error || err.message));
    } finally {
      setApprovalLoading(false);
    }
  };

  return (
    <DashboardLayout role="buyer">
      <div className="h-[calc(100vh-8rem)] flex overflow-hidden relative">

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-[#09090b] relative min-w-0">
          {!activeChatId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-inner">
                <Bot className="w-8 h-8 text-white/80" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2 tracking-tight">Auto-Cart Assistant</h2>
              <p className="mb-8 text-sm">Select a previous chat from the sidebar, or start a new one.</p>
              <button
                onClick={async () => {
                  try {
                    const res = await apiClient.post('/api/chat');
                    window.location.href = `/buyer/agent?chatId=${res.data.chat._id}`;
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
                {messages.map((m, i) => {
                  const { cleanText, auditId } = m.role === 'ai' ? parseInlineApproval(m.content) : { cleanText: m.content, auditId: null };
                  
                  return (
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
                        <div>
                          <div className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-[#111113] prose-pre:border prose-pre:border-white/10 prose-a:text-white prose-a:underline prose-strong:text-white max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {cleanText}
                            </ReactMarkdown>
                          </div>
                          {auditId && (
                            <div className="mt-5 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 flex flex-col gap-3 shadow-inner">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                  <span className="text-sm font-semibold text-amber-500">Action Required</span>
                                </div>
                                <span className="text-xs font-mono text-slate-400 bg-black/40 px-2 py-1 rounded uppercase">Ref: {auditId.substring(0,8)}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-3 mt-1">
                                <button 
                                  onClick={() => handleInlineDeny(auditId)}
                                  disabled={approvalLoading}
                                  className="w-full py-2.5 bg-white/5 text-slate-300 font-semibold rounded-lg hover:bg-white/10 hover:text-white transition-colors flex items-center justify-center gap-2 border border-white/10"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                  Deny
                                </button>
                                <button 
                                  onClick={() => handleInlineApprove(auditId)}
                                  disabled={approvalLoading}
                                  className="w-full py-2.5 bg-white text-black font-semibold rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-white/10"
                                >
                                  {approvalLoading ? (
                                    <svg className="animate-spin h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  ) : (
                                    <>
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                      Approve
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )})}

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
                    placeholder="Ask Auto-Cart to find or buy something..."
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
                  AI Agents can make mistakes. Always verify checkout mandates in your Approval Inbox.
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <RazorpayModal
        isOpen={paymentModalState.isOpen}
        orderDetails={paymentModalState.orderDetails}
        onClose={() => setPaymentModalState({ isOpen: false, orderDetails: null })}
        onProcessed={(wasSuccess) => {
          if (wasSuccess && paymentModalState.orderDetails) {
            const msg = `I have successfully approved and paid for the transaction (Ref: ${paymentModalState.orderDetails.auditId}).`;
            socketRef.current.emit('send_message', { userId: user.userId, chatId: activeChatId, message: msg });
            setMessages(prev => [...prev, { role: 'user', content: msg }]);
          }
          setPaymentModalState({ isOpen: false, orderDetails: null });
        }}
      />
    </DashboardLayout>
  );
}
