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
    template: "%s | Cloud POS & ERP",
    default: "Cloud POS & ERP | Inter-Branch Oil Retail System",
  },
  description: "Enterprise Inter-Branch POS, ERP, and CRM System for Oil & Lubricant Retail.",
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
    <html lang="en">
      <body
        className={`${poppins.variable} ${orangeAvenue.variable} ${inriaSerif.variable} ${urbanist.variable} antialiased bg-slate-950 text-slate-100`}
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
