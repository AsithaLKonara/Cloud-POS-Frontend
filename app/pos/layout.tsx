import type { Metadata } from "next";

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
    <div className="dashboard-theme flex h-screen w-full bg-background overflow-hidden select-none">
      {children}
    </div>
  );
}
