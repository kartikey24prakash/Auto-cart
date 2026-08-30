import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Package, Clock, Truck, CheckCircle2, ChevronRight, MapPin, CreditCard, Bot } from 'lucide-react';
import apiClient from '@/shared/services/apiClient';

const statusConfig = {
  PENDING: { label: 'New (Paid)', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: CreditCard },
  PREPARING: { label: 'Preparing', color: 'text-yellow-400', bg: 'bg-yellow-500/10', icon: Package },
  DISPATCHED: { label: 'Dispatched', color: 'text-orange-400', bg: 'bg-orange-500/10', icon: Truck },
  IN_TRANSIT: { label: 'In Transit', color: 'text-purple-400', bg: 'bg-purple-500/10', icon: Truck },
  DELIVERED: { label: 'Delivered', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle2 }
};

export default function MerchantOrders() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await apiClient.get('/api/dashboard/logs');
      // Only show successfully paid orders for fulfillment
      const paidOrders = res.data.logs.filter(log => log.status === 'PAYMENT_CAPTURED');
      setOrders(paidOrders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateDeliveryStatus = async (auditId, newStatus) => {
    try {
      await apiClient.put(`/api/dashboard/orders/${auditId}/delivery`, { deliveryStatus: newStatus });
      fetchOrders();
      if (selectedOrder && selectedOrder.auditId === auditId) {
        setSelectedOrder(prev => ({ ...prev, deliveryStatus: newStatus }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DashboardLayout role="merchant">
      <div className="max-w-6xl mx-auto flex h-[calc(100vh-8rem)] gap-6">
        
        {/* Left List View */}
        <div className="w-1/2 flex flex-col bg-zinc-900/40 backdrop-blur-sm border border-zinc-800/50 rounded-xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-zinc-800/50">
            <h1 className="text-xl font-bold text-zinc-50 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-400" /> Fulfillment
            </h1>
            <p className="text-zinc-400 text-sm mt-1">Manage AI-driven orders.</p>
          </div>
          
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/50">
            {loading ? (
              <div className="p-8 text-center text-zinc-500">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">No paid orders to fulfill yet.</div>
            ) : (
              orders.map(order => {
                const currentStatus = order.deliveryStatus || 'PENDING';
                const config = statusConfig[currentStatus];
                const StatusIcon = config.icon;
                
                return (
                  <div 
                    key={order.auditId} 
                    onClick={() => setSelectedOrder(order)}
                    className={`p-4 cursor-pointer transition-colors flex items-center justify-between ${selectedOrder?.auditId === order.auditId ? 'bg-zinc-800/50' : 'hover:bg-zinc-800/30'}`}
                  >
                    <div>
                      <div className="font-semibold text-zinc-100">{order.productName || order.sku}</div>
                      <div className="text-xs text-zinc-400 mt-1 flex items-center gap-2">
                        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="font-mono">{order.auditId.slice(-6).toUpperCase()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <div className="font-bold text-zinc-50">₹{order.amount?.toLocaleString()}</div>
                        <div className={`text-[10px] font-bold mt-1 px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${config.bg} ${config.color}`}>
                          <StatusIcon className="w-3 h-3" /> {config.label}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-600" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Detail Card */}
        <div className="w-1/2">
          {selectedOrder ? (
            <div className="bg-[#09090b] border border-white/10 rounded-xl p-8 shadow-2xl h-full flex flex-col relative overflow-hidden group animate-in slide-in-from-right-4 duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.02] to-transparent opacity-100 pointer-events-none"></div>
              
              <div className="relative z-10 flex-1">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">{selectedOrder.productName || selectedOrder.sku}</h2>
                    <p className="text-sm text-zinc-400 mt-1 font-mono">Order #{selectedOrder.auditId.slice(-8).toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white tracking-tighter">₹{selectedOrder.amount?.toLocaleString()}</div>
                    <div className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded mt-1 uppercase tracking-wider">Paid</div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-4 bg-zinc-900/50 rounded-lg border border-white/5 flex gap-4">
                    <Bot className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-200">AI Buyer Info</h4>
                      <p className="text-sm text-zinc-400 mt-1">Authorized via Trust Engine Signature: <span className="font-mono text-zinc-500">{selectedOrder.sdkSignature.slice(0, 16)}...</span></p>
                    </div>
                  </div>

                  <div className="p-4 bg-zinc-900/50 rounded-lg border border-white/5 flex gap-4">
                    <MapPin className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-200">Delivery Address</h4>
                      {selectedOrder.shippingAddress ? (
                        <div className="text-sm text-zinc-400 mt-1 leading-relaxed">
                          <p>{selectedOrder.shippingAddress.addressLine1}</p>
                          <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.postalCode}</p>
                          <p>{selectedOrder.shippingAddress.country}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-zinc-500 mt-1 italic">No address provided.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Single-Intent Fulfillment Flow */}
              <div className="relative z-10 mt-8 pt-8 border-t border-white/5">
                <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-6">Fulfillment Progress</h4>
                
                {(() => {
                  const steps = [
                    { id: 'PENDING', label: 'Order Received' },
                    { id: 'PREPARING', label: 'Preparing', action: 'Start Preparing' },
                    { id: 'DISPATCHED', label: 'Dispatched', action: 'Dispatch Order' },
                    { id: 'IN_TRANSIT', label: 'In Transit', action: 'Mark In-Transit' },
                    { id: 'DELIVERED', label: 'Delivered', action: 'Mark Delivered' }
                  ];
                  
                  const currentStatus = selectedOrder.deliveryStatus || 'PENDING';
                  const currentIndex = steps.findIndex(s => s.id === currentStatus);
                  const nextStep = steps[currentIndex + 1];

                  return (
                    <div>
                      <div className="flex justify-between items-center relative mb-8">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-zinc-800 rounded-full"></div>
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${(currentIndex / 4) * 100}%` }}></div>
                        
                        {steps.map((step, idx) => {
                          const isPassed = idx <= currentIndex;
                          const isCurrent = idx === currentIndex;
                          return (
                            <button 
                              key={step.id} 
                              onClick={() => updateDeliveryStatus(selectedOrder.auditId, step.id)}
                              className="relative z-10 flex flex-col items-center gap-2 group cursor-pointer hover:scale-110 transition-transform"
                            >
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
                                isPassed 
                                  ? 'bg-emerald-500 text-zinc-950 shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
                                  : 'bg-zinc-800 text-zinc-500 group-hover:bg-zinc-700'
                              } ${isCurrent ? 'ring-4 ring-emerald-500/20' : ''}`}>
                                {isPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : (idx + 1)}
                              </div>
                              <span className={`text-[9px] uppercase font-bold tracking-widest absolute -bottom-6 w-24 text-center transition-colors ${
                                isCurrent ? 'text-emerald-400' : isPassed ? 'text-zinc-400 group-hover:text-emerald-400/50' : 'text-zinc-600 group-hover:text-zinc-400'
                              }`}>
                                {step.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {nextStep ? (
                        <div className="mt-12 flex justify-end">
                          <button 
                            onClick={() => updateDeliveryStatus(selectedOrder.auditId, nextStep.id)}
                            className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-6 py-3 rounded-full text-sm font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] flex items-center gap-2 active:scale-95"
                          >
                            {nextStep.action} <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="mt-12 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                          <p className="text-sm font-semibold text-emerald-400">Order Successfully Delivered</p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

            </div>
          ) : (
            <div className="h-full border border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center text-zinc-500 bg-zinc-900/20">
              <Package className="w-12 h-12 mb-4 text-zinc-700" />
              <p>Select an order to manage fulfillment.</p>
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}

