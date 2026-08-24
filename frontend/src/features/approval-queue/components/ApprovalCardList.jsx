import { useEffect, useState } from 'react';
import { auditApi } from '../../audit-terminal/services/auditApi';
import OneClickCard from './OneClickCard';
import TOTPModal from './TOTPModal';

export default function ApprovalCardList() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totpModalState, setTotpModalState] = useState({ isOpen: false, auditId: null });

  const fetchTransactions = async () => {
    try {
      const logs = await auditApi.getLogs();
      if (!Array.isArray(logs)) {
        console.error('Invalid logs format:', logs);
        setTransactions([]);
        return;
      }
      const gated = logs.filter(log => 
        log.status === 'GATED_1_CLICK' || log.status === 'GATED_2FA'
      );
      setTransactions(gated);
    } catch (err) {
      console.error('Failed to fetch gated transactions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    const interval = setInterval(fetchTransactions, 3000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400 font-medium h-64">
        <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-amber-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Scanning Approval Queue...
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto pr-2 space-y-4 pb-12">
      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border rounded-xl border-dashed border-border bg-card text-muted-foreground text-center p-8">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Queue is Empty</h3>
          <p>All agent mandates are operating within autonomous bounds.</p>
        </div>
      ) : (
        transactions.map(tx => (
          <OneClickCard 
            key={tx.auditId} 
            transaction={tx} 
            onProcessed={fetchTransactions}
            onRequest2FA={(auditId) => setTotpModalState({ isOpen: true, auditId })}
          />
        ))
      )}

      <TOTPModal 
        isOpen={totpModalState.isOpen}
        auditId={totpModalState.auditId}
        onClose={() => setTotpModalState({ isOpen: false, auditId: null })}
        onSuccess={() => {
          setTotpModalState({ isOpen: false, auditId: null });
          fetchTransactions();
        }}
      />
    </div>
  );
}
