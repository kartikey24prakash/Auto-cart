import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ShieldAlert, Sliders } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import apiClient from '@/shared/services/apiClient';

export default function MerchantFirewall() {
  const [autoApprove, setAutoApprove] = useState(500);
  const [require2FA, setRequire2FA] = useState(5000);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiClient.get('/api/dashboard/config').then(res => {
      const rules = res.data.config.firewallRules;
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
    try {
      await apiClient.put('/api/dashboard/config', {
        firewallRules: {
          autoApproveUnder: Number(autoApprove),
          require2FAOver: Number(require2FA)
        }
      });
      alert('Firewall Rules Saved!');
    } catch (err) {
      alert('Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <DashboardLayout role="merchant"><div className="p-8">Loading rules...</div></DashboardLayout>;

  return (
    <DashboardLayout role="merchant">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Firewall Rules</h1>
          <p className="text-muted-foreground mt-1">Configure exactly how AI purchases interact with your store.</p>
        </div>

        <Card className="p-8 bg-card border-border/50 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Threshold Settings</h2>
              <p className="text-sm text-muted-foreground">Adjust at what amounts transactions require manual verification.</p>
            </div>
          </div>

          <div className="space-y-8 max-w-2xl">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <label className="text-sm font-medium text-foreground">Auto-Approve Threshold</label>
                  <p className="text-xs text-muted-foreground">Transactions under this amount bypass 2FA gating.</p>
                </div>
                <span className="text-xl font-mono font-bold text-emerald-400">₹{autoApprove}</span>
              </div>
              <input type="range" min={100} max={5000} step={100} value={autoApprove}
                onChange={e => setAutoApprove(e.target.value)} className="w-full accent-emerald-500 h-2 bg-muted rounded-full appearance-none" />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <label className="text-sm font-medium text-foreground">Require 2FA Threshold</label>
                  <p className="text-xs text-muted-foreground">Transactions over this amount are aggressively blocked.</p>
                </div>
                <span className="text-xl font-mono font-bold text-orange-400">₹{require2FA}</span>
              </div>
              <input type="range" min={1000} max={50000} step={500} value={require2FA}
                onChange={e => setRequire2FA(e.target.value)} className="w-full accent-orange-500 h-2 bg-muted rounded-full appearance-none" />
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
              <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-500 text-white px-8">
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
