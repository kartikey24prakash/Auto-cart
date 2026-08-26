import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Key, Copy, Eye, EyeOff, Link as LinkIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import apiClient from '@/shared/services/apiClient';

export default function MerchantKeys() {
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState('');
  
  const [config, setConfig] = useState(null);
  const [storefrontUrl, setStorefrontUrl] = useState('');
  const [linkedAccountId, setLinkedAccountId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    apiClient.get('/api/dashboard/config').then(res => {
      setConfig(res.data.config);
      setStorefrontUrl(res.data.config.storefrontUrl || '');
      setLinkedAccountId(res.data.config.linkedAccountId || '');
    }).catch(err => console.error(err));
  }, []);

  const copy = (val, label) => {
    navigator.clipboard.writeText(val);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiClient.put('/api/dashboard/config', { storefrontUrl, linkedAccountId });
      alert('Settings saved successfully!');
    } catch (err) {
      alert('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!config) return <DashboardLayout role="merchant"><div className="p-8">Loading configuration...</div></DashboardLayout>;

  return (
    <DashboardLayout role="merchant">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">API Keys & Webhooks</h1>
          <p className="text-muted-foreground mt-1">Credentials and routing configuration for the AutoCart SDK.</p>
        </div>

        <Card className="p-8 bg-card border-border/50 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Production Keys</h2>
              <p className="text-sm text-muted-foreground">Keep your secret key confidential. Do not expose it in client-side code.</p>
            </div>
          </div>

          <div className="space-y-6 max-w-2xl">
            {[
              { label: 'Merchant Key', value: config.merchantKey, id: 'key' },
              { label: 'Merchant Secret', value: config.merchantSecret, id: 'secret', hidden: !showSecret }
            ].map(({ label, value, id, hidden }) => (
              <div key={id} className="space-y-2">
                <label className="text-sm font-medium text-foreground">{label}</label>
                <div className="flex items-center gap-2 bg-background border border-border/60 rounded-lg p-1.5 pl-4 shadow-sm transition-colors focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/50">
                  <code className="text-sm text-foreground flex-1 font-mono tracking-wide">
                    {hidden ? '••••••••••••••••••••••••••••••••' : value}
                  </code>
                  <div className="flex items-center gap-1 pr-1">
                    {id === 'secret' && (
                      <button 
                        onClick={() => setShowSecret(!showSecret)} 
                        className="p-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    )}
                    <button 
                      onClick={() => copy(value, id)} 
                      className="p-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors relative"
                    >
                      <Copy className="w-4 h-4" />
                      {copied === id && (
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-foreground text-background text-[10px] rounded shadow-lg whitespace-nowrap font-medium">
                          Copied!
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-8 bg-card border-border/50 shadow-sm mt-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
              <LinkIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">External Integration</h2>
              <p className="text-sm text-muted-foreground">Configure your external Storefront URL and Razorpay Payout Routing.</p>
            </div>
          </div>

          <div className="space-y-6 max-w-2xl">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Storefront Webhook URL</label>
              <input 
                type="text" 
                placeholder="https://your-store.com/autocart/checkout"
                value={storefrontUrl}
                onChange={e => setStorefrontUrl(e.target.value)}
                className="w-full bg-background border border-border/60 rounded-lg p-2.5 shadow-sm text-foreground focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all"
              />
              <p className="text-xs text-muted-foreground pt-1">
                If provided, Buyer AIs will route checkout requests to this URL for your backend to sign and authorize.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Razorpay Linked Account ID</label>
              <input 
                type="text" 
                placeholder="acc_..." 
                value={linkedAccountId}
                onChange={e => setLinkedAccountId(e.target.value)}
                className="w-full bg-background border border-border/60 rounded-lg p-2.5 shadow-sm text-foreground focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all"
              />
              <p className="text-xs text-muted-foreground pt-1">
                This account will automatically receive 98% of the transaction amount directly via Razorpay Route.
              </p>
            </div>

            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-foreground text-background font-medium rounded-lg text-sm hover:bg-foreground/90 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
