import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Activity } from 'lucide-react';

export default function MerchantTraffic() {
  return (
    <DashboardLayout role="merchant">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">AI Traffic Log</h1>
          <p className="text-muted-foreground mt-1">Real-time feed of all autonomous agents querying your catalog.</p>
        </div>

        <Card className="flex flex-col items-center justify-center p-12 bg-card border-border/50 shadow-sm h-[500px]">
          <div className="p-4 rounded-full bg-blue-500/10 mb-4">
            <Activity className="w-8 h-8 text-blue-500" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Awaiting Traffic</h2>
          <p className="text-muted-foreground text-center max-w-sm">
            Once you integrate the AutoCart SDK, you will see a real-time stream of AI agents navigating your store here.
          </p>
        </Card>
      </div>
    </DashboardLayout>
  );
}
