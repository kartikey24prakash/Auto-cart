import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Key, Copy, Eye, EyeOff } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function MerchantKeys() {
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState('');

  const merchantKey = 'merch_live_9f3k2a1p';
  const merchantSecret = 'sec_live_Xk9P2mQrT4jN8vZ1';

  const copy = (val, label) => {
    navigator.clipboard.writeText(val);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <DashboardLayout role="merchant">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">API Keys</h1>
          <p className="text-muted-foreground mt-1">Credentials for authenticating the AutoCart SDK.</p>
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
              { label: 'Merchant Key', value: merchantKey, id: 'key' },
              { label: 'Merchant Secret', value: merchantSecret, id: 'secret', hidden: !showSecret }
            ].map(({ label, value, id, hidden }) => (
              <div key={id} className="space-y-2">
                <label className="text-sm font-medium text-foreground">{label}</label>
                <div className="flex items-center gap-2 bg-background border border-border/60 rounded-lg p-1.5 pl-4 shadow-sm transition-colors focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/50">
                  <code className="text-sm text-foreground flex-1 font-mono tracking-wide">
                    {hidden ? '••••••••••••••••••••••••' : value}
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
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Payout Settings</h2>
              <p className="text-sm text-muted-foreground">Configure your Razorpay Linked Account ID to receive automated 98% split payments.</p>
            </div>
          </div>

          <div className="space-y-4 max-w-2xl">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Razorpay Linked Account ID</label>
              <input 
                type="text" 
                placeholder="acc_..." 
                className="w-full bg-background border border-border/60 rounded-lg p-2.5 shadow-sm text-foreground focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all"
              />
              <p className="text-xs text-muted-foreground pt-1">
                This account will automatically receive 98% of the transaction amount directly via Razorpay Route.
              </p>
            </div>
            <button className="px-4 py-2 bg-foreground text-background font-medium rounded-lg text-sm hover:bg-foreground/90 transition-colors">
              Save Payout Routing
            </button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
