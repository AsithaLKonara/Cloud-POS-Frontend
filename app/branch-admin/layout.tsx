"use client";

import DashboardLayoutClient from "@/components/dashboard/DashboardLayoutClient";

export default function BranchAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayoutClient>
      {children}
    </DashboardLayoutClient>
  );
}
