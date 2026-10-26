'use client';

import React from 'react';
import { X, Package, Truck, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface TrackingSidePanelProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function TrackingSidePanel({ order, isOpen, onClose }: TrackingSidePanelProps) {
  if (!order) return null;

  const statuses = ['PENDING', 'PROCESSING', 'DISPATCHED', 'DELIVERED'];
  let currentIndex = statuses.indexOf(order.status);
  
  if (order.status === 'DELIVERED') {
    currentIndex = 3;
  } else if (order.trackingNumber && currentIndex < 2) {
    currentIndex = 2; // if it has tracking but status is wrong, pretend dispatched
  }

  // Helper to determine step status
  const getStepStatus = (index: number) => {
    if (order.status === 'CANCELLED') return 'cancelled';
    if (index < currentIndex) return 'completed';
    if (index === currentIndex) return 'current';
    return 'upcoming';
  };

  const steps = [
    { label: 'Order Placed', icon: <Clock size={16} /> },
    { label: 'Processing', icon: <Package size={16} /> },
    { label: 'Dispatched', icon: <Truck size={16} /> },
    { label: 'Delivered', icon: <CheckCircle size={16} /> }
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity" 
          onClick={onClose} 
        />
      )}

      {/* Side Panel */}
      <div 
        className={`fixed inset-y-0 right-0 w-full max-w-md bg-surface border-l border-border shadow-2xl z-[101] transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-border bg-surface">
          <h2 className="text-xl font-bold font-poppins text-foreground">Tracking Details</h2>
          <button onClick={onClose} className="p-2 text-muted hover:text-foreground rounded-full hover:bg-surface-elevated transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-background">
          {/* Order Identity */}
          <div className="bg-surface p-4 rounded-xl border border-border">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-xs text-muted font-medium uppercase tracking-wider mb-1">Order Number</p>
                <p className="font-poppins font-semibold text-lg text-primary">{order.orderNumber}</p>
              </div>
              <div className="text-right">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border
                  ${order.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' : 
                    order.status === 'CANCELLED' ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20' :
                    order.status === 'DISPATCHED' || order.trackingNumber ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20' :
                    'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'}`}
                >
                  {order.status}
                </span>
              </div>
            </div>
            {order.trackingNumber && (
              <div className="mt-3 pt-3 border-t border-border flex justify-between items-center">
                <span className="text-sm text-muted">Tracking #</span>
                <span className="font-mono font-medium text-foreground">{order.trackingNumber}</span>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div>
            <h3 className="font-semibold text-foreground mb-6 font-poppins">Shipping Timeline</h3>
            <div className="relative pl-3">
              {/* Vertical line */}
              <div className="absolute left-7 top-4 bottom-4 w-[2px] bg-border"></div>

              <div className="space-y-6 relative">
                {steps.map((step, index) => {
                  const status = getStepStatus(index);
                  return (
                    <div key={step.label} className={`flex gap-4 ${status === 'upcoming' ? 'opacity-50' : ''}`}>
                      <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 
                        ${status === 'completed' ? 'bg-primary border-primary text-primary-foreground' : 
                          status === 'current' ? 'bg-surface border-primary text-primary' : 
                          'bg-surface border-border text-muted'}`}
                      >
                        {step.icon}
                      </div>
                      <div className="flex-1 pt-1">
                        <p className={`text-sm font-semibold ${status === 'completed' || status === 'current' ? 'text-foreground' : 'text-muted'}`}>
                          {step.label}
                        </p>
                        {status === 'current' && (
                          <p className="text-xs text-muted mt-1">Currently in this stage.</p>
                        )}
                        {status === 'completed' && (
                          <p className="text-xs text-muted mt-1">Completed successfully.</p>
                        )}
                      </div>
                    </div>
                  );
                })}
                {order.status === 'CANCELLED' && (
                   <div className="flex gap-4 mt-6">
                   <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 bg-rose-500 border-rose-500 text-white">
                     <X size={16} />
                   </div>
                   <div className="flex-1 pt-1">
                     <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">Order Cancelled</p>
                   </div>
                 </div>
                )}
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div>
             <h3 className="font-semibold text-foreground mb-4 font-poppins">Customer & Shipping Details</h3>
             <div className="bg-surface rounded-xl p-4 border border-border text-sm space-y-3">
               <div className="flex justify-between">
                 <span className="text-muted">Customer</span>
                 <span className="font-medium text-foreground text-right">
                   {order.customer 
                    ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}` 
                    : order.shippingAddress?.firstName 
                      ? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`
                      : 'Guest'}
                 </span>
               </div>
               <div className="flex justify-between">
                 <span className="text-muted">Phone</span>
                 <span className="font-medium text-foreground text-right">
                    {order.customer?.phone || order.shippingAddress?.phone || 'N/A'}
                 </span>
               </div>
               <div className="flex justify-between border-t border-border pt-3 mt-3">
                 <span className="text-muted">Address</span>
                 <span className="font-medium text-foreground text-right w-2/3 break-words">
                    {order.shippingAddress 
                      ? `${order.shippingAddress.addressLine1}, ${order.shippingAddress.city}`
                      : 'N/A'}
                 </span>
               </div>
             </div>
          </div>
        </div>

        <div className="p-6 border-t border-border bg-surface">
           {order.trackingUrl ? (
             <Button className="w-full" onClick={() => window.open(order.trackingUrl, '_blank')}>
               View Live Tracking on Courier
             </Button>
           ) : (
             <Button className="w-full" disabled variant="outline">
               Live Courier Tracking Unavailable
             </Button>
           )}
        </div>
      </div>
    </>
  );
}
