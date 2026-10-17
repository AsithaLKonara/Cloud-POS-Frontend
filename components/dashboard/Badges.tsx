import { CheckCircle2, Clock, XCircle, Undo2, MapPin } from "lucide-react";

interface BadgeProps {
  label?: string;
  status?: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'purple';
  icon?: React.ReactNode;
  dot?: boolean;
}

export function StatusBadge({ label, status, variant, icon, dot = true }: BadgeProps) {
  const displayLabel = label || status || '';
  
  // Infer variant if not provided
  const resolvedVariant = variant || (() => {
    const s = (status || label || '').toLowerCase();
    if (['paid', 'completed', 'delivered', 'active', 'operational', 'success', 'refunded'].includes(s)) return 'success';
    if (['pending', 'processing', 'in_transit', 'transit', 'awaiting item', 'inspecting', 'requested'].includes(s)) return 'warning';
    if (['failed', 'cancelled', 'rejected', 'error', 'inactive', 'maintenance'].includes(s)) return 'error';
    if (['info', 'dispatched'].includes(s)) return 'info';
    return 'neutral';
  })();

  const getTextColor = () => {
    switch (resolvedVariant) {
      case 'success': return 'text-emerald-600 dark:text-emerald-400';
      case 'warning': return 'text-amber-600 dark:text-amber-400';
      case 'error': return 'text-red-600 dark:text-red-400';
      case 'info': return 'text-blue-600 dark:text-blue-400';
      case 'purple': return 'text-purple-600 dark:text-purple-400';
      default: return 'text-muted';
    }
  };

  const getDotColor = () => {
    switch (resolvedVariant) {
      case 'success': return 'bg-emerald-500';
      case 'warning': return 'bg-amber-500';
      case 'error': return 'bg-red-500';
      case 'info': return 'bg-blue-500';
      case 'purple': return 'bg-purple-500';
      default: return 'bg-muted';
    }
  };

  return (
    <div className={`inline-flex items-center gap-1.5 text-xs font-semibold font-inter ${getTextColor()}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getDotColor()}`} />}
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="capitalize">{displayLabel}</span>
    </div>
  );
}

// Pre-configured semantic badges based on business context rules

export function PaymentGatewayBadge({ gateway, status = 'paid' }: { gateway: string, status?: 'paid' | 'pending' | 'failed' | 'refunded' }) {
  let icon;
  let variant: 'success' | 'warning' | 'error' | 'neutral' = 'neutral';
  
  switch(status) {
    case 'paid': 
      icon = <CheckCircle2 size={12} className="text-success" />;
      variant = 'success';
      break;
    case 'pending': 
      icon = <Clock size={12} className="text-warning" />;
      variant = 'warning';
      break;
    case 'failed': 
      icon = <XCircle size={12} className="text-error" />;
      variant = 'error';
      break;
    case 'refunded': 
      icon = <Undo2 size={12} className="text-muted" />;
      break;
  }

  return (
    <div className="flex flex-col">
      <StatusBadge label={gateway} variant={variant} icon={icon} />
    </div>
  );
}

export function BranchBadge({ branch }: { branch: string }) {
  return (
    <StatusBadge 
      label={branch} 
      variant="neutral" 
      icon={<MapPin size={11} className="text-muted" />} 
    />
  );
}

export function OrderStatusBadge({ status }: { status: string }) {
  let variant: 'success' | 'warning' | 'info' | 'neutral' | 'error' = 'neutral';
  const norm = status?.toUpperCase() || '';
  
  if (['DELIVERED', 'COMPLETED', 'PAID', 'SUCCESS'].includes(norm)) variant = 'success';
  else if (['PROCESSING', 'PACKED', 'SHIPPED', 'IN TRANSIT', 'DISPATCHED'].includes(norm)) variant = 'info';
  else if (['PENDING', 'AWAITING_PAYMENT', 'AWAITING PAYMENT'].includes(norm)) variant = 'warning';
  else if (['CANCELLED', 'FAILED', 'RETURNED'].includes(norm)) variant = 'error';
  
  return <StatusBadge label={status} variant={variant} dot />;
}
