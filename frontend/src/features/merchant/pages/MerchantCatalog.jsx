import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Package, Tag, Archive, Search, MoreHorizontal } from 'lucide-react';
import apiClient from '@/shared/services/apiClient';

export default function MerchantCatalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await apiClient.get('/api/dashboard/catalog');
        setProducts(res.data.products);
      } catch (err) {
        console.error('Failed to load catalog', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  return (
    <DashboardLayout role="merchant">
      <div className="max-w-6xl mx-auto animate-in fade-in duration-700">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Inventory Catalog</h1>
            <p className="text-zinc-400 text-sm mt-2">Manage your active products syncing to the AutoCart autonomous network.</p>
          </div>
          <button className="bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-zinc-200 transition-colors shadow-lg shadow-white/5">
            + Sync New Product
          </button>
        </div>

        <div className="bg-[#09090b] border border-white/5 rounded-xl shadow-2xl overflow-hidden">
          <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input type="text" placeholder="Search products..." className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 transition-colors" />
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 border border-white/10 rounded-lg hover:bg-white/5 text-zinc-400 transition-colors">
                <Tag className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-500 uppercase bg-black/20 border-b border-white/5">
                <tr>
                  <th className="px-6 py-4 font-semibold tracking-wider">Product Name</th>
                  <th className="px-6 py-4 font-semibold tracking-wider">SKU</th>
                  <th className="px-6 py-4 font-semibold tracking-wider">Price (INR)</th>
                  <th className="px-6 py-4 font-semibold tracking-wider">Stock Status</th>
                  <th className="px-6 py-4 font-semibold tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-zinc-500">
                      Loading catalog...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-zinc-500">
                      <Package className="w-8 h-8 mx-auto mb-3 opacity-20" />
                      No products found. Start by syncing your inventory.
                    </td>
                  </tr>
                ) : (
                  products.map(p => (
                    <tr key={p._id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">{p.name}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-zinc-400 text-xs">{p.sku}</td>
                      <td className="px-6 py-4 font-medium text-white">₹{p.price.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${p.stock > 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                          <span className={p.stock > 0 ? 'text-emerald-400' : 'text-red-400'}>
                            {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/10 rounded-md transition-colors opacity-0 group-hover:opacity-100">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
