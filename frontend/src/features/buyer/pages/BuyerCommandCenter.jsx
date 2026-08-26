import React, { useEffect, useState, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Bot, Zap, ShieldCheck, TrendingUp } from 'lucide-react';
import { useSession } from '@/shared/state/SessionContext';
import apiClient from '@/shared/services/apiClient';
import { io } from 'socket.io-client';

export default function BuyerCommandCenter() {
  const { user } = useSession();
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  
  const [stats, setStats] = useState({ totalPurchases: 0, budgetUsed: 0, autoApproved: 0, gated: 0 });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    // Connect to Socket.io Server
    socketRef.current = io('http://localhost:5000');
    
    // Join a unique chat session based on the user's ID
    const sessionId = `chat_${user?.userId || 'guest'}`;
    socketRef.current.emit('join_chat', { userId: user.userId, sessionId });

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
      socketRef.current.disconnect();
    };
  }, [user]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [mandateRes, logsRes] = await Promise.all([
          apiClient.get('/api/dashboard/mandate'),
          apiClient.get('/api/dashboard/logs')
        ]);
        const mandate = mandateRes.data.mandates?.[0] || { spentToday: 0 };
        const logs = logsRes.data.logs || [];
        const autoApproved = logs.filter(l => l.status === 'ORDER_CREATED' || l.status === 'ORDER_PENDING_CONFIRM').length;
        const gated = logs.filter(l => l.status === 'GATED_1_CLICK' || l.status === 'GATED_2FA').length;
        setStats({ totalPurchases: logs.length, budgetUsed: mandate.spentToday, autoApproved, gated });
      } catch (err) {}
    };
    fetchStats();
  }, [messages]); // Refresh stats when messages update (in case a purchase was made)

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    const sessionId = `chat_${user?.userId || 'guest'}`;
    socketRef.current.emit('send_message', { userId: user.userId, sessionId, message: query });
    
    // Optimistically add user message
    setMessages(prev => [...prev, { role: 'user', content: query }]);
    setQuery('');
  };

  const statCards = [
    { label: 'AI Purchases Today', value: stats.totalPurchases, icon: Bot, colorClass: 'text-blue-400 bg-blue-500/10' },
    { label: 'Budget Used', value: `₹${stats.budgetUsed.toLocaleString()}`, icon: TrendingUp, colorClass: 'text-emerald-400 bg-emerald-500/10' },
    { label: 'Auto-Approved', value: stats.autoApproved, icon: Zap, colorClass: 'text-yellow-400 bg-yellow-500/10' },
    { label: 'Gated (Pending)', value: stats.gated, icon: ShieldCheck, colorClass: 'text-orange-400 bg-orange-500/10' },
  ];

  return (
    <DashboardLayout role="buyer">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Command Center</h1>
          <p className="text-muted-foreground text-sm mt-1">Dispatch your AI shopping agent and monitor its activity.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map(({ label, value, icon: Icon, colorClass }) => {
            const [text, bg] = colorClass.split(' ');
            return (
              <div key={label} className="bg-card border border-border rounded-xl p-5">
                <div className={`${bg} ${text} w-9 h-9 rounded-lg flex items-center justify-center mb-3`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-2xl font-bold text-foreground">{value}</div>
                <div className="text-xs text-muted-foreground mt-1">{label}</div>
              </div>
            );
          })}
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="border-b border-border px-5 py-3 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="ml-3 text-xs text-muted-foreground font-mono">autocart-scout — Live AI Stream</span>
          </div>
          
          <div className="flex-1 h-[400px] overflow-y-auto p-5 font-mono text-sm flex flex-col gap-4">
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'text-blue-400 flex flex-col items-end' : 'text-foreground'}>
                {m.role === 'user' ? (
                  <div className="bg-blue-500/10 px-4 py-2 rounded-lg max-w-[80%] border border-blue-500/20">{m.content}</div>
                ) : (
                  <div className="bg-muted/30 px-4 py-2 rounded-lg max-w-[80%] border border-border whitespace-pre-wrap">{m.content}</div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="text-muted-foreground animate-pulse">🤖 Agent is thinking and executing...</div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <form onSubmit={handleSubmit} className="border-t border-border flex items-center px-5 py-4 gap-3 bg-muted/30">
            <Bot className="w-5 h-5 text-muted-foreground" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Find me the best mechanical keyboard under ₹5000..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none font-sans"
              disabled={isTyping}
            />
            <button 
              type="submit" 
              disabled={isTyping}
              className="text-xs bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-5 py-2 rounded-lg transition-colors font-medium shadow-sm"
            >
              Send Command
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
