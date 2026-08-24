import MandateOverviewCard from '../components/MandateOverviewCard';

export default function MandatePage() {
  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto w-full">
      <div className="mb-6 flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight">Policy Mandates</h2>
        <p className="text-muted-foreground text-sm">
          Cryptographically enforced rules that govern autonomous agent spending limits and conditions.
        </p>
      </div>
      
      <div className="flex-1 min-h-0 overflow-y-auto">
        <MandateOverviewCard />
      </div>
    </div>
  );
}
