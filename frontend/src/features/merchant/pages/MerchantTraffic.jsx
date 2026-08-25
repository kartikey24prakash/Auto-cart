import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import TerminalLogTable from '../../audit-terminal/components/TerminalLogTable';

export default function MerchantTraffic() {
  return (
    <DashboardLayout role="merchant">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">AI Traffic Log</h1>
          <p className="text-muted-foreground mt-1">Real-time feed of all autonomous agents querying your catalog.</p>
        </div>

        <div className="mt-8 h-[600px]">
          <TerminalLogTable />
        </div>
      </div>
    </DashboardLayout>
  );
}
