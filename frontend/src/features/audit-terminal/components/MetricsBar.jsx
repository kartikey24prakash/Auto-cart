import { formatCurrency } from '../../../shared/utils/format';
import { useAuditPolling } from '../hooks/useAuditPolling';

export default function MetricsBar() {
  const { metrics } = useAuditPolling(3000);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-card border border-border rounded-xl shadow-sm p-6 relative overflow-hidden transition-all duration-300">
        <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-500">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
        </div>
        <div className="text-sm text-muted-foreground font-medium mb-2">Upsell Conversion</div>
        <div className="text-3xl text-foreground font-bold font-mono">
          {metrics.upsellConversion}%
        </div>
      </div>
      
      <div className="bg-card border border-border rounded-xl shadow-sm p-6 relative overflow-hidden transition-all duration-300">
        <div className="absolute top-0 right-0 p-4 opacity-10 text-amber-500">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <div className="text-sm text-muted-foreground font-medium mb-2">Violations Prevented</div>
        <div className="text-3xl text-foreground font-bold font-mono">
          {metrics.violationsPrevented}
        </div>
      </div>
      
      <div className="bg-card border border-border rounded-xl shadow-sm p-6 relative overflow-hidden transition-all duration-300">
        <div className="absolute top-0 right-0 p-4 opacity-10 text-blue-500">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
        </div>
        <div className="text-sm text-muted-foreground font-medium mb-2">Average Order Value</div>
        <div className="text-3xl text-foreground font-bold font-mono">
          {formatCurrency(metrics.aov)}
        </div>
      </div>
    </div>
  );
}
