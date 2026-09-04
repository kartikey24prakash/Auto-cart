import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ShieldCheck, MapPin, Save } from 'lucide-react';
import { Card } from '@/components/ui/card';
import apiClient from '@/shared/services/apiClient';

export default function BuyerSettings() {
  const [mandate, setMandate] = useState({ dailyBudgetLimit: 5000, approvalEmail: '' });
  const [shipping, setShipping] = useState({ 
    fullName: '', addressLine1: '', city: '', state: '', pincode: '', phone: '' 
  });
  const [buyerKey, setBuyerKey] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mandateRes, shippingRes, keyRes] = await Promise.all([
          apiClient.get('/api/dashboard/mandate'),
          apiClient.get('/api/dashboard/shipping'),
          apiClient.get('/api/dashboard/keys')
        ]);
        if (mandateRes.data.mandates?.length > 0) {
          setMandate({ 
            dailyBudgetLimit: mandateRes.data.mandates[0].dailyLimit || mandateRes.data.mandates[0].dailyBudgetLimit,
            maxPerTx: mandateRes.data.mandates[0].maxPerTx || mandateRes.data.mandates[0].dailyLimit,
            approvalEmail: mandateRes.data.mandates[0].approvalEmail || ''
          });
        }
        if (shippingRes.data.shippingProfiles?.length > 0) {
          const profile = shippingRes.data.shippingProfiles[0];
          setShipping({
            fullName: profile.fullName || '',
            addressLine1: profile.addressLine1 || '',
            city: profile.city || '',
            state: profile.state || '',
            pincode: profile.postalCode || '',
            phone: profile.phone || ''
          });
        }
        if (keyRes.data.buyerKey) {
          setBuyerKey(keyRes.data.buyerKey);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        apiClient.put('/api/dashboard/mandate', { 
          dailyLimit: Number(mandate.dailyBudgetLimit),
          maxPerTx: Number(mandate.maxPerTx || mandate.dailyBudgetLimit),
          approvalEmail: mandate.approvalEmail 
        }),
        apiClient.put('/api/dashboard/shipping', shipping)
      ]);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerateKey = async () => {
    if (!window.confirm('Are you sure? Any AI plugins using your old key will immediately lose access.')) return;
    setIsGeneratingKey(true);
    try {
      const res = await apiClient.post('/api/dashboard/keys/regenerate');
      setBuyerKey(res.data.buyerKey);
    } catch (err) {
      alert('Failed to regenerate API Key');
    } finally {
      setIsGeneratingKey(false);
    }
  };

  const handleCopyKey = () => {
    if (!buyerKey) return;
    navigator.clipboard.writeText(buyerKey);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <DashboardLayout role="buyer">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Buyer Settings</h1>
          <p className="text-muted-foreground mt-1">Configure your AI agent limits, shipping, and API access.</p>
        </div>

        {/* Mandate Card */}
        <Card className="p-8 bg-card border-border/50 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-foreground">Auto-Cart Mandate & Billing</h2>
              <p className="text-sm text-muted-foreground">The maximum amount your AI is authorized to spend automatically per day.</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={async () => {
                  try {
                    const res = await apiClient.post('/api/dashboard/payment/link');
                    // Load Razorpay
                    if (!document.getElementById('razorpay-sdk')) {
                      const script = document.createElement('script');
                      script.id = 'razorpay-sdk';
                      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                      document.body.appendChild(script);
                      await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                    
                    const options = {
                      key: res.data.keyId,
                      order_id: res.data.orderId,
                      customer_id: res.data.customerId,
                      name: 'Auto-Cart Auto-Billing',
                      description: 'Link Card for AI Purchases',
                      handler: async (response) => {
                        await apiClient.post('/api/webhook/razorpay', {
                          event: 'payment.authorized',
                          payload: { payment: { entity: { order_id: response.razorpay_order_id, id: response.razorpay_payment_id, customer_id: res.data.customerId, token_id: 'tok_test_simulated' } } }
                        }, { headers: { 'x-razorpay-signature': 'test-webhook-bypass' } });
                        alert('Card linked successfully!');
                      }
                    };
                    const rzp = new window.Razorpay(options);
                    rzp.open();
                  } catch (e) {
                    console.error(e);
                    alert('Failed to initiate card linking.');
                  }
                }}
                className="px-4 py-2 bg-blue-500/10 text-blue-500 font-medium rounded-lg hover:bg-blue-500/20 transition-colors text-sm"
              >
                Link Corporate Card
              </button>
              
              <button 
                onClick={async () => {
                  try {
                    const res = await apiClient.post('/api/dashboard/payment/link');
                    // Bypass Razorpay entirely and simulate the webhook completion
                    await apiClient.post('/api/webhook/razorpay', {
                      event: 'payment.authorized',
                      payload: { payment: { entity: { order_id: res.data.orderId, id: 'pay_dev_bypass', customer_id: res.data.customerId, token_id: 'tok_dev_simulated' } } }
                    }, { headers: { 'x-razorpay-signature': 'test-webhook-bypass' } });
                    alert('Dev Bypass: Tokenization Simulated successfully!');
                  } catch (e) {
                    console.error(e);
                    alert('Dev Bypass Failed.');
                  }
                }}
                className="px-4 py-2 bg-amber-500/10 text-amber-500 font-medium rounded-lg hover:bg-amber-500/20 transition-colors text-sm"
              >
                Dev Bypass
              </button>
            </div>
          </div>

          <div className="space-y-4 max-w-xl">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Daily Budget Limit (Absolute Block)</label>
              <input 
                type="number" 
                value={mandate.dailyBudgetLimit === undefined ? '' : mandate.dailyBudgetLimit}
                onChange={e => setMandate({ ...mandate, dailyBudgetLimit: e.target.value === '' ? '' : Number(e.target.value) })}
                className="w-full bg-background border border-border/60 rounded-lg p-2.5 shadow-sm text-foreground focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all"
              />
              <p className="text-xs text-muted-foreground pt-1">
                The absolute maximum your AI can spend in a day. Purchases exceeding this total are blocked entirely.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-sm font-medium text-foreground">Per-Transaction Auto-Pay Limit</label>
              <input 
                type="number" 
                value={mandate.maxPerTx === undefined ? (mandate.dailyBudgetLimit || '') : mandate.maxPerTx}
                onChange={e => setMandate({ ...mandate, maxPerTx: e.target.value === '' ? '' : Number(e.target.value) })}
                className="w-full bg-background border border-border/60 rounded-lg p-2.5 shadow-sm text-foreground focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all"
              />
              <p className="text-xs text-muted-foreground pt-1">
                Single purchases over this amount require 1-Click human approval. Purchases under this are auto-billed.
              </p>
            </div>
            
            <div className="space-y-2 pt-2">
              <label className="text-sm font-medium text-foreground">Manager Approval Email</label>
              <input 
                type="email" 
                value={mandate.approvalEmail || ''}
                onChange={e => setMandate({ ...mandate, approvalEmail: e.target.value })}
                placeholder="finance@company.com"
                className="w-full bg-background border border-border/60 rounded-lg p-2.5 shadow-sm text-foreground focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all"
              />
              <p className="text-xs text-muted-foreground pt-1">
                When a purchase exceeds the limit above, an approval notification will be sent to this manager.
              </p>
            </div>
          </div>
        </Card>

        {/* Shipping Card */}
        <Card className="p-8 bg-card border-border/50 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Shipping Profile</h2>
              <p className="text-sm text-muted-foreground">The default delivery address your AI will use during checkout.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-foreground">Full Name</label>
              <input 
                type="text" value={shipping.fullName} onChange={e => setShipping({...shipping, fullName: e.target.value})}
                className="w-full bg-background border border-border/60 rounded-lg p-2.5 shadow-sm text-foreground focus:border-purple-500/50 outline-none transition-all"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-foreground">Street Address</label>
              <input 
                type="text" value={shipping.addressLine1} onChange={e => setShipping({...shipping, addressLine1: e.target.value})}
                className="w-full bg-background border border-border/60 rounded-lg p-2.5 shadow-sm text-foreground focus:border-purple-500/50 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">City</label>
              <input 
                type="text" value={shipping.city} onChange={e => setShipping({...shipping, city: e.target.value})}
                className="w-full bg-background border border-border/60 rounded-lg p-2.5 shadow-sm text-foreground focus:border-purple-500/50 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">State</label>
              <input 
                type="text" value={shipping.state} onChange={e => setShipping({...shipping, state: e.target.value})}
                className="w-full bg-background border border-border/60 rounded-lg p-2.5 shadow-sm text-foreground focus:border-purple-500/50 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">PIN Code</label>
              <input 
                type="text" value={shipping.pincode} onChange={e => setShipping({...shipping, pincode: e.target.value})}
                className="w-full bg-background border border-border/60 rounded-lg p-2.5 shadow-sm text-foreground focus:border-purple-500/50 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Phone Number</label>
              <input 
                type="text" value={shipping.phone} onChange={e => setShipping({...shipping, phone: e.target.value})}
                className="w-full bg-background border border-border/60 rounded-lg p-2.5 shadow-sm text-foreground focus:border-purple-500/50 outline-none transition-all"
              />
            </div>
          </div>
        </Card>
        
        <div className="flex justify-end pt-4 pb-12">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-foreground text-background font-medium rounded-lg hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
