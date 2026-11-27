"use client";

import React from "react";
import SuperAdminLayout from "../layout";
import SuperAdminSupportHelpdesk from "@/components/superadmin/SuperAdminSupportHelpdesk";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SuperAdminTicketsPage() {
  return (
    <div className="min-h-screen bg-[#090A0C] text-zinc-100 p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/superadmin"
          className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Super Admin Overview
        </Link>
      </div>
      <SuperAdminSupportHelpdesk />
    </div>
  );
}
