"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, CheckCircle2, AlertCircle, Package, Truck, Info, Camera, RefreshCw } from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import Image from "next/image";

import { useReturnDetails, useUpdateReturnStatus } from "@/hooks/useReturns";
import { useRouter } from "next/navigation";
import { globalDialog } from "@/store/dialog.store";

export default function AdminReturnDetailsPage({ params }: { params: Promise<{ rma: string }> }) {
  const resolvedParams = use(params);
  const rmaId = resolvedParams.rma;
  const router = useRouter();
  
  const { data: rma, isLoading } = useReturnDetails(rmaId);
  const updateStatusMutation = useUpdateReturnStatus();
  
  // Base step logic on RMA status
  const currentStatus = rma?.status || "REQUESTED";
  let initialStep: "MODERATION" | "INSPECTION" | "RESOLUTION" = "MODERATION";
  if (["IN_TRANSIT", "RECEIVED"].includes(currentStatus)) initialStep = "INSPECTION";
  if (currentStatus === "APPROVED") initialStep = "INSPECTION"; // Awaiting Item
  
  const [step, setStep] = useState<"MODERATION" | "INSPECTION" | "RESOLUTION">(initialStep);

  // Sync step if data loads later
  useEffect(() => {
    if (rma && step === "MODERATION" && ["IN_TRANSIT", "RECEIVED"].includes(rma.status)) {
      setStep("INSPECTION");
    }
  }, [rma, step]);

  const [itemConditions, setItemConditions] = useState<Record<string, string>>({});
  const [resolutionMethod, setResolutionMethod] = useState<"REFUND" | "STORE_CREDIT" | "EXCHANGE">("REFUND");

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      const itemsPayload = Object.keys(itemConditions).map(itemId => ({
        id: itemId,
        condition: "Inspected",
        inspectionStatus: itemConditions[itemId]
      }));

      await updateStatusMutation.mutateAsync({
        id: rma.id,
        status: newStatus,
        items: itemsPayload.length > 0 ? itemsPayload : undefined
      });
      
      if (newStatus === 'APPROVED' || newStatus === 'IN_TRANSIT' || newStatus === 'RECEIVED') {
        setStep("INSPECTION");
      } else if (newStatus === 'REFUNDED') {
        router.push("/admin/returns");
      }
    } catch (e) {
      console.error(e);
      globalDialog.alert("Failed to update status");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="font-inter text-stone-500">Loading RMA details...</div>
      </div>
    );
  }

  if (!rma) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="font-inter text-stone-500">Return request not found.</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex items-center gap-4">
        <Link href="/admin/returns" className="w-10 h-10 bg-surface border border-border rounded-lg flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-elevated transition-colors shadow-sm">
          <ChevronLeft size={20} />
        </Link>
        <PageHeader 
          title={`Return ${rma.rmaId}`}
          subtitle="Review the customer's request, inspect items, and issue a resolution."
          actionLabel="View Original Order"

        />
      </div>

      {/* Progress Tracker */}
      <div className="bg-surface border border-border rounded-xl shadow-sm p-6 mb-2">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-surface-elevated z-0 rounded-full"></div>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary z-0 rounded-full transition-all duration-500" style={{ width: step === "MODERATION" ? "0%" : step === "INSPECTION" ? "50%" : "100%" }}></div>
          
          <div className={`relative z-10 flex flex-col items-center gap-2 ${step === "MODERATION" ? "" : "opacity-50"}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold font-inter text-sm ${step === "MODERATION" ? "bg-primary text-white" : "bg-surface-elevated text-muted"}`}>1</div>
            <span className="font-inter font-medium text-sm text-foreground">Moderation</span>
          </div>
          
          <div className={`relative z-10 flex flex-col items-center gap-2 ${step === "INSPECTION" ? "" : step === "RESOLUTION" ? "opacity-50" : "opacity-30"}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold font-inter text-sm ${step === "INSPECTION" || step === "RESOLUTION" ? "bg-primary text-white" : "bg-surface border-2 border-border text-muted"}`}>2</div>
            <span className="font-inter font-medium text-sm text-foreground">Warehouse Inspection</span>
          </div>

          <div className={`relative z-10 flex flex-col items-center gap-2 ${step === "RESOLUTION" ? "" : "opacity-30"}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold font-inter text-sm ${step === "RESOLUTION" ? "bg-primary text-white" : "bg-surface border-2 border-border text-muted"}`}>3</div>
            <span className="font-inter font-medium text-sm text-foreground">Financial Resolution</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Flow Context */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* STEP 1: MODERATION */}
          {step === "MODERATION" && (
            <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex flex-col animate-in fade-in">
              <div className="px-6 py-4 border-b border-border flex items-center gap-2 bg-surface-elevated">
                <AlertCircle size={18} className="text-amber-500" />
                <h3 className="font-inter font-semibold text-foreground">Customer Request Review</h3>
              </div>
              <div className="p-6 flex flex-col gap-6">
                
                <div className="flex flex-col gap-1">
                  <h4 className="font-inter font-medium text-sm text-foreground">Reason for Return</h4>
                  <div className="p-4 bg-background border border-border rounded-lg font-inter text-sm text-foreground italic">
                    "{rma.reason || 'No reason provided.'}"
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <h4 className="font-inter font-medium text-sm text-foreground flex items-center gap-2">
                    <Camera size={16} className="text-muted" /> Attached Evidence
                  </h4>
                  <div className="flex gap-4">
                    <div className="w-32 h-32 bg-surface-elevated border border-border rounded-lg flex items-center justify-center">
                      <span className="text-xs text-muted font-inter">Img_9012.jpg</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-border">
                  <button onClick={() => handleUpdateStatus("APPROVED")} disabled={updateStatusMutation.isPending} className="flex-1 bg-primary text-white font-inter font-medium py-3 rounded-lg hover:bg-primary-hover transition-colors shadow-sm disabled:opacity-50">
                    Approve & Generate Shipping Label
                  </button>
                  <button onClick={() => handleUpdateStatus("REJECTED")} disabled={updateStatusMutation.isPending} className="flex-1 bg-surface border border-red-500/30 text-red-500 font-inter font-medium py-3 rounded-lg hover:bg-red-500/10 transition-colors disabled:opacity-50">
                    Reject Request
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* STEP 2: INSPECTION */}
          {step === "INSPECTION" && (
            <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex flex-col animate-in fade-in">
              <div className="px-6 py-4 border-b border-border flex items-center gap-2 bg-surface-elevated">
                <Package size={18} className="text-indigo-400" />
                <h3 className="font-inter font-semibold text-foreground">Warehouse Receiving & Inspection</h3>
              </div>
              <div className="p-6 flex flex-col gap-6">
                
                <div className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Truck className="text-indigo-600" />
                    <div>
                      <p className="font-inter font-medium text-sm text-indigo-900">Package Arrival Tracking</p>
                      <p className="font-inter text-xs text-indigo-700">Awaiting receiving at warehouse</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleUpdateStatus("RECEIVED")} 
                    disabled={rma.status === 'RECEIVED' || updateStatusMutation.isPending}
                    className="px-4 py-2 bg-surface text-indigo-500 font-inter font-medium text-xs rounded-md shadow-sm border border-indigo-500/30 hover:bg-surface-elevated disabled:opacity-50"
                  >
                    {rma.status === 'RECEIVED' ? 'Received' : 'Mark as Received'}
                  </button>
                </div>

                <div className="flex flex-col gap-4">
                  <h4 className="font-inter font-medium text-sm text-foreground">Inspect Returned Items</h4>
                  
                  {/* Item Inspection Card */}
                  {rma.items?.map((item: any) => {
                    const variant = item.variant || item.orderItem?.variant;
                    const product = variant?.product;
                    return (
                    <div key={item.id} className="border border-border rounded-lg p-4 flex gap-4 bg-background/50">
                      <div className="w-16 h-20 bg-surface rounded flex-shrink-0 relative overflow-hidden border border-border">
                        {product?.featuredImage && (
                          <Image src={product.featuredImage} alt="Product" fill sizes="100px" className="object-cover" />
                        )}
                      </div>
                      <div className="flex flex-col flex-1 gap-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-inter font-semibold text-sm text-foreground">{product?.name || "Unknown Product"}</p>
                            <p className="font-inter text-xs text-muted">{variant?.name || "Unknown Variant"} • Qty: {item.quantity}</p>
                          </div>
                          <span className="font-inter font-medium text-sm text-foreground font-mono">
                            {item.orderItem?.priceAtPurchase ? `LKR ${item.orderItem.priceAtPurchase.toLocaleString()}` : 'MANUAL'}
                          </span>
                        </div>
                        
                        <div className="flex gap-2 mt-2">
                          <label className="flex-1 flex items-center gap-2 p-2 border border-border rounded-md cursor-pointer hover:bg-surface-elevated transition-colors">
                            <input 
                              type="radio" 
                              name={`condition_${item.id}`} 
                              checked={itemConditions[item.id] === 'RESTOCKABLE'}
                              onChange={() => setItemConditions(prev => ({ ...prev, [item.id]: 'RESTOCKABLE' }))}
                              className="text-primary focus:ring-primary" 
                            />
                            <span className="font-inter text-xs text-foreground font-medium">Restockable (A-Grade)</span>
                          </label>
                          <label className="flex-1 flex items-center gap-2 p-2 border border-border rounded-md cursor-pointer hover:bg-surface-elevated transition-colors">
                            <input 
                              type="radio" 
                              name={`condition_${item.id}`} 
                              checked={itemConditions[item.id] === 'DAMAGED'}
                              onChange={() => setItemConditions(prev => ({ ...prev, [item.id]: 'DAMAGED' }))}
                              className="text-primary focus:ring-primary" 
                            />
                            <span className="font-inter text-xs text-red-500 font-medium">Damaged / Write-off</span>
                          </label>
                        </div>
                      </div>
                    </div>
                    );
                  })}

                </div>

                <div className="flex gap-4 pt-4 border-t border-border">
                  <button 
                    onClick={() => {
                      if (Object.keys(itemConditions).length === rma.items.length) {
                        setStep("RESOLUTION");
                      } else {
                        globalDialog.alert("Please inspect all items before proceeding.");
                      }
                    }} 
                    className="w-full bg-primary text-white font-inter font-medium py-3 rounded-lg hover:bg-primary-hover transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    Complete Inspection <ChevronLeft size={16} className="rotate-180" />
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* STEP 3: RESOLUTION */}
          {step === "RESOLUTION" && (
            <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex flex-col animate-in fade-in">
              <div className="px-6 py-4 border-b border-border flex items-center gap-2 bg-surface-elevated">
                <RefreshCw size={18} className="text-emerald-500" />
                <h3 className="font-inter font-semibold text-foreground">Financial Resolution</h3>
              </div>
              <div className="p-6 flex flex-col gap-6">
                
                <div className="flex flex-col gap-3">
                  <h4 className="font-inter font-medium text-sm text-foreground">Calculate Refund</h4>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="font-inter text-sm text-muted">Subtotal ({rma.items?.length || 0} item)</span>
                    <span className="font-inter text-sm font-medium text-foreground font-mono">LKR {rma.refundAmount?.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded text-primary focus:ring-primary" />
                      <span className="font-inter text-sm text-muted">Deduct original shipping fee</span>
                    </label>
                    <span className="font-inter text-sm font-medium text-red-500 font-mono">- LKR 350</span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="font-inter font-bold text-base text-foreground">Total Refund</span>
                    <span className="font-inter font-bold text-xl text-emerald-500 font-mono">LKR {rma.refundAmount?.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-4 border-t border-border">
                  <h4 className="font-inter font-medium text-sm text-foreground">Select Resolution Method</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button 
                      onClick={() => setResolutionMethod("REFUND")}
                      className={`flex flex-col items-start p-4 border rounded-lg text-left transition-colors ${resolutionMethod === "REFUND" ? "border-emerald-500 bg-emerald-500/10 shadow-sm" : "border-border bg-surface hover:bg-surface-elevated"}`}
                    >
                      <span className={`font-inter font-bold text-sm mb-1 ${resolutionMethod === "REFUND" ? "text-emerald-400" : "text-foreground"}`}>Original Payment</span>
                      <span className={`font-inter text-xs ${resolutionMethod === "REFUND" ? "text-emerald-500" : "text-muted"}`}>Refund directly to payment method</span>
                    </button>
                    <button 
                      onClick={() => setResolutionMethod("STORE_CREDIT")}
                      className={`flex flex-col items-start p-4 border rounded-lg text-left transition-colors ${resolutionMethod === "STORE_CREDIT" ? "border-emerald-500 bg-emerald-500/10 shadow-sm" : "border-border bg-surface hover:bg-surface-elevated"}`}
                    >
                      <span className={`font-inter font-bold text-sm mb-1 ${resolutionMethod === "STORE_CREDIT" ? "text-emerald-400" : "text-foreground"}`}>Store Credit</span>
                      <span className={`font-inter text-xs ${resolutionMethod === "STORE_CREDIT" ? "text-emerald-500" : "text-muted"}`}>Issue as Loyalty Points</span>
                    </button>
                    <button 
                      onClick={() => setResolutionMethod("EXCHANGE")}
                      className={`flex flex-col items-start p-4 border rounded-lg text-left transition-colors ${resolutionMethod === "EXCHANGE" ? "border-emerald-500 bg-emerald-500/10 shadow-sm" : "border-border bg-surface hover:bg-surface-elevated"}`}
                    >
                      <span className={`font-inter font-bold text-sm mb-1 ${resolutionMethod === "EXCHANGE" ? "text-emerald-400" : "text-foreground"}`}>Exchange Item</span>
                      <span className={`font-inter text-xs ${resolutionMethod === "EXCHANGE" ? "text-emerald-500" : "text-muted"}`}>Create zero-dollar replacement order</span>
                    </button>
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-border">
                  <button 
                    onClick={() => handleUpdateStatus("REFUNDED")} 
                    disabled={updateStatusMutation.isPending}
                    className="w-full bg-emerald-600 text-white font-inter font-medium py-3 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle2 size={18} /> 
                    {resolutionMethod === "REFUND" ? "Issue Refund & Close RMA" : 
                     resolutionMethod === "STORE_CREDIT" ? "Issue Store Credit & Close RMA" : 
                     "Process Exchange & Close RMA"}
                  </button>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* Right Column: Customer Info Summary */}
        <div className="flex flex-col gap-6">
          <div className="bg-surface border border-border rounded-xl shadow-sm p-6 flex flex-col gap-4">
            <h3 className="font-inter font-semibold text-foreground border-b border-border pb-2">Customer Profile</h3>
            
            <div className="flex flex-col gap-1">
              <span className="font-inter text-xs font-medium text-muted uppercase tracking-wider">Name</span>
              <span className="font-inter font-medium text-sm text-foreground">{rma.customer ? `${rma.customer.firstName} ${rma.customer.lastName || ''}` : 'Unknown'}</span>
            </div>
            
            <div className="flex flex-col gap-1">
              <span className="font-inter text-xs font-medium text-muted uppercase tracking-wider">Original Order</span>
              {rma.order?.orderNumber ? (
                <Link href={`/admin/orders/${rma.order.orderNumber}`} className="font-inter font-medium text-sm text-blue-500 hover:underline">
                  #{rma.order.orderNumber}
                </Link>
              ) : (
                <span className="font-inter font-medium text-sm text-muted">MANUAL RETURN</span>
              )}
            </div>
            
            <div className="flex flex-col gap-1">
              <span className="font-inter text-xs font-medium text-muted uppercase tracking-wider">Customer LTV</span>
              <span className="font-inter font-medium text-sm text-emerald-500 font-mono">LKR {rma.customerLtv?.toLocaleString()}</span>
            </div>

            <div className="mt-2 bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg flex items-start gap-2">
              <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
              <p className="font-inter text-xs text-blue-400 leading-relaxed">
                This customer has a very high LTV and this is their first return request. Consider approving swiftly.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
