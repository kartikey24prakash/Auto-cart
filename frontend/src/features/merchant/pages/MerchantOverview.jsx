import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { TrendingUp, ShieldCheck, Zap, Activity, ShieldAlert } from 'lucide-react';
import { Card } from '@/components/ui/card';
import apiClient from '@/shared/services/apiClient';

export default function MerchantOverview() {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const configRes = await apiClient.get('/api/dashboard/config');
        setConfig(configRes.data.config);
      } catch (err) {
        console.error(err);
      }
    };
    fetchConfig();
  }, []);

  const statCards = [
    { label: 'Approved & Captured', value: '14,208', color: 'text-emerald-400', icon: ShieldCheck },
    { label: 'Gated (Waiting)', value: '31', color: 'text-yellow-400', icon: Zap },
    { label: 'Blocked / Denied', value: '412', color: 'text-red-400', icon: Activity },
    { label: 'AI Assisted Sales', value: '₹2.4M', color: 'text-blue-400', icon: TrendingUp },
  ];

  const isVerified = config?.kycStatus === 'VERIFIED' && config?.razorpayLinkedAccountId;

  return (
    <DashboardLayout role="merchant">
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
        
        {!isVerified && (
          <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-xl flex items-start gap-4">
            <div className="p-2 bg-red-500/10 rounded-lg text-red-500 shrink-0 border border-red-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-red-500 font-semibold text-sm">Action Required: Razorpay Business KYC</h3>
              <p className="text-red-500/80 text-sm mt-1 mb-3 leading-relaxed">
                Your AutoCart products are currently hidden from all AI Agents to protect buyers from fraud. You must verify your business identity and link your Razorpay banking account via <strong>Razorpay Route</strong> before your catalog goes live.
              </p>
              <button 
                onClick={() => alert("Redirecting to Razorpay OAuth KYC Flow...")}
                className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-red-500/20"
              >
                Start Verification
              </button>
            </div>
          </div>
        )}

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Merchant Overview</h1>
          <p className="text-zinc-400 mt-2 text-sm">Real-time metrics of your autonomous traffic and transaction outcomes.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ label, value, color, icon: Icon }) => (
            <Card key={label} className="p-6 bg-[#09090b] border border-white/5 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex justify-between items-start relative z-10">
                <div className="space-y-3">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</p>
                  <p className={`text-4xl font-bold tracking-tighter ${color}`}>{value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-white/5 border border-white/5 ${color} shadow-inner`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-6 bg-[#09090b] border border-white/5 shadow-2xl">
            <h3 className="text-lg font-bold text-white tracking-tight mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              Live Telemetry
            </h3>
            <div className="h-64 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-xl bg-black/40 text-zinc-500 p-6 text-center shadow-inner">
              <svg className="w-12 h-12 mb-4 text-zinc-700 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              <h4 className="text-zinc-300 font-semibold mb-2">Awaiting SDK Telemetry</h4>
              <p className="text-sm">Install the AutoCart SDK on your external backend to unlock live traffic graphs and autonomous conversion charts.</p>
            </div>
          </Card>
          
          <Card className="p-6 bg-[#09090b] border border-white/5 shadow-2xl">
            <h3 className="text-lg font-bold text-white tracking-tight mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
              Quick Setup
            </h3>
            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">Install the official package and drop the Express middleware into your existing backend to enable cryptographic price signatures.</p>
            <div className="rounded-xl overflow-hidden shadow-inner border border-white/10">
              <div className="bg-[#111113] px-4 py-2 border-b border-white/5 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                <span className="ml-2 text-xs font-mono text-zinc-500">server.js</span>
              </div>
              <pre className="p-5 bg-[#09090b] text-xs text-zinc-300 font-mono overflow-x-auto leading-relaxed">
<span className="text-pink-400">import</span> {'{ AutoCartGateway }'} <span className="text-pink-400">from</span> <span className="text-green-300">'@autocart/sdk'</span>;
<br/><br/>
<span className="text-blue-400">const</span> gateway = <span className="text-pink-400">new</span> AutoCartGateway({'{'}
  merchantKey: process.env.MERCHANT_KEY,
  merchantSecret: process.env.MERCHANT_SECRET
{'}'});
<br/><br/>
app.use(<span className="text-green-300">'/autocart'</span>, gateway.createRouter());
              </pre>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
