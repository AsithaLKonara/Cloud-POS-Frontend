import { Metadata } from "next";
import TenantSettingsPageClient from "./PageClient";

export const metadata: Metadata = {
  title: "Tenant Settings | XONIT Cloud POS",
  description: "Manage multi-tenant business identity, currency, regional taxes, receipt preferences, and plan quotas.",
};

export default function TenantSettingsPage() {
  return <TenantSettingsPageClient />;
}
