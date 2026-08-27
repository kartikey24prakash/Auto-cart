import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { TrendingUp, ShieldCheck, Zap, Activity, ShieldAlert } from 'lucide-react';
import { Card } from '@/components/ui/card';
import apiClient from '@/shared/services/apiClient';

export default function MerchantOverview() {
  const [stats, setStats] = useState({
    approvedToday: 0,
    gatedWaiting: 0,
    blocked: 0,
    revenueProtected: 0
  });
  const [config, setConfig] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const [metricsRes, configRes] = await Promise.all([
          apiClient.get('/api/dashboard/metrics'),
          apiClient.get('/api/dashboard/config')
        ]);
        
        setConfig(configRes.data.config);
        const data = metricsRes.data;
        
        // Sum up the real stats
        const counts = data.statusCounts || {};
        const approved = (counts['ORDER_CREATED'] || 0) + (counts['PAYMENT_CAPTURED'] || 0) + (counts['AUTO_APPROVED'] || 0);
        const gated = (counts['GATED_1_CLICK'] || 0) + (counts['GATED_2FA'] || 0);
        const blocked = (counts['BLOCKED'] || 0) + (counts['DENIED'] || 0);
        
        setStats({
          approvedToday: approved,
          gatedWaiting: gated,
          blocked: blocked,
          // Placeholder formatting logic - assumes AI Assisted AOV translates to protected amount roughly
          revenueProtected: parseFloat(data.aov?.aiAssistedINR || 0)
        });
      } catch (err) {
        console.error(err);
      }
    };
    fetchMetrics();
  }, []);

  const statCards = [
    { label: 'Approved & Captured', value: stats.approvedToday.toString(), color: 'text-emerald-400', icon: ShieldCheck },
    { label: 'Gated (Waiting)', value: stats.gatedWaiting.toString(), color: 'text-yellow-400', icon: Zap },
    { label: 'Blocked / Denied', value: stats.blocked.toString(), color: 'text-red-400', icon: Activity },
    { label: 'AI Assisted Sales', value: `₹${stats.revenueProtected.toLocaleString()}`, color: 'text-blue-400', icon: TrendingUp },
  ];

  const isVerified = config?.kycStatus === 'VERIFIED' && config?.razorpayLinkedAccountId;

  return (
    <DashboardLayout role="merchant">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {!isVerified && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-4">
            <div className="p-2 bg-red-500/20 rounded-lg text-red-500 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-red-500 font-semibold text-sm">Action Required: Razorpay Business KYC</h3>
              <p className="text-red-500/80 text-sm mt-1 mb-3 leading-relaxed">
                Your AutoCart products are currently hidden from all AI Agents to protect buyers from fraud. You must verify your business identity and link your Razorpay banking account via <strong>Razorpay Route</strong> before your catalog goes live.
              </p>
              <button 
                onClick={() => alert("Redirecting to Razorpay OAuth KYC Flow...")}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
              >
                Start Verification
              </button>
            </div>
          </div>
        )}

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-50">Overview</h1>
          <p className="text-zinc-400 mt-1">Real-time metrics of your autonomous traffic and transaction outcomes.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ label, value, color, icon: Icon }) => (
            <Card key={label} className="p-6 bg-zinc-900/40 backdrop-blur-sm border-zinc-800/50 shadow-sm hover:border-zinc-700 transition-colors">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-zinc-400">{label}</p>
                  <p className={`text-3xl font-bold tracking-tight ${color}`}>{value}</p>
                </div>
                <div className={`p-2 rounded-lg bg-zinc-950/50 border border-zinc-800/50 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-6 bg-zinc-900/40 backdrop-blur-sm border-zinc-800/50">
            <h3 className="text-lg font-semibold mb-4 text-zinc-50">Next Steps</h3>
            <div className="h-64 flex flex-col items-center justify-center border border-dashed border-zinc-800/50 rounded-lg bg-zinc-950/30 text-zinc-400 p-6 text-center">
              <Activity className="w-8 h-8 mb-4 opacity-50 text-blue-400" />
              <h4 className="text-zinc-50 font-medium mb-2">Connect Your Data</h4>
              <p className="text-sm">Install the AutoCart SDK on your external backend to enable real-time price verification and cryptographic signature generation.</p>
            </div>
          </Card>
          <Card className="p-6 bg-zinc-900/40 backdrop-blur-sm border-zinc-800/50">
            <h3 className="text-lg font-semibold mb-4 text-zinc-50">Quick Setup</h3>
            <p className="text-sm text-zinc-400 mb-4">Install the package and drop in the Express middleware to get started.</p>
            <pre className="p-4 rounded-lg bg-black/40 border border-zinc-800/30 text-xs text-zinc-400 font-mono overflow-x-auto">
{`npm install @autocart/sdk

import { AutoCartGateway } from '@autocart/sdk';
const gateway = new AutoCartGateway({
  merchantKey: process.env.MERCHANT_KEY,
  merchantSecret: process.env.MERCHANT_SECRET
});

app.use('/autocart', gateway.createRouter());`}
            </pre>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
