import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ApprovalCardList from '../components/ApprovalCardList';
import { AlertCircle } from 'lucide-react';

export default function ApprovalQueuePage() {
  return (
    <DashboardLayout role="buyer">
      <div className="max-w-5xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-orange-500 relative z-10" />
              <div className="absolute inset-0 bg-orange-500/20 rounded-full animate-ping z-0" />
            </div>
            Manual Intervention Required
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Review and approve gated transactions that exceeded agent policies.
          </p>
        </div>
        
        <div className="relative">
          <ApprovalCardList />
        </div>
      </div>
    </DashboardLayout>
  );
}
