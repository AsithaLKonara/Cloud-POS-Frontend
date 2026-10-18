import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "XONIT SPACE | Super Admin Platform Control Center",
  description: "Global Multi-Tenant Platform Governance, MRR Financials, and Infrastructure Management",
};

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#090A0C] text-zinc-100 flex flex-col font-sans selection:bg-zinc-800 selection:text-white">
      {children}
    </div>
  );
}
