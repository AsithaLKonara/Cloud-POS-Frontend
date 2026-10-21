import PageHeader from "@/components/dashboard/PageHeader";
import { PaymentGatewayBadge } from "@/components/dashboard/Badges";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PaymentActionButtons from "@/components/admin/PaymentActionButtons";

export default async function PaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  return (
    <div className="flex flex-col p-4 md:p-10 max-w-[1280px] mx-auto w-full gap-6">
      
      {/* Back Link */}
      <Link href="/admin/payments" className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors w-fit">
        <ArrowLeft size={16} />
        Back to Payments
      </Link>

      <PageHeader 
        title={`Payment ${id}`}
        action={
          <div className="flex gap-4 items-center">
            <PaymentActionButtons 
              transactionId={id} 
              status="paid" 
              totalAmount={8500}
              customerName="Kasun Perera"
            />
            <PaymentGatewayBadge gateway="Koko" status="paid" />
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Col: Details */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm flex flex-col gap-6">
          <h3 className="text-foreground font-bold text-lg font-inter">Transaction Details</h3>
          
          <div className="grid grid-cols-2 gap-y-4">
            <div className="flex flex-col gap-1">
              <span className="font-inter text-xs text-muted">Amount</span>
              <span className="font-inter text-sm text-foreground font-bold">Rs. 8,500</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-inter text-xs text-muted">Gateway</span>
              <span className="font-inter text-sm text-foreground">Koko</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-inter text-xs text-muted">Payment Method</span>
              <span className="font-inter text-sm text-foreground">Installment</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-inter text-xs text-muted">Gateway Reference</span>
              <span className="font-inter text-sm text-foreground font-mono">KOKO-82931</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-inter text-xs text-muted">Order</span>
              <Link href="/admin/orders/LC-10241" className="font-inter text-sm text-blue-500 hover:underline">LC-10241</Link>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-inter text-xs text-muted">Customer</span>
              <span className="font-inter text-sm text-foreground">Kasun Perera</span>
            </div>
          </div>
        </div>

        {/* Right Col: Timeline */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm flex flex-col gap-6">
          <h3 className="text-foreground font-bold text-lg font-inter">Webhook Timeline</h3>
          
          <div className="flex flex-col gap-5">
            {[
              { time: "12:41:22 PM", desc: "Payment initiated", status: "info" },
              { time: "12:41:34 PM", desc: "Redirected to Koko", status: "info" },
              { time: "12:42:01 PM", desc: "Payment authorized", status: "info" },
              { time: "12:42:02 PM", desc: "Webhook received (payment.success)", status: "success" },
              { time: "12:42:03 PM", desc: "Payment verified in DB", status: "success" },
              { time: "12:42:03 PM", desc: "Order LC-10241 confirmed", status: "success" },
            ].map((step, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-2.5 h-2.5 rounded-full ${step.status === 'success' ? 'bg-emerald-500' : 'bg-blue-500'} shrink-0 mt-1.5`}></div>
                  {idx !== 5 && <div className="w-px h-8 bg-border mt-1"></div>}
                </div>
                <div className="flex flex-col">
                  <span className="font-inter text-sm text-foreground font-medium">{step.desc}</span>
                  <span className="font-inter text-xs text-muted">{step.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
