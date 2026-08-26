import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Bot, Zap, ShieldCheck, TrendingUp, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '@/shared/services/apiClient';

export default function BuyerCommandCenter() {
  const [stats, setStats] = useState({ totalPurchases: 0, budgetUsed: 0, autoApproved: 0, gated: 0 });

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
  }, []);

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
          <p className="text-muted-foreground text-sm mt-1">Monitor your AI's purchasing activity and trust engine statistics.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map(({ label, value, icon: Icon, colorClass }) => {
            const [text, bg] = colorClass.split(' ');
            return (
              <div key={label} className="bg-card border border-border rounded-xl p-5 shadow-sm">
                <div className={`${bg} ${text} w-9 h-9 rounded-lg flex items-center justify-center mb-3`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-2xl font-bold text-foreground">{value}</div>
                <div className="text-xs text-muted-foreground mt-1">{label}</div>
              </div>
            );
          })}
        </div>

        <div className="bg-card border border-border rounded-xl p-8 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="bg-blue-500/10 text-blue-500 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Bot className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-2 text-foreground">Ready to Dispatch your Agent?</h2>
          <p className="text-muted-foreground max-w-md mb-6">
            The AI Agent has been upgraded to a dedicated full-screen Hub with chat history, enabling complex autonomous workflows and multi-session tracking.
          </p>
          <Link 
            to="/buyer/agent"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Open AI Agent Hub <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
