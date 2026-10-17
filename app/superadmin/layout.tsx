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
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {children}
    </div>
  );
}
