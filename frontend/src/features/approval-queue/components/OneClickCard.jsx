import { useState } from 'react';
import { approvalApi } from '../services/approvalApi';
import Badge from '../../../shared/components/Badge';
import DenyButton from './DenyButton';
import { formatCurrency, formatDate } from '../../../shared/utils/format';

export default function OneClickCard({ transaction, onProcessed, onRequest2FA, onPaymentRequired }) {
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
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
    <div className="bg-[#09090b] border border-white/10 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:border-white/20 transition-all duration-300 shadow-2xl">
      <div className="flex-1 w-full">
        <div className="flex items-center justify-between md:justify-start gap-4 mb-4">
          <Badge status={transaction.status} />
          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {formatDate(transaction.createdAt || transaction.timestamp || new Date())}
          </span>
          <span className="text-[10px] text-muted-foreground font-mono px-2 py-1 bg-white/5 border border-white/5 rounded-md ml-auto md:ml-0 uppercase tracking-wider">ID: {transaction.auditId?.substring(0, 8) || 'Unknown'}</span>
        </div>
        
        <div className="flex items-start gap-4 mt-2">
          <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-inner">
            <svg className="w-6 h-6 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-white mb-1.5 tracking-tight">{transaction.details?.title || 'Unknown Product'}</h3>
            <div className="text-sm text-slate-400 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full text-xs border border-white/5">
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                <span className="text-slate-300 font-medium">{transaction.agentId || 'ag_default'}</span>
              </span>
              <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full text-xs border border-white/5">
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                <span className="text-slate-300 font-mono">{transaction.ipAddress || '127.0.0.1'}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col items-start md:items-end gap-5 w-full md:w-auto mt-2 md:mt-0 pt-5 md:pt-0 border-t border-white/10 md:border-t-0 md:pl-6 md:border-l">
        <div className="text-3xl font-bold font-mono text-white tracking-tight">
          {formatCurrency(transaction.amount)}
        </div>
        <div className="flex w-full md:w-auto gap-3">
          <DenyButton auditId={transaction.auditId} onProcessed={onProcessed} />
          <button 
            onClick={handleApprove}
            disabled={loading}
            className={`flex-1 md:flex-none text-sm font-medium px-6 py-2.5 rounded-xl transition-all duration-300 shadow-lg flex items-center justify-center gap-2 bg-white text-black hover:bg-slate-200 shadow-white/10 hover:shadow-white/20`}
          >
            {loading ? (
              <svg className="animate-spin h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
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
