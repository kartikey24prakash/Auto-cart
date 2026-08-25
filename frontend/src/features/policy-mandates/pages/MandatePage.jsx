import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MandateOverviewCard from '../components/MandateOverviewCard';
import ShippingProfileCard from '../components/ShippingProfileCard';

export default function MandatePage() {
  return (
    <DashboardLayout role="buyer">
      <div className="max-w-5xl mx-auto w-full pb-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Policy Mandates</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Cryptographically enforced rules that govern autonomous agent spending limits and conditions.
          </p>
        </div>
        
        <div className="relative">
          <MandateOverviewCard />
          <ShippingProfileCard />
        </div>
      </div>
    </DashboardLayout>
  );
}
