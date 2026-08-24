import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MetricsBar from '../components/MetricsBar';
import TerminalLogTable from '../components/TerminalLogTable';

export default function AuditTerminalPage() {
  return (
    <DashboardLayout role="buyer">
      <div className="max-w-5xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Privacy Receipts</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Immutable ledger of all autonomous AI procurement activity and Razorpay order confirmations.
          </p>
        </div>
        <MetricsBar />
        <div className="mt-8">
          <TerminalLogTable />
        </div>
      </div>
    </DashboardLayout>
  );
}
