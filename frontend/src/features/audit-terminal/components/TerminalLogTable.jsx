import Badge from '../../../shared/components/Badge';
import { formatCurrency, formatDate } from '../../../shared/utils/format';
import { useAuditPolling } from '../hooks/useAuditPolling';

export default function TerminalLogTable() {
  const { logs, loading } = useAuditPolling(3000);

  return (
    <div className="bg-card border border-border rounded-xl h-full flex flex-col overflow-hidden shadow-sm">
      <div className="flex justify-between items-center p-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
          <span className="font-semibold text-foreground tracking-wide">Real-Time Event Stream</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Live</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="text-muted-foreground bg-muted/50 sticky top-0 z-10 border-b border-border font-medium">
            <tr>
              <th className="px-6 py-3 font-medium">Timestamp</th>
              <th className="px-6 py-3 font-medium">Agent ID</th>
              <th className="px-6 py-3 font-medium">Action</th>
              <th className="px-6 py-3 font-medium">Amount</th>
              <th className="px-6 py-3 font-medium">Destination (Fulfillment)</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Block Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && logs.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-8 text-center text-muted-foreground font-medium animate-pulse">
                  Connecting to gateway...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-8 text-center text-muted-foreground font-medium">
                  Awaiting agent telemetry...
                </td>
              </tr>
            ) : (
              logs.map(log => (
                <tr key={log._id || Math.random()} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-3 font-mono text-muted-foreground text-xs">{formatDate(log.createdAt || log.timestamp)}</td>
                  <td className="px-6 py-3 font-mono text-muted-foreground">
                    <span className="px-2 py-1 bg-muted rounded-md border border-border transition-colors text-xs">
                      {log.agentId || log.buyerId ? (log.agentId || log.buyerId).substring(0, 8) + '...' : log.ipAddress || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-3 font-medium text-foreground">{log.sku || log.actionType}</td>
                  <td className="px-6 py-3 font-mono text-foreground">{formatCurrency(log.amount)}</td>
                  <td className="px-6 py-3">
                    {log.shippingAddress ? (
                      <div className="text-xs text-muted-foreground font-mono space-y-0.5 leading-tight whitespace-normal max-w-[150px]">
                        <div className="font-semibold text-foreground">{log.shippingAddress.addressLine1}</div>
                        <div>{log.shippingAddress.city}, {log.shippingAddress.state} {log.shippingAddress.postalCode}</div>
                        <div>{log.shippingAddress.country}</div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-3"><Badge status={log.status} /></td>
                  <td className="px-6 py-3 text-red-500 text-xs font-mono">{log.blockReason || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
