import { Metadata } from "next";
import IntegrationsPageClient from "./PageClient";

export const metadata: Metadata = {
  title: "External Services & Credentials Vault | XONIT Operations Platform",
  description: "Secure AES-256 encrypted multi-tenant integration vault for PayHere, Koko, WebXPay, LankaQR, and Couriers",
};

export default function IntegrationsSettingsPage() {
  return <IntegrationsPageClient />;
}
