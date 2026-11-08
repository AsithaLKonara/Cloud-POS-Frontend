"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { paymentService } from "@/services/payment.service";
import { globalDialog } from "@/store/dialog.store";

export default function MockGatewayClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const method = searchParams.get("method") || "Unknown";
  const orderNumber = searchParams.get("orderNumber");
  const amount = searchParams.get("amount");

  const handlePaymentAction = async (status: "SUCCESS" | "FAILED") => {
    if (!orderNumber) return;
    setIsProcessing(true);
    try {
      await paymentService.mockWebhook(method, { orderNumber, status });
      if (status === "SUCCESS") {
        router.push(`/checkout/success?orderNumber=${orderNumber}`);
      } else {
        router.push(`/checkout/failed?orderNumber=${orderNumber}`);
      }
    } catch (error) {
      console.error("Mock gateway error:", error);
      globalDialog.alert("Failed to reach webhook. Please verify that the server is online.", "Gateway Error", { variant: "danger" });
      setIsProcessing(false);
    }
  };

  if (!orderNumber || !amount) {
    return <div className="p-10 text-center">Invalid Gateway Parameters</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-stone-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center border border-stone-200">
        <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl font-bold text-stone-700">{method[0]?.toUpperCase()}</span>
        </div>
        <h1 className="text-2xl font-bold mb-2 capitalize">{method} Mock Gateway</h1>
        <p className="text-stone-500 mb-6">This is a simulated payment gateway for testing.</p>
        
        <div className="bg-stone-50 p-4 rounded-lg mb-8 text-left border border-stone-100">
          <div className="flex justify-between mb-2">
            <span className="text-stone-500">Order Number</span>
            <span className="font-semibold">{orderNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Amount to Pay</span>
            <span className="font-bold text-lg">Rs. {Number(amount).toLocaleString()}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => handlePaymentAction("SUCCESS")}
            disabled={isProcessing}
            className="w-full bg-green-600 text-white font-semibold py-3 rounded-full hover:bg-green-700 transition disabled:opacity-50"
          >
            {isProcessing ? "Processing..." : "Simulate Successful Payment"}
          </button>
          
          <button
            onClick={() => handlePaymentAction("FAILED")}
            disabled={isProcessing}
            className="w-full bg-red-50 text-red-600 font-semibold py-3 rounded-full hover:bg-red-100 transition disabled:opacity-50"
          >
            Simulate Payment Failure
          </button>
        </div>
      </div>
    </div>
  );
}
