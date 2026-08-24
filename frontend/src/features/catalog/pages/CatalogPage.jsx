import ProductGrid from '../components/ProductGrid';

export default function CatalogPage() {
  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto w-full">
      <div className="mb-6 flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight">Merchant Catalog</h2>
        <p className="text-muted-foreground text-sm">
          Simulated inventory environment exposed to the AI agent.
        </p>
      </div>
      
      <div className="flex-1 min-h-0 relative">
        <ProductGrid />
      </div>
    </div>
  );
}
