import DashboardLayoutClient from "@/components/dashboard/DashboardLayoutClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard | Xonit Cloud ERP & POS",
  description: "Enterprise multi-tenant cloud management platform and POS system",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayoutClient>
      {children}
    </DashboardLayoutClient>
  );
}
