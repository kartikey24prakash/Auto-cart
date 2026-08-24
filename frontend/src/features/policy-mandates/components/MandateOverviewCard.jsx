import { useEffect, useState } from 'react';
import { mandateApi } from '../services/mandateApi';
import { formatCurrency } from '../../../shared/utils/format';

export default function MandateOverviewCard() {
  const [mandates, setMandates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMandates = async () => {
      try {
        const mandateList = await mandateApi.getMandates();
        setMandates(mandateList);
      } catch (err) {
        console.error('Failed to fetch mandates', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMandates();
    const interval = setInterval(fetchMandates, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400 font-medium">
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading Mandates...
      </div>
    );
  }

  return (
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
      {mandates.length === 0 ? (
        <div className="text-slate-400 p-8 glass-card text-center flex flex-col items-center">
          <svg className="w-12 h-12 text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4M8 16l-4-4 4-4M16 8l4 4-4 4" /></svg>
          No agent mandates configured.
        </div>
      ) : (
        mandates.map((m) => {
          const spendPct = Math.min((m.spentToday / m.dailyLimit) * 100, 100);
          const isExhausted = spendPct >= 100;

          return (
            <div key={m.agentId} className="glass-card p-6 md:p-8 flex flex-col group hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                    <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-400">Agent Identity</h3>
                    <div className="text-lg font-bold tracking-tight text-white">{m.agentId}</div>
                  </div>
                </div>
                <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full tracking-wider border ${m.isActive !== false ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                  {m.isActive !== false ? 'Active' : 'Suspended'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50 hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    Max Per Tx (Auto)
                  </div>
                  <div className="text-xl font-mono text-slate-200 font-bold">{formatCurrency(m.maxPerTx)}</div>
                </div>
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50 hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Daily Budget Limit
                  </div>
                  <div className="text-xl font-mono text-slate-200 font-bold">{formatCurrency(m.dailyLimit)}</div>
                </div>
              </div>

              <div className="mt-auto bg-slate-900/30 rounded-xl p-5 border border-slate-800">
                <div className="flex justify-between items-end mb-3">
                  <div className="text-sm text-slate-300 font-medium">Daily Spend Utilization</div>
                  <div className={`font-mono font-bold ${isExhausted ? 'text-red-400 animate-pulse' : 'text-slate-200'}`}>
                    {formatCurrency(m.spentToday)} <span className="text-slate-500 font-normal">/ {formatCurrency(m.dailyLimit)}</span>
                  </div>
                </div>
                
                <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden shadow-inner relative">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden ${
                      isExhausted ? 'bg-gradient-to-r from-red-500 to-rose-600' : 
                      spendPct > 80 ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gradient-to-r from-emerald-400 to-teal-500'
                    }`}
                    style={{ width: `${spendPct}%` }}
                  >
                    {/* Animated shine effect */}
                    <div className="absolute top-0 left-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-150%] animate-[shine_2s_infinite]"></div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-2">
                  <div className="text-xs text-slate-500 font-medium">Reset at midnight (IST)</div>
                  <div className={`text-xs font-bold font-mono ${isExhausted ? 'text-red-400' : 'text-indigo-400'}`}>
                    {spendPct.toFixed(1)}% CONSUMED
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
