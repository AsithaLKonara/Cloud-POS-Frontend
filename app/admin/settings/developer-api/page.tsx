import { Metadata } from "next";
import DeveloperApiPageClient from "./PageClient";

export const metadata: Metadata = {
  title: "Headless Developer API & Storefront Keys | XONIT Operations Platform",
  description: "Scoped API keys, headless e-commerce endpoints, and multi-platform SDK quickstarts for external web and mobile integrations",
};

export default function DeveloperApiPage() {
  return <DeveloperApiPageClient />;
}
