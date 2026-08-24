import { useState } from 'react';
import { approvalApi } from '../services/approvalApi';

export default function DenyButton({ auditId, onProcessed }) {
  const [loading, setLoading] = useState(false);

  const handleDeny = async () => {
    setLoading(true);
    try {
      await approvalApi.deny(auditId);
      onProcessed();
    } catch (err) {
      console.error('Failed to deny', err);
      alert('Failed to deny: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleDeny} 
      disabled={loading}
      className="text-sm font-medium px-4 py-2 rounded-lg text-slate-400 bg-slate-800/50 hover:bg-rose-500/10 hover:text-rose-400 border border-slate-700/50 hover:border-rose-500/20 transition-all duration-300"
    >
      {loading ? 'Processing...' : 'Deny Request'}
    </button>
  );
}
