'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, Loader2 } from 'lucide-react';
import { orderService } from '@/services/order.service';
import ShippingLabelTemplate from './ShippingLabelTemplate';
import { useSettings } from '@/hooks/useSettings';

interface ShippingLabelModalProps {
  orderIds: string[];
  isOpen: boolean;
  onClose: () => void;
}

export default function ShippingLabelModal({ orderIds, isOpen, onClose }: ShippingLabelModalProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { data: settingsData } = useSettings();
  const settings = settingsData || [];
  
  const storeName = settings.find(s => s.key === 'store_name')?.value || 'SERAMAADUWEN.LK Ltd.';
  const storeAddress = settings.find(s => s.key === 'store_address')?.value || '123 Fashion Avenue\nColombo 07';
  const storePhone = settings.find(s => s.key === 'support_phone')?.value || '+94 11 234 5678';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && orderIds.length > 0) {
      setLoading(true);
      setError(false);
      
      const fetchPromises = orderIds.map(id => 
        orderService.getOrderById(id).catch(() => null)
      );

      Promise.all(fetchPromises).then(responses => {
        const validOrders = responses
          .filter(res => res && res.data)
          .map(res => res!.data);
        
        setOrders(validOrders);
        setLoading(false);
      }).catch(() => {
        setError(true);
        setLoading(false);
      });
    }
  }, [isOpen, orderIds]);

  if (!isOpen) return null;

  const printContent = (
    <div className="hidden print:block print-portal bg-white w-full">
      {orders.map((order) => (
        <ShippingLabelTemplate 
          key={`print-${order.id}`} 
          order={order} 
          storeName={order.branch?.name || storeName} 
          storeAddress={order.branch?.address || storeAddress} 
          storePhone={order.branch?.phone || storePhone} 
        />
      ))}
    </div>
  );

  return (
    <>
      {/* Visual Modal (Hidden when printing) */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 print:hidden">
        <div 
          className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" 
          onClick={onClose}
        />
        
        <div className="relative w-full max-w-2xl max-h-[90vh] bg-background border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-surface px-6 py-4 border-b border-border flex items-center justify-between z-10 text-foreground">
            <div>
              <h2 className="font-bold text-lg text-foreground">Shipping Labels</h2>
              <p className="text-sm text-muted">
                {orders.length} label{orders.length !== 1 ? 's' : ''} ready for printing
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => window.print()}
                disabled={loading || orders.length === 0}
                className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Printer size={18} />
                Print Labels
              </button>
              <button 
                onClick={onClose}
                className="p-2 text-muted hover:text-foreground hover:bg-surface-elevated rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 bg-background">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted gap-3">
                <Loader2 className="animate-spin text-primary" size={24} />
                <p>Loading labels securely...</p>
              </div>
            ) : error || orders.length === 0 ? (
              <div className="bg-surface border border-border p-6 rounded-lg text-center shadow-sm">
                <p className="font-medium text-foreground mb-1">No Valid Labels Found</p>
                <p className="text-sm text-muted">The selected orders might not have tracking numbers assigned yet.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {orders.map((order, index) => (
                  <ShippingLabelTemplate 
                    key={order.id} 
                    order={order} 
                    index={index + 1} 
                    total={orders.length}
                    storeName={order.branch?.name || storeName}
                    storeAddress={order.branch?.address || storeAddress}
                    storePhone={order.branch?.phone || storePhone}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actual Print View mounted directly to body to bypass any overflow:hidden wrappers */}
      {mounted && createPortal(printContent, document.body)}
    </>
  );
}
