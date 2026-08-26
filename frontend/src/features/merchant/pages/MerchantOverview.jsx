import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { TrendingUp, ShieldCheck, Zap, Activity } from 'lucide-react';
import { Card } from '@/components/ui/card';
import apiClient from '@/shared/services/apiClient';

export default function MerchantOverview() {
  const [stats, setStats] = useState({
    approvedToday: 0,
    gatedWaiting: 0,
    blocked: 0,
    revenueProtected: 0
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await apiClient.get('/api/dashboard/metrics');
        const data = res.data;
        
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

  return (
    <DashboardLayout role="merchant">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Overview</h1>
          <p className="text-muted-foreground mt-1">Real-time metrics of your autonomous traffic and transaction outcomes.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ label, value, color, icon: Icon }) => (
            <Card key={label} className="p-6 bg-card border-border/50 shadow-sm hover:border-border transition-colors">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{label}</p>
                  <p className={`text-3xl font-bold tracking-tight ${color}`}>{value}</p>
                </div>
                <div className={`p-2 rounded-lg bg-background/50 border border-border/50 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-6 bg-card border-border/50">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Next Steps</h3>
            <div className="h-64 flex flex-col items-center justify-center border border-dashed border-border/50 rounded-lg bg-background/30 text-muted-foreground p-6 text-center">
              <Activity className="w-8 h-8 mb-4 opacity-50 text-blue-400" />
              <h4 className="text-foreground font-medium mb-2">Connect Your Data</h4>
              <p className="text-sm">Install the AutoCart SDK on your external backend to enable real-time price verification and cryptographic signature generation.</p>
            </div>
          </Card>
          <Card className="p-6 bg-card border-border/50">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Quick Setup</h3>
            <p className="text-sm text-muted-foreground mb-4">Install the package and drop in the Express middleware to get started.</p>
            <pre className="p-4 rounded-lg bg-black/40 border border-border/30 text-xs text-muted-foreground font-mono overflow-x-auto">
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
