import { useEffect, useState } from 'react';
import { catalogApi } from '../services/catalogApi';
import { formatCurrency } from '../../../shared/utils/format';

export default function ProductGrid() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const catalog = await catalogApi.getCatalog();
        setProducts(catalog);
      } catch (err) {
        console.error('Failed to fetch catalog', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400 font-medium h-64">
        <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-teal-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading Catalog Database...
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full pb-8">
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 content-start overflow-auto pr-2">
        {products.map(product => {
          const isSelected = selectedProduct?.sku === product.sku;
          const inStock = product.stock > 0;
          return (
            <div 
              key={product.sku}
              onClick={() => setSelectedProduct(product)}
              className={`glass-card p-5 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 ${
                isSelected 
                  ? 'border-teal-500 shadow-lg shadow-teal-500/20 bg-teal-500/10' 
                  : 'hover:border-slate-500 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`font-bold text-lg leading-tight pr-4 ${isSelected ? 'text-teal-400' : 'text-white'}`}>
                  {product.title}
                </div>
                <div className={`font-mono font-bold whitespace-nowrap bg-slate-900 px-2 py-1 rounded-md text-sm ${isSelected ? 'text-teal-300' : 'text-slate-300'}`}>
                  {formatCurrency(product.price)}
                </div>
              </div>
              <p className="text-sm text-slate-400 mb-4 line-clamp-2 min-h-[40px]">
                {product.description}
              </p>
              <div className="flex justify-between items-center text-xs mt-auto pt-4 border-t border-slate-700/50">
                <span className={`px-2 py-1 rounded-full font-bold uppercase ${
                  inStock ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  Stock: {product.stock}
                </span>
                <span className="font-mono text-slate-500 bg-slate-900/50 px-2 py-1 rounded-md">
                  {product.sku}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="w-full lg:w-96 flex flex-col shrink-0 lg:sticky lg:top-0 h-[400px] lg:h-auto">
        <div className="flex items-center gap-2 mb-3 px-1">
          <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
          <h3 className="text-sm font-bold uppercase text-slate-300 tracking-wider">
            AI Payload Preview (JSON)
          </h3>
        </div>
        <div className="flex-1 glass-card bg-slate-900 p-1 overflow-hidden flex flex-col shadow-inner">
          <div className="bg-slate-950 flex-1 overflow-auto rounded-lg border border-slate-800 p-4 relative">
            {selectedProduct ? (
              <pre className="text-[13px] text-teal-400 font-mono leading-relaxed">
                {JSON.stringify(selectedProduct, null, 2)}
              </pre>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-500">
                <svg className="w-12 h-12 mb-3 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <div className="text-sm font-medium">Select a product to view the token-lean JSON payload exposed to the AI Agent.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
