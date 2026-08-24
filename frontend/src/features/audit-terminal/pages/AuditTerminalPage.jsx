import MetricsBar from '../components/MetricsBar';
import TerminalLogTable from '../components/TerminalLogTable';

export default function AuditTerminalPage() {
  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto w-full">
      <div className="mb-6 flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground text-sm">
          Overview of AI agent procurement metrics and recent activity.
        </p>
      </div>
      <MetricsBar />
      <div className="flex-1 min-h-0 mt-6">
        <TerminalLogTable />
      </div>
    </div>
  );
}
