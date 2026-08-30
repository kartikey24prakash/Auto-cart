import React, { useState } from 'react';
import apiClient from '../../shared/services/apiClient';

export default function RazorpayModal({ isOpen, onClose, orderDetails, onProcessed }) {
  const [paymentStep, setPaymentStep] = useState('select'); 
  const [selectedMethod, setSelectedMethod] = useState('card');

  if (!isOpen || !orderDetails) return null;

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (document.getElementById('razorpay-sdk')) {
        return resolve(true);
      }
      const script = document.createElement('script');
      script.id = 'razorpay-sdk';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePay = async () => {
    setPaymentStep('processing');
    const res = await loadRazorpay();
    if (!res) {
      alert('Razorpay SDK failed to load. Are you online?');
      setPaymentStep('select');
      return;
    }

    const options = {
      key: orderDetails.keyId,
      amount: orderDetails.amount * 100,
      currency: 'INR',
      name: 'SafeAgent Merchant Store',
      description: 'Test Autonomous Checkout',
      order_id: orderDetails.razorpayOrderId,
      handler: async function (response) {
        setPaymentStep('success');
        // Notify backend that payment was captured (simulating webhook for now)
        try {
          // Simulating the Razorpay Webhook locally since we don't have a public URL
          await apiClient.post('/api/webhook/razorpay', {
            event: 'payment.captured',
            payload: {
              payment: {
                entity: {
                  id: response.razorpay_payment_id,
                  order_id: orderDetails.razorpayOrderId
                }
              }
            }
          }, {
            headers: {
              'x-razorpay-signature': 'test-webhook-bypass'
            }
          });
        } catch (e) {
          console.error('Commit failed', e);
        }
      },
      prefill: {
        name: 'AutoCart Bot',
        email: 'bot@autocart.ai',
        contact: '9999999999'
      },
      theme: {
        color: '#2563eb'
      }
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.on('payment.failed', function (response) {
      alert('Payment failed: ' + response.error.description);
      setPaymentStep('select');
    });
    paymentObject.open();
  };

  const resetAndClose = () => {
    const wasSuccess = paymentStep === 'success';
    setPaymentStep('select');
    onClose();
    if (onProcessed) onProcessed(wasSuccess);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#09090b] border border-white/10 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl shadow-black/60 text-white flex flex-col">
        <div className="bg-[#09090b] border-b border-white/5 p-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shadow-inner border border-white/5">
              <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Checkout Modal</div>
              <div className="text-sm font-semibold text-white">SafeAgent Auto-Cart</div>
            </div>
          </div>
          <button onClick={resetAndClose} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-5 bg-white/[0.02] border-b border-white/5 flex justify-between items-center">
          <div>
            <div className="text-xs text-slate-400 font-medium mb-1">Order Ref: <span className="font-mono text-slate-300 bg-white/5 px-1 py-0.5 rounded">{orderDetails.auditId?.substring(0, 8)}</span></div>
            <div className="text-sm font-semibold text-white/90">Autonomous Verification</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400 font-medium mb-1">Amount Due</div>
            <div className="text-xl font-mono font-bold text-white tracking-tight">₹{orderDetails.amount?.toLocaleString('en-IN') || '0'}</div>
          </div>
        </div>

        <div className="p-6">
          {paymentStep === 'select' && (
            <div className="space-y-5">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Test Credentials</div>
              
              <div className="bg-[#111113] border border-white/5 p-4 rounded-xl space-y-2.5 text-sm">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-400">Card</span>
                  <span className="font-mono font-medium text-slate-200">4111 1111 1111 1111</span>
                </div>
                <div className="flex justify-between">
                  <div className="flex items-center gap-2"><span className="text-slate-400">Exp:</span><span className="font-mono font-medium text-slate-200">12/28</span></div>
                  <div className="flex items-center gap-2"><span className="text-slate-400">CVV:</span><span className="font-mono font-medium text-slate-200">123</span></div>
                </div>
              </div>

              <button onClick={handlePay} className="w-full py-3 bg-white hover:bg-slate-200 text-black font-semibold rounded-xl transition-all shadow-lg shadow-white/5 hover:shadow-white/10 flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                Launch Razorpay UI
              </button>
            </div>
          )}

          {paymentStep === 'processing' && (
            <div className="py-14 flex flex-col items-center justify-center space-y-5 text-center">
              <div className="w-10 h-10 border-2 border-slate-600 border-t-white rounded-full animate-spin"></div>
              <div className="text-sm font-medium text-slate-300">Awaiting External Checkout...</div>
            </div>
          )}

          {paymentStep === 'success' && (
            <div className="py-10 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <div>
                <div className="text-lg font-bold text-white tracking-tight">Payment Captured</div>
                <div className="text-[10px] text-emerald-400/80 font-mono mt-1.5 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-full inline-block">status: PAY_SUCCESS</div>
              </div>
              <p className="text-sm text-slate-400 max-w-[250px] leading-relaxed">Funds of ₹{orderDetails.amount} successfully transferred to the Merchant.</p>
              <button onClick={resetAndClose} className="mt-4 px-8 py-2.5 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-xl border border-white/10 transition-colors">
                Return to Approvals
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}