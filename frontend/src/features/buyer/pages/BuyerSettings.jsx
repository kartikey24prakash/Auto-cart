import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ShieldCheck, MapPin, Save } from 'lucide-react';
import { Card } from '@/components/ui/card';
import apiClient from '@/shared/services/apiClient';

export default function BuyerSettings() {
  const [mandate, setMandate] = useState({ dailyBudgetLimit: 5000 });
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
          setMandate({ dailyBudgetLimit: mandateRes.data.mandates[0].dailyLimit });
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
        // Backend expects { dailyLimit: number }
        apiClient.put('/api/dashboard/mandate', { dailyLimit: Number(mandate.dailyBudgetLimit) }),
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
            <button 
              onClick={async () => {
                try {
                  await apiClient.post('/api/dashboard/payment/link');
                  alert('Razorpay Tokenization Successful! Auto-billing is now active.');
                } catch (err) {
                  console.error(err);
                }
              }}
              className="px-4 py-2 bg-blue-600/10 text-blue-500 font-medium rounded-lg hover:bg-blue-600/20 transition-colors text-sm"
            >
              Link Corporate Card
            </button>
          </div>

          <div className="space-y-4 max-w-xl">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Daily Budget Limit (₹)</label>
              <input 
                type="number" 
                value={mandate.dailyBudgetLimit}
                onChange={e => setMandate({ ...mandate, dailyBudgetLimit: Number(e.target.value) })}
                className="w-full bg-background border border-border/60 rounded-lg p-2.5 shadow-sm text-foreground focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all"
              />
              <p className="text-xs text-muted-foreground pt-1">
                Purchases exceeding this limit will be placed in your Approval Inbox. Purchases under this limit will be auto-billed to your linked card.
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
