export default function Badge({ text, status }) {
  let colorClass = 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  
  if (status === 'AUTO_APPROVED' || status === 'ORDER_CREATED' || status === 'PAYMENT_CAPTURED') {
    colorClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]';
  }
  if (status === 'GATED_1_CLICK') {
    colorClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]';
  }
  if (status === 'GATED_2FA') {
    colorClass = 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]';
  }
  if (status === 'BLOCKED' || status === 'DENIED' || status === 'FAILED') {
    colorClass = 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]';
  }
  if (status === 'GATEWAY_DEGRADED') {
    colorClass = 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)] animate-pulse';
  }

  return (
    <span className={`inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-semibold border rounded-full ${colorClass} transition-colors`}>
      {text || status}
    </span>
  );
}
