import React, { useState } from 'react';

export default function RazorpayModal({ isOpen, onClose, orderDetails }) {
  const [paymentStep, setPaymentStep] = useState('select'); // 'select' | 'processing' | 'success'
  const [selectedMethod, setSelectedMethod] = useState('upi');

  if (!isOpen || !orderDetails) return null;

  const handlePay = () => {
    setPaymentStep('processing');
    setTimeout(() => {
      setPaymentStep('success');
    }, 1500);
  };

  const resetAndClose = () => {
    setPaymentStep('select');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 border border-blue-500/30 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl shadow-blue-500/10 text-white">
        {/* Razorpay Brand Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-5 flex justify-between items-center text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center font-bold text-blue-600 shadow-md text-sm">
              ₹
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-blue-200">Razorpay Test Checkout</div>
              <div className="text-sm font-bold text-white">SafeAgent Merchant Store</div>
            </div>
          </div>
          <button 
            onClick={resetAndClose}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Order Details Banner */}
        <div className="p-4 bg-slate-800/60 border-b border-slate-700/60 flex justify-between items-center">
          <div>
            <div className="text-xs text-slate-400">Order Ref: {orderDetails.auditId ? orderDetails.auditId.substring(0, 10) + '...' : orderDetails.razorpayOrderId}</div>
            <div className="text-sm font-medium text-slate-200">{orderDetails.sku || 'Autonomous AI Purchase'}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400">Amount to Pay</div>
            <div className="text-xl font-mono font-bold text-emerald-400">₹{orderDetails.amount?.toLocaleString('en-IN') || '0'}</div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {paymentStep === 'select' && (
            <div className="space-y-4">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Choose Payment Rail</div>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSelectedMethod('upi')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                    selectedMethod === 'upi'
                      ? 'border-blue-500 bg-blue-500/10 text-white shadow-md shadow-blue-500/10'
                      : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <span className="text-2xl">📱</span>
                  <span className="text-xs font-bold">UPI QR / Intent</span>
                </button>

                <button
                  onClick={() => setSelectedMethod('card')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                    selectedMethod === 'card'
                      ? 'border-blue-500 bg-blue-500/10 text-white shadow-md shadow-blue-500/10'
                      : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <span className="text-2xl">💳</span>
                  <span className="text-xs font-bold">Test Card</span>
                </button>
              </div>

              {selectedMethod === 'upi' ? (
                <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl flex flex-col items-center text-center space-y-2">
                  <div className="w-32 h-32 bg-white rounded-lg p-2 flex items-center justify-center shadow-inner">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=upi://pay?pa=safeagent@razorpay&pn=Merchant&am=${orderDetails.amount}&cu=INR`} 
                      alt="UPI QR Code" 
                      className="w-full h-full"
                    />
                  </div>
                  <div className="text-xs text-slate-300 font-medium">Scan with any UPI app (GPay / PhonePe / Paytm)</div>
                  <div className="text-[10px] text-slate-500">NPCI Unified Agentic Payments (UAP) Test Gateway</div>
                </div>
              ) : (
                <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400">Card: </span>
                    <span className="font-mono text-slate-200">4111 2222 3333 4444</span>
                  </div>
                  <div className="flex justify-between">
                    <div><span className="text-slate-400">Exp: </span><span className="font-mono text-slate-200">12/28</span></div>
                    <div><span className="text-slate-400">CVV: </span><span className="font-mono text-slate-200">123</span></div>
                  </div>
                </div>
              )}

              <button
                onClick={handlePay}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
              >
                Simulate Successful Payment
              </button>
            </div>
          )}

          {paymentStep === 'processing' && (
            <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="text-sm font-semibold text-white">Communicating with Razorpay Test API...</div>
              <div className="text-xs text-slate-400">Verifying HMAC cryptographic webhook signature</div>
            </div>
          )}

          {paymentStep === 'success' && (
            <div className="py-8 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-3xl text-emerald-400 animate-bounce">
                ✓
              </div>
              <div>
                <div className="text-lg font-bold text-white">Payment Captured!</div>
                <div className="text-xs text-emerald-400 font-mono mt-1">status: PAYMENT_CAPTURED</div>
              </div>
              <p className="text-xs text-slate-400 max-w-xs">
                Funds of ₹{orderDetails.amount} successfully transferred to Merchant account. Audit log updated with zero-PII receipt.
              </p>
              <button
                onClick={resetAndClose}
                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-600 transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}