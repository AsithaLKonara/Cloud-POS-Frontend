"use client";

import React, { useEffect } from 'react';
import { X, User, CreditCard, Truck, RefreshCw } from 'lucide-react';
import { OrderStatusBadge, PaymentGatewayBadge } from "@/components/dashboard/Badges";
import OrderDispatchButtons from "@/components/admin/OrderDispatchButtons";
import { useOrderById, useUpdateOrderStatus, useRefundOrder } from "@/hooks/useOrders";
import Image from "next/image";
import Link from "next/link";

interface OrderSidePanelProps {
  orderId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function OrderSidePanel({ orderId, isOpen, onClose }: OrderSidePanelProps) {
  const { data: order, isLoading } = useOrderById(orderId || '');
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateOrderStatus();
  const { mutate: refundOrder, isPending: isRefunding } = useRefundOrder();

  // Prevent background scrolling when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const nextStatusMap: Record<string, string> = {
    'PENDING': 'PROCESSING',
    'PROCESSING': 'DISPATCHED',
    'DISPATCHED': 'DELIVERED',
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex-1 flex items-center justify-center text-muted font-inter">
          <RefreshCw className="animate-spin text-muted" size={24} />
        </div>
      );
    }

    if (!order) {
      return (
        <div className="flex-1 p-6 text-muted font-inter">
          Order not found.
        </div>
      );
    }

    const customerName = order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : "Guest";
    const customerPhone = order.customer?.phone || "-";
    const address = order.shippingAddress 
      ? `${order.shippingAddress.addressLine1}, ${order.shippingAddress.city}` 
      : "-";
    
    const nextStatus = nextStatusMap[order.status];

    return (
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-background">
        
        {/* Header Actions */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-2 flex-wrap">
            <OrderStatusBadge status={order.paymentStatus || "pending"} />
            <OrderStatusBadge status={order.status} />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <OrderDispatchButtons 
              orderId={order.id}
              customerName={customerName}
              address={address}
              phone={customerPhone}
            />
            
            {nextStatus && (
              <button 
                onClick={() => updateStatus({ id: order.id, status: nextStatus })}
                disabled={isUpdating}
                className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-elevated text-foreground text-sm font-semibold font-inter rounded-lg transition-colors border border-border disabled:opacity-50"
              >
                {isUpdating ? <RefreshCw size={14} className="animate-spin" /> : null}
                Mark as {nextStatus.charAt(0) + nextStatus.slice(1).toLowerCase()}
              </button>
            )}
            
            {order.status !== 'CANCELLED' && order.paymentStatus !== 'REFUNDED' && (
              <button 
                onClick={() => {
                  if (confirm("Are you sure you want to refund and cancel this order? This action cannot be undone and will restore stock.")) {
                    refundOrder(order.id);
                  }
                }}
                disabled={isRefunding}
                className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-sm font-semibold font-inter rounded-lg transition-colors border border-rose-500/20 disabled:opacity-50"
              >
                {isRefunding ? <RefreshCw size={14} className="animate-spin" /> : null}
                Refund Order
              </button>
            )}
          </div>
        </div>

        {/* Customer */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2 text-foreground font-semibold text-sm font-inter">
            <User size={16} className="text-muted" />
            Customer
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-inter text-sm text-foreground">{customerName}</span>
            <span className="font-inter text-sm text-muted">{customerPhone}</span>
            {order.customer?.email && <span className="font-inter text-sm text-muted">{order.customer.email}</span>}
            <Link href="#" className="font-inter text-xs text-primary hover:underline mt-1 w-fit">View Profile</Link>
          </div>
        </div>

        {/* Payment */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2 text-foreground font-semibold text-sm font-inter">
            <CreditCard size={16} className="text-muted" />
            Payment
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="font-inter text-sm text-muted">Gateway</span>
              <PaymentGatewayBadge gateway={order.paymentMethod || 'COD'} status={order.paymentStatus?.toLowerCase() || 'pending'} />
            </div>
            <div className="flex justify-between items-center">
              <span className="font-inter text-sm text-muted">Subtotal</span>
              <span className="font-inter text-sm text-foreground">Rs. {order.subtotal?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-inter text-sm text-muted">Shipping</span>
              <span className="font-inter text-sm text-foreground">Rs. {order.shippingFee?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center mt-2 border-t border-border pt-2">
              <span className="font-inter text-sm text-foreground font-semibold">Total</span>
              <span className="font-inter text-sm text-foreground font-bold">Rs. {order.total?.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Shipping */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2 text-foreground font-semibold text-sm font-inter">
            <Truck size={16} className="text-muted" />
            Shipping
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-inter text-sm text-foreground">Address</span>
            <p className="font-inter text-sm text-muted whitespace-pre-wrap">{address}</p>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm flex flex-col gap-4">
          <h3 className="text-foreground font-semibold text-sm font-inter">Order Items ({order.items?.length || 0})</h3>
          
          <div className="flex flex-col gap-4 mt-2">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex gap-4 items-center border-b border-border pb-4 last:border-0 last:pb-0">
                <div className="w-14 h-14 bg-surface-elevated border border-border rounded-md overflow-hidden relative shrink-0">
                  <Image 
                    src={
                      item.variant?.featuredImage || 
                      item.variant?.gallery?.[0] || 
                      item.variant?.product?.variants?.find((v: any) => v.featuredImage)?.featuredImage ||
                      "/products/default.jpg"
                    } 
                    alt="Product"
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-inter font-medium text-sm text-foreground truncate">
                    {item.variant?.product?.name || 'Unknown Product'}
                  </span>
                  <span className="font-inter text-xs text-muted">
                    {item.variant?.size} | {item.variant?.color}
                  </span>
                </div>
                <div className="flex flex-col items-end shrink-0 pl-2">
                  <span className="font-inter font-medium text-sm text-foreground">
                    Rs. {item.priceAtPurchase?.toLocaleString()}
                  </span>
                  <span className="font-inter text-xs text-muted">Qty: {item.quantity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    );
  };

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
        className={`fixed inset-y-0 right-0 w-full max-w-lg bg-surface border-l border-border shadow-2xl z-[101] transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-border bg-surface">
          <div>
            <h2 className="text-xl font-bold font-poppins text-foreground">
              {order ? `Order #${order.orderNumber || order.id.substring(0, 8)}` : 'Order Details'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 text-muted hover:text-foreground rounded-full hover:bg-surface-elevated transition-colors">
            <X size={20} />
          </button>
        </div>

        {renderContent()}
      </div>
    </>
  );
}
