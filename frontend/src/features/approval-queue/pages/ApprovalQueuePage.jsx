import ApprovalCardList from '../components/ApprovalCardList';

export default function ApprovalQueuePage() {
  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto w-full">
      <div className="mb-6 flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
          <div className="relative">
            <svg className="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></div>
            <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full"></div>
          </div>
          Manual Intervention Required
        </h2>
        <p className="text-muted-foreground text-sm">
          Review and approve gated transactions that exceeded agent policies.
        </p>
      </div>
      
      <div className="flex-1 min-h-0 relative">
        <ApprovalCardList />
      </div>
    </div>
  );
}
