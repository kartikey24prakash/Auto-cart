import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Bot, Zap, ShieldCheck, TrendingUp } from 'lucide-react';

const stats = [
  { label: 'AI Purchases Today', value: '3', icon: Bot, colorClass: 'text-blue-400 bg-blue-500/10' },
  { label: 'Budget Used', value: '₹6,400', icon: TrendingUp, colorClass: 'text-emerald-400 bg-emerald-500/10' },
  { label: 'Auto-Approved', value: '2', icon: Zap, colorClass: 'text-yellow-400 bg-yellow-500/10' },
  { label: 'Gated (Pending)', value: '1', icon: ShieldCheck, colorClass: 'text-orange-400 bg-orange-500/10' },
];

export default function BuyerCommandCenter() {
  const [query, setQuery] = React.useState('');
  const [messages, setMessages] = React.useState([
    { from: 'system', text: '🤖 AutoCart Scout is online. Type a request to begin.' }
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setMessages(prev => [
      ...prev,
      { from: 'user', text: query },
      { from: 'system', text: `🔍 Scanning merchant catalog for: "${query}"...` }
    ]);
    
    // Parse intent (demo hack: look for keywords)
    let sku = 'kb-01'; // Default keyboard
    let qty = 1;
    if (query.toLowerCase().includes('monitor') || query.toLowerCase().includes('laptop')) {
      sku = 'mon-4k'; // The expensive item that trips 2FA
    }
    
    setQuery('');

    try {
      setMessages(prev => [...prev, { from: 'system', text: `⚡ AI found match [${sku}]. Initiating SDK transaction...` }]);
      
      const response = await fetch('http://localhost:4000/api/ai-store/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerId: 'user_demo_buyer',
          sku,
          qty,
          idempotencyKey: crypto.randomUUID()
        })
      });
      
      const result = await response.json();
      
      if (result.status === 'GATED_2FA' || result.status === 'GATED_1_CLICK') {
        setMessages(prev => [...prev, { from: 'system', text: `⚠️ FIREWALL TRIGGERED: Transaction exceeds Auto-Approve threshold. Held in ${result.status} state (Audit: ${result.auditId}). Please check your Approval Inbox.` }]);
      } else if (result.status === 'PAYMENT_CAPTURED') {
        setMessages(prev => [...prev, { from: 'system', text: `✅ AUTO-APPROVED: Secure payment processed via Razorpay (${result.razorpayOrderId}).` }]);
      } else {
        setMessages(prev => [...prev, { from: 'system', text: `❌ BLOCKED: ${result.message || 'Transaction rejected.'}` }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { from: 'system', text: `❌ ERROR: Failed to reach Merchant API.` }]);
    }
  };

  return (
    <DashboardLayout role="buyer">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Command Center</h1>
          <p className="text-muted-foreground text-sm mt-1">Dispatch your AI shopping agent and monitor its activity.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map(({ label, value, icon: Icon, colorClass }) => {
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

        {/* Terminal */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="border-b border-border px-5 py-3 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="ml-3 text-xs text-muted-foreground font-mono">autocart-scout — AI Shopping Terminal</span>
          </div>
          <div className="h-64 overflow-y-auto p-5 font-mono text-sm flex flex-col gap-3">
            {messages.map((m, i) => (
              <div key={i} className={m.from === 'user' ? 'text-blue-400' : 'text-foreground'}>
                {m.from === 'user' ? '> ' : ''}{m.text}
              </div>
            ))}
          </div>
          <form onSubmit={handleSubmit} className="border-t border-border flex items-center px-5 py-3 gap-3">
            <span className="text-blue-400 font-mono text-sm">{'>'}</span>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Find me the best mechanical keyboard under ₹5000..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none font-mono"
            />
            <button type="submit" className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg transition-colors">
              Run
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
