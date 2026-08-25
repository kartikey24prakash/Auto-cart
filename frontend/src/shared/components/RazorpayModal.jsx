import React, { useState } from 'react';
import apiClient from '../../shared/services/apiClient';

export default function RazorpayModal({ isOpen, onClose, orderDetails, onProcessed }) {
  const [paymentStep, setPaymentStep] = useState('select'); 
  const [selectedMethod, setSelectedMethod] = useState('card');

  if (!isOpen || !orderDetails) return null;

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
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
          await apiClient.post('/api/engine/commit', {
            auditId: orderDetails.auditId,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature
          }, {
            headers: {
              'x-autocart-signature': 'temp-bypass' // In real life, webhooks don't need this
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
    setPaymentStep('select');
    onClose();
    if (onProcessed) onProcessed();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 border border-blue-500/30 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl shadow-blue-500/10 text-white">
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-5 flex justify-between items-center text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center font-bold text-blue-600 shadow-md text-sm">₹</div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-blue-200">Razorpay Test Checkout</div>
              <div className="text-sm font-bold text-white">SafeAgent Merchant Store</div>
            </div>
          </div>
          <button onClick={resetAndClose} className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-colors">✕</button>
        </div>

        <div className="p-4 bg-slate-800/60 border-b border-slate-700/60 flex justify-between items-center">
          <div>
            <div className="text-xs text-slate-400">Order Ref: {orderDetails.auditId?.substring(0, 10)}</div>
            <div className="text-sm font-medium text-slate-200">Autonomous AI Purchase</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400">Amount to Pay</div>
            <div className="text-xl font-mono font-bold text-emerald-400">₹{orderDetails.amount?.toLocaleString('en-IN') || '0'}</div>
          </div>
        </div>

        <div className="p-6">
          {paymentStep === 'select' && (
            <div className="space-y-4">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Choose Payment Rail</div>
              
              <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl space-y-2 text-xs">
                <div><span className="text-slate-400">Card: </span><span className="font-mono text-slate-200">4111 1111 1111 1111</span></div>
                <div className="flex justify-between">
                  <div><span className="text-slate-400">Exp: </span><span className="font-mono text-slate-200">12/28</span></div>
                  <div><span className="text-slate-400">CVV: </span><span className="font-mono text-slate-200">123</span></div>
                </div>
              </div>

              <button onClick={handlePay} className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all cursor-pointer">
                Launch Official Razorpay
              </button>
            </div>
          )}

          {paymentStep === 'processing' && (
            <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="text-sm font-semibold text-white">Awaiting Razorpay Checkout...</div>
            </div>
          )}

          {paymentStep === 'success' && (
            <div className="py-8 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-3xl text-emerald-400 animate-bounce">✓</div>
              <div>
                <div className="text-lg font-bold text-white">Payment Captured!</div>
                <div className="text-xs text-emerald-400 font-mono mt-1">status: PAYMENT_CAPTURED</div>
              </div>
              <p className="text-xs text-slate-400 max-w-xs">Funds of ₹{orderDetails.amount} successfully transferred to Merchant account.</p>
              <button onClick={resetAndClose} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-600 transition-colors">
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}