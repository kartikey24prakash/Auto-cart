import React, { useState } from 'react';
import Badge from '../../../shared/components/Badge';
import { formatCurrency, formatDate } from '../../../shared/utils/format';
import { useAuditPolling } from '../hooks/useAuditPolling';

export default function TerminalLogTable() {
  const { logs, loading } = useAuditPolling(3000);
  const [expandedId, setExpandedId] = useState(null);

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
              logs.map(log => {
                const isExpanded = expandedId === log.auditId;
                const deliverySteps = ['PENDING', 'PREPARING', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED'];
                const currentStepIndex = deliverySteps.indexOf(log.deliveryStatus || 'PENDING');
                
                return (
                  <React.Fragment key={log.auditId}>
                    <tr onClick={() => setExpandedId(isExpanded ? null : log.auditId)} className={`hover:bg-muted/30 transition-colors cursor-pointer ${isExpanded ? 'bg-muted/10' : ''}`}>
                      <td className="px-6 py-4 font-mono text-muted-foreground text-xs">{formatDate(log.createdAt || log.timestamp)}</td>
                      <td className="px-6 py-4 font-mono text-muted-foreground">
                        <span className="px-2 py-1 bg-muted rounded-md border border-border transition-colors text-xs">
                          {log.agentId || log.buyerId ? (log.agentId || log.buyerId).substring(0, 8) + '...' : log.ipAddress || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">
                        <div>{log.productName || log.sku || log.actionType}</div>
                        {log.merchantName && <div className="text-xs text-muted-foreground">sold by {log.merchantName}</div>}
                      </td>
                      <td className="px-6 py-4 font-mono text-foreground">{formatCurrency(log.amount)}</td>
                      <td className="px-6 py-4">
                        {log.shippingAddress ? (
                          <div className="text-xs text-muted-foreground font-mono space-y-0.5 leading-tight whitespace-normal max-w-[150px]">
                            <div className="font-semibold text-foreground">{log.shippingAddress.addressLine1}</div>
                            <div>{log.shippingAddress.city}, {log.shippingAddress.state} {log.shippingAddress.postalCode}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4"><Badge status={log.status} /></td>
                      <td className="px-6 py-4 text-red-500 text-xs font-mono">{log.blockReason || '-'}</td>
                    </tr>
                    {isExpanded && log.status === 'PAYMENT_CAPTURED' && (
                      <tr className="bg-zinc-900/20 border-b border-border">
                        <td colSpan="7" className="px-8 py-6">
                          <div className="w-full max-w-3xl">
                            <h4 className="text-sm font-semibold text-zinc-300 mb-6 flex items-center gap-2">
                              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                              Live Delivery Tracking
                            </h4>
                            <div className="relative flex justify-between items-center w-full">
                              {/* Background Line */}
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-zinc-800 rounded-full"></div>
                              
                              {/* Progress Line */}
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${(currentStepIndex / 4) * 100}%` }}></div>

                              {deliverySteps.map((step, index) => {
                                const isCompleted = index <= currentStepIndex;
                                const isCurrent = index === currentStepIndex;
                                return (
                                  <div key={step} className="relative z-10 flex flex-col items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors duration-300 ${
                                      isCompleted ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.5)]' : 'bg-zinc-800 text-zinc-500'
                                    }`}>
                                      {isCompleted ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg> : (index + 1)}
                                    </div>
                                    <div className={`text-[10px] uppercase font-bold tracking-wider ${isCurrent ? 'text-blue-400' : isCompleted ? 'text-zinc-300' : 'text-zinc-600'}`}>
                                      {step.replace('_', ' ')}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
