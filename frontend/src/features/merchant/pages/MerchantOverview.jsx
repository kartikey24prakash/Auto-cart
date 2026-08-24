import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { TrendingUp, ShieldCheck, Zap, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function MerchantOverview() {
  const stats = [
    { label: 'Approved Today', value: '127', color: 'text-emerald-400', icon: ShieldCheck },
    { label: 'Gated (Waiting)', value: '4', color: 'text-yellow-400', icon: Zap },
    { label: 'Blocked', value: '2', color: 'text-red-400', icon: Activity },
    { label: 'Revenue Protected', value: '₹42,000', color: 'text-blue-400', icon: TrendingUp },
  ];

  return (
    <DashboardLayout role="merchant">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Overview</h1>
          <p className="text-muted-foreground mt-1">High-level metrics of your AI traffic and revenue protection.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ label, value, color, icon: Icon }) => (
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
            <h3 className="text-lg font-semibold mb-4 text-foreground">Recent Traffic</h3>
            <div className="h-64 flex flex-col items-center justify-center border border-dashed border-border/50 rounded-lg bg-background/30 text-muted-foreground">
              <Activity className="w-8 h-8 mb-2 opacity-50" />
              <p>Connect your SDK to see live traffic charts.</p>
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

app.use('/api/ai-store', gateway.createRouter());`}
            </pre>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
