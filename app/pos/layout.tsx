import type { Metadata } from "next";
import PlatformBroadcastBanner from "@/components/common/PlatformBroadcastBanner";

export const metadata: Metadata = {
  title: "POS Terminal | Xonit Point of Sale",
  description: "Enterprise Point of Sale Terminal and checkout engine",
};

export default function POSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-theme flex flex-col h-screen w-full bg-background overflow-hidden select-none">
      <PlatformBroadcastBanner />
      <div className="flex-1 flex overflow-hidden w-full">
        {children}
      </div>
    </div>
  );
}
