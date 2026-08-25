import { useState } from 'react';
import { approvalApi } from '../services/approvalApi';
import Badge from '../../../shared/components/Badge';
import DenyButton from './DenyButton';
import { formatCurrency, formatDate } from '../../../shared/utils/format';

export default function OneClickCard({ transaction, onProcessed, onRequest2FA, onPaymentRequired }) {
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    if (transaction.status === 'GATED_2FA') {
      onRequest2FA(transaction.auditId);
      return;
    }
    
    // If it's already ORDER_CREATED, we just need to pay
    if (transaction.status === 'ORDER_CREATED') {
      onPaymentRequired({
        auditId: transaction.auditId,
        razorpayOrderId: transaction.razorpayOrderId,
        amount: transaction.amount,
        keyId: transaction.merchantConfig?.razorpayKeyId || 'rzp_test_TOZjfrDBXXsQ78' // Fallback for UI if missing
      });
      return;
    }

    setLoading(true);
    try {
      const res = await approvalApi.approve(transaction.auditId);
      onPaymentRequired({
        auditId: transaction.auditId,
        razorpayOrderId: res.razorpayOrderId,
        amount: res.amount,
        keyId: res.keyId
      });
    } catch (err) {
      console.error('Failed to approve', err);
      alert('Failed to approve: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-all duration-300">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-3">
          <Badge status={transaction.status} />
          <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {formatDate(transaction.createdAt || transaction.timestamp || new Date())}
          </span>
          <span className="text-xs text-muted-foreground font-mono px-2 py-0.5 bg-muted border border-border rounded-md">ID: {transaction.auditId?.substring(0, 8) || 'Unknown'}</span>
        </div>
        
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
          </div>
          <div>
            <h3 className="font-bold text-lg text-white mb-1">{transaction.details?.title || 'Unknown Product'}</h3>
            <div className="text-sm text-slate-400 flex items-center gap-4">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                <span className="text-slate-300 font-medium">{transaction.agentId || 'Unknown'}</span>
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                <span className="text-slate-300 font-mono">{transaction.ipAddress}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col items-start md:items-end gap-4 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t border-slate-700/30 md:border-t-0">
        <div className="text-2xl font-bold font-mono text-white">
          {formatCurrency(transaction.amount)}
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <DenyButton auditId={transaction.auditId} onProcessed={onProcessed} />
          <button 
            onClick={handleApprove}
            disabled={loading}
            className={`flex-1 md:flex-none text-sm font-semibold px-5 py-2 rounded-lg transition-all duration-300 shadow-lg flex items-center justify-center gap-2 ${
              transaction.status === 'GATED_2FA' 
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20' 
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
            }`}
          >
            {loading ? (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : transaction.status === 'GATED_2FA' ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                Require 2FA
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Approve Now
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
