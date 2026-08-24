import { useState } from 'react';
import { useSession } from '../state/SessionContext';
import apiClient from '../services/apiClient';

export default function KeyGate({ children }) {
  const { merchantKey, setMerchantKey } = useSession();
  const [inputKey, setInputKey] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get('/api/dashboard/metrics', {
        headers: { 'x-merchant-key': inputKey }
      });
      
      if (response.status === 200) {
        setMerchantKey(inputKey);
      }
    } catch (_err) {
      setError('Invalid Merchant Key. Authorization denied.');
    } finally {
      setLoading(false);
    }
  };

  if (merchantKey) {
    return <>{children}</>;
  }

  return (
    <div className="flex items-center justify-center h-full p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-md w-full glass-card p-10 text-center relative z-10">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
          Secure Login
        </h1>
        <p className="mb-8 text-slate-400 font-medium">
          Enter your merchant shared secret to access the SafeAgent Gateway dashboard.
        </p>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <input 
            type="password" 
            value={inputKey} 
            onChange={(e) => setInputKey(e.target.value)}
            className="term-input text-center text-xl tracking-widest placeholder:tracking-normal placeholder:text-slate-600"
            placeholder="Merchant Secret"
            autoFocus
          />
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-3 text-sm font-medium animate-pulse">
              {error}
            </div>
          )}
          <button type="submit" className="term-button mt-2" disabled={loading}>
            {loading ? 'Authenticating...' : 'Unlock Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}
