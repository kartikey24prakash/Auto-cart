import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Bot, Zap, ShieldCheck, TrendingUp, ArrowRight, ShoppingBag, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '@/shared/services/apiClient';

export default function BuyerCommandCenter() {
  const [stats, setStats] = useState({ totalPurchases: 0, budgetUsed: 0, autoApproved: 0, gated: 0 });
  const [recentLogs, setRecentLogs] = useState([]);

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
        setRecentLogs(logs.slice(0, 5)); // Get top 5 recent logs
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-50">Command Center</h1>
            <p className="text-zinc-400 text-sm mt-1">Monitor your AI's purchasing activity and trust engine statistics.</p>
          </div>
          <Link 
            to="/buyer/agent"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-500/20"
          >
            <ShoppingBag className="w-4 h-4" /> Shop
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map(({ label, value, icon: Icon, colorClass }) => {
            const [text, bg] = colorClass.split(' ');
            return (
              <div key={label} className="bg-zinc-900/40 backdrop-blur-sm border border-zinc-700 rounded-xl p-5 shadow-sm">
                <div className={`${bg} ${text} w-9 h-9 rounded-lg flex items-center justify-center mb-3`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-2xl font-bold text-zinc-50">{value}</div>
                <div className="text-xs text-zinc-400 mt-1">{label}</div>
              </div>
            );
          })}
        </div>

        <div className="bg-zinc-900/40 backdrop-blur-sm border border-zinc-700 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-5 border-b border-zinc-800/50 flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-50 flex items-center gap-2">
              <Clock className="w-5 h-5 text-zinc-400" /> Recent Purchases
            </h2>
            <Link to="/buyer/receipts" className="text-xs font-medium text-blue-400 hover:text-blue-300">View All</Link>
          </div>
          <div className="divide-y divide-zinc-800/50">
            {recentLogs.length > 0 ? recentLogs.map((log) => (
              <div key={log.auditId} className="p-4 hover:bg-white/5 transition-colors flex items-center justify-between">
                <div>
                  <div className="font-medium text-zinc-100">{log.productName || log.sku}</div>
                  <div className="text-xs text-zinc-400 mt-0.5">{log.merchantName || 'Merchant'}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-zinc-50">₹{log.amount?.toLocaleString()}</div>
                  <div className={`text-[10px] font-bold mt-1 px-2 py-0.5 rounded-full inline-block ${
                    log.status === 'PAYMENT_CAPTURED' ? 'bg-emerald-500/10 text-emerald-400' :
                    log.status.includes('GATED') ? 'bg-orange-500/10 text-orange-400' :
                    'bg-zinc-800 text-zinc-400'
                  }`}>
                    {log.status.replace(/_/g, ' ')}
                  </div>
                </div>
              </div>
            )) : (
              <div className="p-8 text-center text-zinc-500 text-sm">No recent activity found.</div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
