import { useState, useRef, useEffect } from 'react';
import { approvalApi } from '../services/approvalApi';

export default function TOTPModal({ isOpen, auditId, onClose, onSuccess }) {
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await approvalApi.approve(auditId, totpCode);
      setTotpCode('');
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Validation failed. Please try again.');
      setTotpCode('');
      if (inputRef.current) inputRef.current.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className="glass-card p-8 max-w-sm w-full relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
        
        <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
          <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        </div>

        <h2 className="text-xl font-bold text-white mb-2 text-center tracking-tight">
          Two-Factor Authentication
        </h2>
        <p className="text-sm text-slate-400 mb-6 text-center font-medium">
          Transaction <span className="font-mono text-slate-300 bg-slate-800 px-1 py-0.5 rounded">{auditId.substring(0, 8)}</span> requires step-up authentication. Enter your 6-digit TOTP code.
        </p>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            ref={inputRef}
            type="text"
            maxLength={6}
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="000000"
            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl text-center text-3xl tracking-[0.5em] font-mono text-white py-4 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-600 placeholder:tracking-normal"
            disabled={loading}
          />
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-3 text-sm font-medium text-center animate-pulse">
              {error}
            </div>
          )}
          
          <div className="flex gap-3 mt-4">
            <button 
              type="button" 
              onClick={() => { setTotpCode(''); setError(null); onClose(); }}
              className="flex-1 py-3 rounded-xl font-semibold text-slate-400 bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 py-3 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || totpCode.length !== 6}
            >
              Verify Code
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
