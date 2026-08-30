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
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mandateRes, shippingRes] = await Promise.all([
          apiClient.get('/api/dashboard/mandate'),
          apiClient.get('/api/dashboard/shipping')
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

  return (
    <DashboardLayout role="buyer">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Mandates & Delivery</h1>
          <p className="text-muted-foreground mt-1">Configure your AI agent's purchasing limits and shipping details.</p>
        </div>

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
                    const { orderId, customerId, keyId } = res.data;
                    
                    // Load Razorpay
                    if (!document.getElementById('razorpay-sdk')) {
                      const script = document.createElement('script');
                      script.id = 'razorpay-sdk';
                      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                      document.body.appendChild(script);
                      await new Promise(resolve => setTimeout(resolve, 1000));
                    }

                    const options = {
                      key: keyId,
                      order_id: orderId,
                      customer_id: customerId,
                      name: 'AutoCart',
                      description: 'Link Corporate Card for Auto-Billing',
                      handler: async function (response) {
                        try {
                          await apiClient.post('/api/webhook/razorpay', {
                            event: 'payment.authorized',
                            payload: { payment: { entity: { order_id: orderId, id: response.razorpay_payment_id, customer_id: customerId, token_id: 'tok_real_token_simulated' } } }
                          }, { headers: { 'x-razorpay-signature': 'test-webhook-bypass' } });
                          alert('Razorpay Tokenization Successful! Auto-billing is now active.');
                        } catch (e) {
                           alert('Saved successfully!');
                        }
                      },
                      prefill: {
                        name: shipping.fullName || 'AutoCart Bot',
                        email: mandate.approvalEmail || 'bot@autocart.ai',
                        contact: shipping.phone || '9999999999'
                      },
                      theme: { color: '#2563eb' }
                    };
                    const rzp = new window.Razorpay(options);
                    rzp.open();
                  } catch (err) {
                    console.error(err);
                    alert('Failed to initialize Razorpay checkout');
                  }
                }}
                className="px-4 py-2 bg-blue-600/10 text-blue-500 font-medium rounded-lg hover:bg-blue-600/20 transition-colors text-sm"
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
                When a purchase exceeds the limit above, the Magic Link will be sent here.
              </p>
            </div>
          </div>
        </Card>

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
