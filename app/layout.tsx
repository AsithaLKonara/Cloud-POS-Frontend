import type { Metadata } from "next";
import { Poppins, Inria_Serif, Urbanist } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const inriaSerif = Inria_Serif({
  variable: "--font-inria",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

const orangeAvenue = localFont({
  src: "../public/fonts/orange-avenue-demo.regular.otf",
  variable: "--font-signature",
});

const urbanist = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | XONIT POS - Universal Enterprise Platform",
    default: "XONIT POS | The Universal Multi-Tenant Enterprise Platform",
  },
  description: "Next-generation Universal Multi-Tenant POS, ERP, CRM & P&L Platform for Retail, Restaurants, Salons, Pharmacies, Groceries, Wholesale & Services in Sri Lanka.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
  },
};

import Providers from "./providers";
import GlobalDialog from "@/components/ui/GlobalDialog";
import GlobalToast from "@/components/ui/GlobalToast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${poppins.variable} ${orangeAvenue.variable} ${inriaSerif.variable} ${urbanist.variable} antialiased bg-background text-foreground transition-colors min-h-screen`}
      >
        <Providers>
          {children}
          <GlobalDialog />
          <GlobalToast />
        </Providers>
      </body>
    </html>
  );
}
