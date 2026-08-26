import { useEffect, useState } from 'react';
import { mandateApi } from '../services/mandateApi';
import { formatCurrency } from '../../../shared/utils/format';
import { ShieldCheck, PenSquare, ArrowRight, Zap, Ban } from 'lucide-react';

export default function MandateOverviewCard() {
  const [mandates, setMandates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editLimit, setEditLimit] = useState('');

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

  useEffect(() => {
    fetchMandates();
    const interval = setInterval(fetchMandates, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateLimit = async (agentId, valueOverride) => {
    try {
      const newLimit = valueOverride || parseInt(editLimit, 10);
      if (isNaN(newLimit) || newLimit < 1) return;
      await mandateApi.updateMandate(newLimit);
      setIsEditing(false);
      fetchMandates(); // Refresh immediately
    } catch (err) {
      console.error('Failed to update mandate', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12 text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl">
      {mandates.length === 0 ? (
        <div className="p-8 border border-border bg-card text-center text-muted-foreground rounded">
          No agent mandates configured.
        </div>
      ) : (
        mandates.map((m) => {
          const spendPct = Math.min((m.spentToday / m.dailyLimit) * 100, 100);
          const isExhausted = spendPct >= 100;

          return (
            <div key={m.agentId} className="bg-card border border-border p-6 shadow-sm mb-6 flex flex-col gap-6">
              
              {/* Header */}
              <div className="flex items-start justify-between border-b border-border/50 pb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 text-purple-500 rounded-md">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">AI Safeguards & Budget Cap</h2>
                    <p className="text-sm text-muted-foreground">Prevent price gouging and set strict agent limits.</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider border ${m.isActive !== false ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                  {m.isActive !== false ? 'Active' : 'Suspended'}
                </span>
              </div>
              
              {/* Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Max Authorized Input */}
                <div className="bg-background border border-border p-4 rounded-md flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
                      <Zap className="w-4 h-4 text-muted-foreground" />
                      Max Authorized Amount
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">Hard limit on daily AI spend.</p>
                  </div>
                  
                  {!isEditing ? (
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-mono text-purple-400 font-bold">
                        {formatCurrency(m.dailyLimit)}
                      </div>
                      <button 
                        onClick={() => { setIsEditing(true); setEditLimit(m.dailyLimit); }}
                        className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-muted text-foreground hover:bg-muted/80 rounded transition-colors"
                      >
                        <PenSquare className="w-3.5 h-3.5" /> Modify
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground font-mono">₹</span>
                        <input 
                          type="number" 
                          value={editLimit}
                          onChange={(e) => setEditLimit(e.target.value)}
                          className="flex-1 bg-background border border-border rounded-sm px-2 py-1.5 text-sm font-mono text-foreground outline-none focus:border-purple-500"
                          autoFocus
                        />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleUpdateLimit(m.agentId)} className="flex-1 bg-foreground text-background text-xs font-medium py-1.5 rounded-sm hover:opacity-90 transition-opacity">
                          Confirm
                        </button>
                        <button onClick={() => setIsEditing(false)} className="flex-1 bg-muted text-foreground text-xs font-medium py-1.5 rounded-sm hover:bg-muted/80 transition-opacity">
                          Cancel
                        </button>
                      </div>
                      <div className="flex gap-2 pt-1 border-t border-border/50">
                        <button onClick={() => handleUpdateLimit(m.agentId, 1000)} className="text-[10px] flex-1 border border-border py-1 text-muted-foreground hover:text-foreground">₹1K</button>
                        <button onClick={() => handleUpdateLimit(m.agentId, 5000)} className="text-[10px] flex-1 border border-border py-1 text-muted-foreground hover:text-foreground">₹5K</button>
                        <button onClick={() => handleUpdateLimit(m.agentId, 10000)} className="text-[10px] flex-1 border border-border py-1 text-muted-foreground hover:text-foreground">₹10K</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Single TX Limit */}
                <div className="bg-background border border-border p-4 rounded-md flex flex-col justify-between opacity-70 cursor-not-allowed">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
                      <Ban className="w-4 h-4 text-muted-foreground" />
                      Per-Transaction Cap
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">Hard limit on a single checkout.</p>
                  </div>
                  <div className="text-xl font-mono text-muted-foreground font-bold">
                    {formatCurrency(m.maxPerTx)} <span className="text-xs font-sans font-normal ml-2">(Auto-Calculated)</span>
                  </div>
                </div>

              </div>

              {/* Progress Bar */}
              <div className="bg-muted/30 p-4 rounded-md border border-border">
                <div className="flex justify-between items-end mb-2">
                  <div className="text-sm text-foreground font-medium">Daily Spend Utilization</div>
                  <div className={`font-mono font-bold ${isExhausted ? 'text-red-400 animate-pulse' : 'text-foreground'}`}>
                    {formatCurrency(m.spentToday)} <span className="text-muted-foreground font-normal">/ {formatCurrency(m.dailyLimit)}</span>
                  </div>
                </div>
                
                <div className="h-2 w-full bg-border rounded-none overflow-hidden relative">
                  <div 
                    className={`h-full transition-all duration-1000 ease-out ${
                      isExhausted ? 'bg-red-500' : 
                      spendPct > 80 ? 'bg-yellow-500' : 'bg-purple-500'
                    }`}
                    style={{ width: `${spendPct}%` }}
                  />
                </div>
                
                <div className="flex justify-between items-center mt-2">
                  <div className="text-[11px] text-muted-foreground">Resets at midnight IST</div>
                  <div className={`text-[11px] font-bold font-mono ${isExhausted ? 'text-red-400' : 'text-purple-400'}`}>
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
