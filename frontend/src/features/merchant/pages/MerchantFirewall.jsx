import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ShieldAlert, Sliders, Check, Shield } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import apiClient from '@/shared/services/apiClient';

export default function MerchantFirewall() {
  const [autoApprove, setAutoApprove] = useState(500);
  const [require2FA, setRequire2FA] = useState(5000);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiClient.get('/api/dashboard/config').then(res => {
      const rules = res.data.config?.firewallRules;
      if (rules) {
        setAutoApprove(rules.autoApproveUnder || 500);
        setRequire2FA(rules.require2FAOver || 5000);
      }
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await apiClient.put('/api/dashboard/config', {
        firewallRules: { autoApproveUnder: autoApprove, require2FAOver: require2FA, blockOver: 50000 }
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <DashboardLayout role="merchant"><div className="p-8 text-white">Loading rules...</div></DashboardLayout>;

  return (
    <DashboardLayout role="merchant">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-50">Firewall Rules</h1>
          <p className="text-zinc-400 mt-1">Configure exactly how AI purchases interact with your store.</p>
        </div>

        <Card className="p-8 bg-zinc-900/40 backdrop-blur-sm border-zinc-800/50 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-zinc-50">Threshold Settings</h2>
              <p className="text-sm text-zinc-400">Adjust at what amounts transactions require manual verification.</p>
            </div>
          </div>

          <div className="space-y-10 max-w-2xl">
            <div className="space-y-4">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <label className="text-sm font-semibold text-zinc-50">Auto-Approve Threshold</label>
                  <p className="text-xs text-zinc-400 mt-1">Transactions under this amount bypass all gating and are completely autonomous.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 items-center">
                {[100, 500, 1000, 2500, 5000].map(val => (
                  <button
                    key={val}
                    onClick={() => setAutoApprove(val)}
                    className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 border ${
                      autoApprove === val 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.15)] ring-1 ring-emerald-500/20' 
                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    ₹{val.toLocaleString()}
                  </button>
                ))}
                
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">₹</span>
                  <input 
                    type="number"
                    value={![100, 500, 1000, 2500, 5000].includes(autoApprove) ? autoApprove : ''}
                    onChange={(e) => setAutoApprove(Number(e.target.value))}
                    className={`w-28 pl-8 pr-4 py-2.5 rounded-full text-sm font-semibold outline-none transition-all duration-200 border ${
                      ![100, 500, 1000, 2500, 5000].includes(autoApprove) && autoApprove > 0
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.15)] ring-1 ring-emerald-500/20 placeholder-emerald-400/50' 
                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-200 focus:border-emerald-500/50 placeholder-zinc-500'
                    }`}
                    placeholder="Custom"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <label className="text-sm font-semibold text-zinc-50">Absolute Block Threshold</label>
                  <p className="text-xs text-zinc-400 mt-1">Transactions over this amount are aggressively blocked to prevent AI fraud.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 items-center">
                {[5000, 10000, 25000, 50000].map(val => (
                  <button
                    key={val}
                    onClick={() => setRequire2FA(val)}
                    className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 border ${
                      require2FA === val 
                        ? 'bg-orange-500/10 border-orange-500/30 text-orange-400 shadow-[0_0_15px_rgba(251,146,60,0.15)] ring-1 ring-orange-500/20' 
                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    ₹{val.toLocaleString()}
                  </button>
                ))}
                
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">₹</span>
                  <input 
                    type="number"
                    value={![5000, 10000, 25000, 50000].includes(require2FA) ? require2FA : ''}
                    onChange={(e) => setRequire2FA(Number(e.target.value))}
                    className={`w-28 pl-8 pr-4 py-2.5 rounded-full text-sm font-semibold outline-none transition-all duration-200 border ${
                      ![5000, 10000, 25000, 50000].includes(require2FA) && require2FA > 0
                        ? 'bg-orange-500/10 border-orange-500/30 text-orange-400 shadow-[0_0_15px_rgba(251,146,60,0.15)] ring-1 ring-orange-500/20 placeholder-orange-400/50' 
                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-200 focus:border-orange-500/50 placeholder-zinc-500'
                    }`}
                    placeholder="Custom"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20 flex gap-3 items-start mt-8">
              <ShieldAlert className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-orange-400 mb-1">1-Click Gating Zone</h4>
                <p className="text-sm text-orange-300/80 leading-relaxed">
                  Purchases between <strong className="text-orange-300">₹{autoApprove}</strong> and <strong className="text-orange-300">₹{require2FA}</strong> will be held in a <strong>GATED</strong> state. The buyer's AI will be paused until the human owner manually approves the purchase via the 1-click inline button.
                </p>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button onClick={handleSave} disabled={saving} className="bg-zinc-50 hover:bg-zinc-200 text-zinc-950 font-semibold border border-zinc-200 px-8 transition-colors">
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
