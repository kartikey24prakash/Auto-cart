import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ShieldAlert, Sliders, Check, Shield } from 'lucide-react';
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
      await apiClient.post('/api/dashboard/config', {
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

          <div className="space-y-8 max-w-2xl">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <label className="text-sm font-medium text-zinc-50">Auto-Approve Threshold</label>
                  <p className="text-xs text-zinc-400">Transactions under this amount bypass 2FA gating.</p>
                </div>
                <span className="text-xl font-mono font-bold text-emerald-400">₹{autoApprove}</span>
              </div>
              <input type="range" min={100} max={5000} step={100} value={autoApprove}
                onChange={e => setAutoApprove(e.target.value)} 
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(52,211,153,0.5)] [&::-webkit-slider-thumb]:transition-transform hover:[&::-webkit-slider-thumb]:scale-125"
                style={{ background: `linear-gradient(to right, #34d399 ${(autoApprove - 100) / (5000 - 100) * 100}%, #27272a ${(autoApprove - 100) / (5000 - 100) * 100}%)` }}
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <label className="text-sm font-medium text-zinc-50">Require 2FA Threshold</label>
                  <p className="text-xs text-zinc-400">Transactions over this amount are aggressively blocked.</p>
                </div>
                <span className="text-xl font-mono font-bold text-orange-400">₹{require2FA}</span>
              </div>
              <input type="range" min={1000} max={50000} step={500} value={require2FA}
                onChange={e => setRequire2FA(e.target.value)} 
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-400 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(251,146,60,0.5)] [&::-webkit-slider-thumb]:transition-transform hover:[&::-webkit-slider-thumb]:scale-125"
                style={{ background: `linear-gradient(to right, #fb923c ${(require2FA - 1000) / (50000 - 1000) * 100}%, #27272a ${(require2FA - 1000) / (50000 - 1000) * 100}%)` }}
              />
            </div>

            <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20 flex gap-3 items-start mt-8">
              <ShieldAlert className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-orange-400 mb-1">Gating Zone Enabled</h4>
                <p className="text-sm text-orange-300/80 leading-relaxed">
                  Purchases between <strong className="text-orange-300">₹{autoApprove}</strong> and <strong className="text-orange-300">₹{require2FA}</strong> will be held in a <strong>GATED</strong> state. The buyer's AI will be paused until the human owner manually approves the invoice via a 1-click magic link.
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
