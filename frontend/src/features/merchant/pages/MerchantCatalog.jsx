import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Package, Tag, Archive } from 'lucide-react';
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
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Inventory Catalog</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your active products syncing to the Auto-Cart network.</p>
        </div>

        {loading ? (
          <div className="text-muted-foreground">Loading catalog...</div>
        ) : products.length === 0 ? (
          <div className="bg-card border border-border p-8 rounded-xl text-center shadow-sm">
            <Package className="w-12 h-12 text-muted-foreground opacity-50 mx-auto mb-4" />
            <h3 className="font-medium text-foreground mb-1">Your catalog is empty</h3>
            <p className="text-sm text-muted-foreground">Head over to the AI Agent to upload your first product.</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-medium">Product Name</th>
                  <th className="px-6 py-4 font-medium">SKU</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium text-right">Price</th>
                  <th className="px-6 py-4 font-medium text-right">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map(product => (
                  <tr key={product._id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                        <Tag className="w-5 h-5" />
                      </div>
                      {product.name}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{product.sku}</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-xs font-medium">
                        {product.category || 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-foreground font-medium">
                      ₹{product.price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 text-foreground font-medium">
                        <Archive className="w-4 h-4 text-muted-foreground" />
                        {product.stock}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
