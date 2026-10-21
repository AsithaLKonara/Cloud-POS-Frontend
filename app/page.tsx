"use client";

import { useState, useEffect, useId } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Layers,
  Store,
  Building2,
  Printer,
  Barcode,
  ShoppingBag,
  Utensils,
  Scissors,
  Pill,
  Truck,
  CreditCard,
  QrCode,
  TrendingUp,
  Cpu,
  Monitor,
  ShieldCheck,
  Sliders,
  DollarSign,
  HelpCircle,
  Sparkles,
  Zap,
  Phone,
  Mail,
  MapPin,
  X,
  Package,
  Receipt,
  RotateCcw,
  Users,
  Warehouse,
  FileSpreadsheet,
  Clock,
  ArrowLeftRight,
  BadgePercent,
  CircleDot,
} from "lucide-react";

// =========================================================================
// DATA STRUCTURES & TYPINGS
// =========================================================================

type IndustryKey = "retail" | "restaurants" | "pharmacies" | "salons" | "wholesale";

interface IndustryData {
  id: IndustryKey;
  label: string;
  tagline: string;
  headline: string;
  description: string;
  badge: string;
  features: string[];
  metrics: { label: string; value: string; hint: string }[];
  posItemPreview: { name: string; sku: string; price: string; qty: number; tag: string }[];
}

const INDUSTRIES: Record<IndustryKey, IndustryData> = {
  retail: {
    id: "retail",
    label: "Retail & Apparel",
    tagline: "RETAIL SOLUTIONS",
    headline: "Everyday retail, without counter bottlenecks.",
    description: "Scan barcodes in milliseconds, manage multi-size and color matrix variations, process instant returns, and keep inventory accurate across your sales floor and stockroom.",
    badge: "Barcode & Matrix POS",
    features: [
      "Sub-second USB & Bluetooth barcode scanning",
      "Variants matrix (Size, Color, Material, Brand)",
      "Instant exchange & return slips with credit balance",
      "Customer loyalty points & SMS promotional vouchers",
      "Low-stock automated alerts & reorder thresholds",
    ],
    metrics: [
      { label: "Scan-to-Receipt Speed", value: "< 2.8s", hint: "Average transaction time" },
      { label: "Inventory Accuracy", value: "99.4%", hint: "Real-time stock deduction" },
      { label: "Daily Peak Handling", value: "1,400+", hint: "Receipts per register/day" },
    ],
    posItemPreview: [
      { name: "Linen Long Sleeve Shirt (Navy / L)", sku: "RET-LSH-042", price: "LKR 4,950", qty: 2, tag: "Apparel" },
      { name: "Slim Fit Chino Trouser (Khaki / 32)", sku: "RET-CHN-118", price: "LKR 5,800", qty: 1, tag: "Apparel" },
      { name: "Genuine Leather Belt (Black / 34)", sku: "RET-BLT-009", price: "LKR 2,400", qty: 1, tag: "Accessory" },
    ],
  },
  restaurants: {
    id: "restaurants",
    label: "Restaurants & Cafes",
    tagline: "HOSPITALITY SUITE",
    headline: "Floor tables, kitchen tickets, and split bills unified.",
    description: "Route orders directly to kitchen display terminals or 80mm thermal printers, manage table layouts in real-time, apply service charge, and split bills effortlessly.",
    badge: "Kitchen Display & Table Management",
    features: [
      "Multi-station KOT (Kitchen Order Ticket) routing",
      "Visual floorplan with live table statuses (Vacant, Dining, Billed)",
      "Split bill by item, seat, or equal shares in one click",
      "Item modifiers (No onion, Extra cheese, Less sugar)",
      "Automated Sri Lankan 10% Service Charge & VAT handling",
    ],
    metrics: [
      { label: "Order-to-Kitchen", value: "Instant", hint: "LAN thermal print routing" },
      { label: "Table Turn Acceleration", value: "+22%", hint: "Fast bill settlement" },
      { label: "Modifier Accuracy", value: "100%", hint: "Zero misplaced chef notes" },
    ],
    posItemPreview: [
      { name: "Signature Ceylon Seafood Nasi Goreng", sku: "FNB-NASI-01", price: "LKR 2,250", qty: 2, tag: "Kitchen 1" },
      { name: "Iced Salted Caramel Latte (Oat Milk)", sku: "BEV-LAT-04", price: "LKR 1,150", qty: 2, tag: "Barista" },
      { name: "Spicy Hot Butter Cuttlefish (Shareable)", sku: "FNB-HBC-08", price: "LKR 2,650", qty: 1, tag: "Kitchen 2" },
    ],
  },
  pharmacies: {
    id: "pharmacies",
    label: "Pharmacies & Health",
    tagline: "HEALTHCARE COMPLIANCE",
    headline: "Batch-lot tracking with strict FEFO expiry enforcement.",
    description: "Keep medication inventory NMRA-compliant with strict First-Expiry First-Out dispensing, automated batch tracking, prescription dosage records, and quick brand substitutions.",
    badge: "FEFO & NMRA Batch Verified",
    features: [
      "FEFO (First-Expired, First-Out) automated stock priority",
      "Batch number & expiry date printed directly on customer receipt",
      "Generic formulation lookup for instant patient alternatives",
      "Scheduled narcotics & controlled substance audit logging",
      "Supplier GRN batch reconciliation with batch-level cost tracking",
    ],
    metrics: [
      { label: "Expiry Loss Prevention", value: "-85%", hint: "Proactive 90/60/30 day alerts" },
      { label: "Compliance Auditing", value: "1-Click", hint: "Full NMRA batch history" },
      { label: "Generic Match Speed", value: "< 1s", hint: "Molecule-level lookup" },
    ],
    posItemPreview: [
      { name: "Augmentin 625mg Tab (B# 982A1 / Exp 11/27)", sku: "MED-AUG-625", price: "LKR 3,850", qty: 1, tag: "Rx Script" },
      { name: "Panadol ActiFast 500mg Strip (20 Tabs)", sku: "MED-PAN-ACT", price: "LKR 460", qty: 2, tag: "OTC" },
      { name: "Nexium 20mg Gastro-Resistant (B# 440K)", sku: "MED-NEX-020", price: "LKR 2,100", qty: 1, tag: "Rx Script" },
    ],
  },
  salons: {
    id: "salons",
    label: "Salons & Spas",
    tagline: "SERVICE MANAGEMENT",
    headline: "Stylist commissions, booked slots, and product upsells.",
    description: "Manage appointment schedules, split service commissions among stylists, track package memberships, and sell retail products on the same single counter screen.",
    badge: "Stylist Commission & Booking Engine",
    features: [
      "Per-service custom commission splits for stylists & therapists",
      "Appointment timeline view with walk-in queue management",
      "Prepaid treatment packages and recurring session deductions",
      "Combined service + retail hair & skin product checkout",
      "Customer preference history & color formula notes",
    ],
    metrics: [
      { label: "Commission Calculation", value: "Zero Err", hint: "Automated end-of-day report" },
      { label: "Package Redemption", value: "1-Click", hint: "Customer profile lookup" },
      { label: "Retail Cross-sell", value: "+34%", hint: "Checkout prompt suggestions" },
    ],
    posItemPreview: [
      { name: "Keratin Smooth Hair Therapy (Senior Stylist: Sarah)", sku: "SRV-KER-01", price: "LKR 16,500", qty: 1, tag: "Service" },
      { name: "Moroccanoil Treatment Oil (100ml Bottle)", sku: "RET-OIL-100", price: "LKR 9,200", qty: 1, tag: "Retail Product" },
      { name: "Express Botanical Scalp Treatment", sku: "SRV-SCP-02", price: "LKR 4,500", qty: 1, tag: "Service" },
    ],
  },
  wholesale: {
    id: "wholesale",
    label: "Wholesale & Trade",
    tagline: "BULK DISTRIBUTION",
    headline: "Tiered pricing, credit terms, and delivery notes.",
    description: "Support volume discount tiers, customer credit ledgers with payment schedules, multi-warehouse dispatches, and tax invoices for commercial distribution.",
    badge: "B2B Credit & Tiered Volume",
    features: [
      "Tiered pricing based on customer grade (A/B/C/Wholesale)",
      "Customer credit limits with automated aging debtor ledgers",
      "Bulk packing units (Cartons, Crates, Kilograms, Rolls)",
      "Delivery orders (DO) & Gate Pass printouts with driver signs",
      "Sales rep order taking on mobile or tablet in the field",
    ],
    metrics: [
      { label: "Credit Risk Control", value: "Realtime", hint: "Hard lock on overdue accounts" },
      { label: "Bulk Order Invoicing", value: "Fast", hint: "Excel / CSV batch import" },
      { label: "Dispatch Visibility", value: "100%", hint: "Waybill & delivery tracking" },
    ],
    posItemPreview: [
      { name: "Grade 1 Basmati Rice (50kg Master Bag x 10)", sku: "WHO-RIC-50K", price: "LKR 115,000", qty: 10, tag: "Bulk Food" },
      { name: "Refined White Sugar (50kg Sack x 5)", sku: "WHO-SUG-50K", price: "LKR 48,500", qty: 5, tag: "Bulk Food" },
      { name: "Ceylon Cinnamon Quills Alba (10kg Carton)", sku: "WHO-CIN-ALB", price: "LKR 65,000", qty: 2, tag: "Export Tier" },
    ],
  },
};

const FAQS = [
  {
    q: "Is XONIT POS suitable for both single-shop owners and multi-branch chains?",
    a: "Yes. XONIT was architected from the ground up for Sri Lankan retail, dining, pharmacy, and wholesale businesses. You can run a single counter with a thermal printer or scale to dozens of outlets across Colombo, Kandy, Galle, and islandwide with real-time consolidated inventory, branch transfers, and unified reporting.",
  },
  {
    q: "Can I use my existing thermal receipt printer, barcode scanner, and cash drawer?",
    a: "Absolutely. XONIT works with standard industry POS hardware. Any 80mm or 58mm ESC/POS thermal printer (USB, Network LAN, Wi-Fi, or Bluetooth) is supported via our zero-click XONIT Hardware Bridge. USB barcode scanners and RJ11 automatic cash drawers work natively without proprietary lock-ins.",
  },
  {
    q: "Which Sri Lankan payment methods and gateways are supported?",
    a: "XONIT supports Cash with automated change calculation, credit/debit card terminals, LankaQR digital payments, and popular Buy Now Pay Later (BNPL) gateways including Koko, Mintpay, Onepay, and Payzy. Split tender payments (e.g. half cash, half card) are fully supported on every checkout.",
  },
  {
    q: "What happens if our internet connection drops during peak trading hours?",
    a: "XONIT is engineered with localized client resilience. Your terminal buffers active sales and prints receipts locally through the network hardware bridge even during intermittent broadband drops. When the connection re-establishes, pending transactional records sync automatically with zero duplicated entries.",
  },
  {
    q: "Can you help migrate our existing products, barcodes, and inventory from Excel?",
    a: "Yes. Our onboarding team provides free spreadsheet data migration for your product catalogue, barcodes, cost prices, selling prices, categories, and opening stock levels. We also train your cashier staff on-site or via dedicated video walk-throughs before launch.",
  },
  {
    q: "Are there any hidden fees, terminal license penalties, or surprise upgrade costs?",
    a: "No. Our pricing in Sri Lankan Rupees (LKR) is 100% transparent. What you see is what you pay. You receive free automatic software updates, regular cloud backups, and dedicated WhatsApp/phone technical support without surprise per-transaction software cuts.",
  },
];

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);
  const [activeIndustry, setActiveIndustry] = useState<IndustryKey>("retail");
  const [billingCycle, setBillingCycle] = useState<"annual" | "monthly">("annual");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoSubmitted, setDemoSubmitted] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 30 });

  // Unique Form ID for Accessibility
  const nameId = useId();
  const phoneId = useId();
  const businessTypeId = useId();
  const locationId = useId();

  // Scroll listener for subtle navigation opacity transition
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Parallax mouse position
  const handleHeroMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY, currentTarget } = e;
    const { width, height, left, top } = currentTarget.getBoundingClientRect();
    const x = ((clientX - left) / width) * 100;
    const y = ((clientY - top) / height) * 100;
    setMousePos({ x, y });
  };

  // Pricing calculations
  const getPrice = (monthlyLkr: number) => {
    if (billingCycle === "annual") {
      return Math.round(monthlyLkr * 0.8); // 20% savings
    }
    return monthlyLkr;
  };

  const formatLKR = (amount: number) =>
    new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <div
      className="min-h-screen bg-[#050706] text-[#F4F5F1] font-inter selection:bg-[#00C987]/30 selection:text-[#00C987] relative overflow-x-hidden antialiased"
    >
      {/* =========================================================================
          GLOBAL ATMOSPHERIC BACKGROUND: Wallpaper + Emerald/Teal Horizon Lighting
          ========================================================================= */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        {/* Low-opacity wallpaper texture for depth */}
        <div className="absolute inset-0 opacity-40 mix-blend-screen">
          <Image
            src="/gradient-wallpaper.png"
            alt="Atmospheric Wallpaper"
            fill
            priority
            className="object-cover object-top"
          />
        </div>

        {/* Emerald upper-left signature atmospheric bloom */}
        <div
          className="absolute -top-[20%] -left-[10%] w-[65vw] h-[65vw] rounded-full filter blur-[140px] opacity-25"
          style={{
            background: "radial-gradient(circle, rgba(0, 201, 135, 0.45) 0%, rgba(66, 192, 200, 0.15) 50%, transparent 75%)",
          }}
        />

        {/* Subtle oxidized teal soft fill */}
        <div
          className="absolute top-[35%] -right-[15%] w-[50vw] h-[50vw] rounded-full filter blur-[150px] opacity-15"
          style={{
            background: "radial-gradient(circle, rgba(66, 192, 200, 0.35) 0%, rgba(0, 201, 135, 0.1) 60%, transparent 80%)",
          }}
        />

        {/* Global bottom dark fade */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050706]/70 to-[#050706]" />
      </div>

      {/* =========================================================================
          01 — NAVIGATION (Fixed with scroll transition: transparent -> carbon)
          ========================================================================= */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrollY > 40
            ? "bg-[#0B100F]/90 backdrop-blur-md border-b border-[#26322C] py-3.5 shadow-2xl shadow-black/60"
            : "bg-transparent border-b border-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo & Brand Identity */}
          <Link href="/" className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00C987] rounded-md">
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center">
              <Image
                src="/logo/xonit-white-trimmed.png"
                alt="XONIT POS Logo"
                width={36}
                height={36}
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-manrope font-extrabold tracking-tight text-lg text-[#F4F5F1] group-hover:text-white transition-colors">
                XONIT <span className="text-[#00C987] font-semibold text-xs tracking-widest ml-1 font-ibm">POS</span>
              </span>
              <span className="text-[10px] text-[#A5B1AA] tracking-wider uppercase font-ibm hidden sm:block">
                Enterprise Cloud
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#A5B1AA]">
            <a href="#platform" className="hover:text-[#F4F5F1] transition-colors">
              Platform
            </a>
            <a href="#solutions" className="hover:text-[#F4F5F1] transition-colors">
              Solutions
            </a>
            <a href="#branches" className="hover:text-[#F4F5F1] transition-colors">
              Multi-Branch
            </a>
            <a href="#hardware" className="hover:text-[#F4F5F1] transition-colors">
              Hardware
            </a>
            <a href="#pricing" className="hover:text-[#F4F5F1] transition-colors">
              Pricing
            </a>
            <a href="#faq" className="hover:text-[#F4F5F1] transition-colors">
              FAQ
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-xs sm:text-sm font-medium text-[#A5B1AA] hover:text-[#F4F5F1] transition-colors px-3 py-2 rounded-lg hover:bg-[#11211B]/60"
            >
              Terminal Login
            </Link>
            <button
              onClick={() => setDemoModalOpen(true)}
              className="relative inline-flex items-center justify-center px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-manrope font-bold text-[#050706] bg-[#F4F5F1] hover:bg-white rounded-lg shadow-lg hover:shadow-[#00C987]/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#00C987] focus:ring-offset-2 focus:ring-offset-[#050706]"
            >
              <span>Book a Demo</span>
              <ArrowUpRight className="w-4 h-4 ml-1.5 text-[#050706]" />
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          02 — CINEMATIC EDITORIAL HERO SECTION
          Preserving Figma Identity: Oversized XONIT wordmark, Graphite laptop,
          emerald lighting, 2-line strong headline, crisp product visual.
          ========================================================================= */}
      <section
        id="hero"
        onMouseMove={handleHeroMouseMove}
        className="relative pt-32 pb-20 sm:pt-36 sm:pb-28 lg:pt-44 lg:pb-36 min-h-[95vh] flex flex-col justify-between items-center text-center overflow-hidden z-10"
      >
        {/* Giant Monospace XONIT Wordmark Behind Laptop (Parallax Shift) */}
        <div
          className="absolute top-[18%] sm:top-[15%] lg:top-[12%] left-1/2 -translate-x-1/2 pointer-events-none select-none z-0 w-full"
          style={{
            transform: `translate(calc(-50% + ${(mousePos.x - 50) * 0.15}px), ${(mousePos.y - 50) * 0.1}px)`,
            transition: "transform 0.2s ease-out",
          }}
          aria-hidden="true"
        >
          <span className="font-ibm font-black tracking-tighter text-white/[0.035] text-[20vw] sm:text-[19vw] lg:text-[18vw] leading-none block uppercase">
            XONIT
          </span>
        </div>

        {/* Hero Top Content: Eyebrow + Headline + Description + Actions */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 flex flex-col items-center">
          {/* Eyebrow Label */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#11211B]/80 border border-[#26322C] text-[#00C987] text-[11px] sm:text-xs font-ibm uppercase tracking-wider mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00C987] animate-pulse" />
            <span>ONE PLATFORM. EVERY OPERATION.</span>
          </div>

          {/* Two-Line Product-Specific Headline */}
          <h1 className="font-manrope font-extrabold text-3xl sm:text-5xl lg:text-6xl text-[#F4F5F1] tracking-tight leading-[1.12] max-w-3xl mb-6">
            Run your business. <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F4F5F1] via-[#F4F5F1] to-[#A5B1AA]">
              Not five different systems.
            </span>
          </h1>

          {/* Focused Description Paragraph */}
          <p className="text-base sm:text-lg text-[#A5B1AA] max-w-2xl leading-relaxed mb-9">
            From the first barcode scan to the final profit report, manage sales, stock, branches,
            and staff performance with one connected cloud POS platform.
          </p>

          {/* Primary & Secondary Conversion Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <button
              onClick={() => setDemoModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 rounded-xl font-manrope font-bold text-sm sm:text-base text-[#050706] bg-[#F4F5F1] hover:bg-white shadow-xl hover:shadow-[#00C987]/25 transition-all duration-200 group"
            >
              <span>Book a Live Demo</span>
              <ArrowUpRight className="w-4 h-4 ml-2 text-[#050706] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
            <a
              href="#platform"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-xl font-medium text-sm sm:text-base text-[#A5B1AA] hover:text-[#F4F5F1] border border-[#26322C] hover:border-[#00C987]/50 bg-[#0B100F]/60 transition-colors"
            >
              <span>Explore the Platform</span>
              <ChevronDown className="w-4 h-4 ml-2 text-[#A5B1AA]" />
            </a>
          </div>

          {/* Regional Proof Badge */}
          <div className="mt-8 flex items-center gap-2 text-xs text-[#A5B1AA] font-ibm">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#00C987]" />
            <span>Built for the way Sri Lankan businesses actually operate.</span>
          </div>
        </div>

        {/* Central Product Focal Point: Graphite Laptop Mockup */}
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 mt-12 sm:mt-14 relative z-10">
          <div className="relative mx-auto flex justify-center">
            {/* Atmospheric backlight behind laptop */}
            <div
              className="absolute -top-10 left-1/2 -translate-x-1/2 w-[70%] h-48 rounded-full filter blur-[70px] opacity-30 pointer-events-none"
              style={{
                background: "linear-gradient(90deg, #00C987 0%, #42C0C8 100%)",
              }}
            />

            {/* Crisp Laptop Mockup Image (No whole-image blur!) */}
            <div className="relative w-full max-w-4xl transition-transform duration-500 hover:scale-[1.01]">
              <Image
                src="/floating-laptop-mockup.webp"
                alt="XONIT POS Enterprise Interface on Graphite Laptop"
                width={1200}
                height={750}
                priority
                className="w-full h-auto object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.9)]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          03 — TRUST & CAPABILITY STRIP
          Clean, verifiable claims without fabricated customer counts or fake logos.
          ========================================================================= */}
      <section className="relative z-10 border-y border-[#26322C] bg-[#0B100F]/90 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <span className="text-[11px] font-ibm uppercase tracking-wider text-[#00C987] block mb-1">
                ENTERPRISE CAPABILITIES
              </span>
              <p className="text-sm font-medium text-[#F4F5F1]">
                Designed for everyday business operations across Sri Lanka.
              </p>
            </div>

            {/* 4 Verifiable Capabilities */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full md:w-auto">
              <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-[#11211B]/50 border border-[#26322C]">
                <ShoppingBag className="w-4 h-4 text-[#00C987] shrink-0" />
                <span className="text-xs font-medium text-[#F4F5F1]">Retail & Wholesale</span>
              </div>
              <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-[#11211B]/50 border border-[#26322C]">
                <Building2 className="w-4 h-4 text-[#42C0C8] shrink-0" />
                <span className="text-xs font-medium text-[#F4F5F1]">Multi-Branch Stock</span>
              </div>
              <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-[#11211B]/50 border border-[#26322C]">
                <Barcode className="w-4 h-4 text-[#00C987] shrink-0" />
                <span className="text-xs font-medium text-[#F4F5F1]">Barcode Checkout</span>
              </div>
              <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-[#11211B]/50 border border-[#26322C]">
                <TrendingUp className="w-4 h-4 text-[#42C0C8] shrink-0" />
                <span className="text-xs font-medium text-[#F4F5F1]">GAAP Margin Reports</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          04 — PRODUCT OVERVIEW: ONE SALE. EVERY SYSTEM STAYS IN SYNC.
          Sharply rendered UI mockup with 3 anchored contextual annotations.
          ========================================================================= */}
      <section id="platform" className="relative z-10 py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-ibm uppercase tracking-widest text-[#00C987] mb-3 block">
              THE PLATFORM
            </span>
            <h2 className="font-manrope font-extrabold text-3xl sm:text-4xl text-[#F4F5F1] tracking-tight mb-5">
              One sale. Every system stays in sync.
            </h2>
            <p className="text-base sm:text-lg text-[#A5B1AA] leading-relaxed">
              Your cashier, inventory team, and management shouldn't be working from different versions of the truth.
              XONIT connects the essential workflows that keep your business moving.
            </p>
          </div>

          {/* Unified Platform Canvas with 3 Anchored Functional Regions */}
          <div className="relative rounded-2xl bg-[#0B100F] border border-[#26322C] shadow-2xl p-4 sm:p-8 overflow-hidden">
            {/* Top Window Bar */}
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-[#26322C]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs font-ibm text-[#A5B1AA] ml-3 hidden sm:inline">
                  XONIT POS — Register #01 · Colombo Flagship Store · Online
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-ibm px-2.5 py-1 rounded bg-[#11211B] text-[#00C987] border border-[#26322C]">
                  LAN PRINTER: CONNECTED (80mm)
                </span>
                <span className="text-xs font-ibm text-[#A5B1AA]">LKR ACTIVE</span>
              </div>
            </div>

            {/* Simulated Live POS Application Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Region 1: Checkout & Scanner (Left Column - 7 Cols) */}
              <div className="lg:col-span-7 bg-[#050706] rounded-xl border border-[#26322C] p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Barcode className="w-4 h-4 text-[#00C987]" />
                      <span className="font-manrope font-bold text-sm text-[#F4F5F1]">Active Basket Scan</span>
                    </div>
                    <span className="text-[11px] font-ibm text-[#A5B1AA]">Customer: Walk-in Retail</span>
                  </div>

                  {/* Scanned Items Table */}
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-[#11211B]/40 border border-[#26322C]/70 text-xs">
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#F4F5F1]">Ceylon OP Black Tea (500g Tin)</span>
                        <span className="text-[10px] text-[#A5B1AA] font-ibm">SKU: TEA-OP-500 · Batch #T88</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-[#F4F5F1] font-bold">LKR 1,850</span>
                        <span className="block text-[10px] text-[#A5B1AA]">x 2 = LKR 3,700</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-[#11211B]/40 border border-[#26322C]/70 text-xs">
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#F4F5F1]">Organic Virgin Coconut Oil (750ml)</span>
                        <span className="text-[10px] text-[#A5B1AA] font-ibm">SKU: VCO-ORG-750 · Batch #C14</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-[#F4F5F1] font-bold">LKR 2,400</span>
                        <span className="block text-[10px] text-[#A5B1AA]">x 1 = LKR 2,400</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-[#11211B]/40 border border-[#26322C]/70 text-xs">
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#F4F5F1]">Natural Cinnamon Toothpicks (Pack of 3)</span>
                        <span className="text-[10px] text-[#A5B1AA] font-ibm">SKU: CIN-PCK-003</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-[#F4F5F1] font-bold">LKR 650</span>
                        <span className="block text-[10px] text-[#A5B1AA]">x 1 = LKR 650</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subtotals & Pay Tender Bar */}
                <div className="border-t border-[#26322C] pt-4">
                  <div className="flex items-center justify-between text-xs text-[#A5B1AA] mb-1.5">
                    <span>Subtotal (4 items)</span>
                    <span className="font-mono text-[#F4F5F1]">LKR 6,750.00</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#A5B1AA] mb-3">
                    <span>Store Member Discount (5%)</span>
                    <span className="font-mono text-[#00C987]">- LKR 337.50</span>
                  </div>
                  <div className="flex items-center justify-between text-base font-bold text-[#F4F5F1] mb-4">
                    <span>Total Payable</span>
                    <span className="font-mono text-xl text-[#00C987]">LKR 6,412.50</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button className="py-2.5 rounded-lg bg-[#11211B] text-xs font-semibold text-[#F4F5F1] border border-[#26322C] hover:border-[#00C987] flex items-center justify-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-[#00C987]" /> Cash
                    </button>
                    <button className="py-2.5 rounded-lg bg-[#11211B] text-xs font-semibold text-[#F4F5F1] border border-[#26322C] hover:border-[#42C0C8] flex items-center justify-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-[#42C0C8]" /> Card
                    </button>
                    <button className="py-2.5 rounded-lg bg-[#00C987] text-xs font-bold text-[#050706] hover:bg-[#00C987]/90 flex items-center justify-center gap-1.5">
                      <QrCode className="w-3.5 h-3.5 text-[#050706]" /> LankaQR
                    </button>
                  </div>
                </div>
              </div>

              {/* Region 2: Real-time Stock & Sync Insights (Right Column - 5 Cols) */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                {/* Real-time Inventory Movement Card */}
                <div className="bg-[#050706] rounded-xl border border-[#26322C] p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Warehouse className="w-4 h-4 text-[#42C0C8]" />
                      <span className="font-manrope font-bold text-sm text-[#F4F5F1]">Live Stock Deduction</span>
                    </div>
                    <span className="text-[10px] font-ibm px-2 py-0.5 rounded bg-[#00C987]/15 text-[#00C987]">
                      FEFO SYNCED
                    </span>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div className="p-2.5 rounded bg-[#11211B]/40 border border-[#26322C]/60 flex items-center justify-between">
                      <div>
                        <span className="text-[#F4F5F1] block font-medium">TEA-OP-500 (Batch #T88)</span>
                        <span className="text-[10px] text-[#A5B1AA]">Store stock: 84 → 82 Units</span>
                      </div>
                      <span className="text-emerald-400 font-mono text-[11px]">-2 deducted</span>
                    </div>
                    <div className="p-2.5 rounded bg-[#11211B]/40 border border-[#26322C]/60 flex items-center justify-between">
                      <div>
                        <span className="text-[#F4F5F1] block font-medium">VCO-ORG-750 (Batch #C14)</span>
                        <span className="text-[10px] text-[#A5B1AA]">Store stock: 19 → 18 Units</span>
                      </div>
                      <span className="text-emerald-400 font-mono text-[11px]">-1 deducted</span>
                    </div>
                  </div>
                </div>

                {/* Real-time Margin & Cash Drawer Audit */}
                <div className="bg-[#050706] rounded-xl border border-[#26322C] p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-[#00C987]" />
                        <span className="font-manrope font-bold text-sm text-[#F4F5F1]">Real-time P&L Impact</span>
                      </div>
                      <span className="text-[10px] font-ibm text-[#A5B1AA]">Shift #03</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-center mb-4">
                      <div className="p-3 rounded-lg bg-[#11211B]/60 border border-[#26322C]">
                        <span className="text-[10px] text-[#A5B1AA] block uppercase font-ibm">Sale Cost (COGS)</span>
                        <span className="text-sm font-bold font-mono text-[#F4F5F1]">LKR 3,720.00</span>
                      </div>
                      <div className="p-3 rounded-lg bg-[#11211B]/60 border border-[#26322C]">
                        <span className="text-[10px] text-[#A5B1AA] block uppercase font-ibm">Gross Profit</span>
                        <span className="text-sm font-bold font-mono text-[#00C987]">+ LKR 2,692.50</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#11211B]/30 border border-[#26322C] text-xs text-[#A5B1AA]">
                    <div className="flex items-center justify-between mb-1">
                      <span>Shift Cash Drawer Float:</span>
                      <span className="font-mono text-[#F4F5F1]">LKR 25,000.00</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Cash Collected Today:</span>
                      <span className="font-mono text-[#F4F5F1]">LKR 118,450.00</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3 Contextual Anchored Explanations (Not floating cards) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 mt-8 border-t border-[#26322C]">
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#11211B] border border-[#26322C] text-[#00C987] flex items-center justify-center font-ibm font-bold text-xs shrink-0">
                  01
                </div>
                <div>
                  <h4 className="font-manrope font-bold text-sm text-[#F4F5F1] mb-1">
                    Checkout: Fast & Multi-Tender
                  </h4>
                  <p className="text-xs text-[#A5B1AA] leading-relaxed">
                    Scan products, apply member discounts, split tender between cash and card, and issue 80mm thermal slips in under 3 seconds.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#11211B] border border-[#26322C] text-[#42C0C8] flex items-center justify-center font-ibm font-bold text-xs shrink-0">
                  02
                </div>
                <div>
                  <h4 className="font-manrope font-bold text-sm text-[#F4F5F1] mb-1">
                    Inventory: Instant Batch Deduction
                  </h4>
                  <p className="text-xs text-[#A5B1AA] leading-relaxed">
                    Stock counts adjust simultaneously across shelf and warehouse locations with strict FEFO/FIFO batch controls.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#11211B] border border-[#26322C] text-[#00C987] flex items-center justify-center font-ibm font-bold text-xs shrink-0">
                  03
                </div>
                <div>
                  <h4 className="font-manrope font-bold text-sm text-[#F4F5F1] mb-1">
                    Management: Live Operating Margins
                  </h4>
                  <p className="text-xs text-[#A5B1AA] leading-relaxed">
                    Cost of goods sold (COGS) and actual gross margins update automatically the moment a receipt completes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          05 — CORE CAPABILITIES: THE TOOLS BEHIND EVERY TRANSACTION
          Editorial split layouts alternating features with large functional visuals.
          ========================================================================= */}
      <section className="relative z-10 py-24 bg-[#0B100F] border-t border-[#26322C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-xs font-ibm uppercase tracking-widest text-[#00C987] mb-3 block">
              BUILT FOR THE WORK
            </span>
            <h2 className="font-manrope font-extrabold text-3xl sm:text-4xl text-[#F4F5F1] tracking-tight mb-5">
              The tools behind every transaction.
            </h2>
            <p className="text-base sm:text-lg text-[#A5B1AA]">
              Essential enterprise controls architected cleanly to eradicate human error at the cash counter.
            </p>
          </div>

          <div className="space-y-20">
            {/* Split Row 1: Sales & Checkout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="text-xs font-ibm uppercase tracking-wider text-[#00C987] block mb-2">
                  01 / COUNTER VELOCITY
                </span>
                <h3 className="font-manrope font-extrabold text-2xl sm:text-3xl text-[#F4F5F1] tracking-tight mb-4">
                  Fast barcode checkout & multi-tender settlement.
                </h3>
                <p className="text-sm sm:text-base text-[#A5B1AA] leading-relaxed mb-6">
                  Cashiers never fumble between separate calculators and note pads. Search products in milliseconds
                  by barcode, name, or SKU. Apply discounts, process customer returns, and print receipts with zero
                  browser dialogue lag.
                </p>
                <ul className="space-y-3 text-xs sm:text-sm text-[#F4F5F1]">
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-[#00C987] shrink-0" />
                    <span>Instant barcode lookup with variant selection (Size, Color, Flavour)</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-[#00C987] shrink-0" />
                    <span>Split payments between Cash, Visa/Mastercard, and LankaQR</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-[#00C987] shrink-0" />
                    <span>Zero-click silent 80mm thermal hardware printing bridge</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-[#00C987] shrink-0" />
                    <span>Customer return slips with verifiable credit balance tracking</span>
                  </li>
                </ul>
              </div>

              {/* Functional Preview Graphic 1 */}
              <div className="rounded-xl bg-[#050706] border border-[#26322C] p-6 shadow-xl">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#26322C]">
                  <span className="text-xs font-ibm text-[#00C987]">ESC/POS HARDWARE CLIENT</span>
                  <span className="text-[10px] font-ibm text-[#A5B1AA]">Status: 0.04s Response</span>
                </div>
                <div className="p-4 rounded-lg bg-[#11211B]/60 border border-[#26322C] mb-4">
                  <div className="flex items-center justify-between text-xs font-mono text-[#F4F5F1] mb-2">
                    <span>XONIT ESC/POS Builder</span>
                    <span className="text-[#00C987]">SILENT DISPATCH</span>
                  </div>
                  <div className="text-[11px] text-[#A5B1AA] font-mono leading-relaxed space-y-1">
                    <p>&gt; [INIT_PRINTER] ESC @</p>
                    <p>&gt; [ALIGN_CENTER] &quot;COLOMBO FLAGSHIP STORE&quot;</p>
                    <p>&gt; [BARCODE_PRINT] CODE128: 893450912</p>
                    <p>&gt; [CUT_PAPER] GS V 66 0</p>
                    <p className="text-[#00C987]">&gt; Cash drawer RJ11 pulse sent: SUCCESS</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-[#A5B1AA] font-ibm">
                  <span>Standard 80mm / 58mm Thermal Roll</span>
                  <span>Zero Chrome Dialogues</span>
                </div>
              </div>
            </div>

            {/* Split Row 2: Inventory & Purchasing (Reversed) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Functional Preview Graphic 2 */}
              <div className="order-2 lg:order-1 rounded-xl bg-[#050706] border border-[#26322C] p-6 shadow-xl">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#26322C]">
                  <span className="text-xs font-ibm text-[#42C0C8]">PURCHASE ORDER & REORDER ALERT</span>
                  <span className="text-[10px] font-ibm px-2 py-0.5 rounded bg-amber-500/15 text-amber-400">
                    LOW STOCK THRESHOLD
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="p-3.5 rounded-lg bg-[#11211B]/60 border border-[#26322C]">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-[#F4F5F1]">Ceylon Earl Grey Premium (100g)</span>
                      <span className="text-red-400 font-mono font-bold">4 Units Remaining</span>
                    </div>
                    <div className="w-full bg-[#26322C] h-1.5 rounded-full overflow-hidden mb-2">
                      <div className="bg-red-400 h-full rounded-full" style={{ width: "15%" }} />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#A5B1AA]">
                      <span>Supplier: Ceylon Agro Trading Ltd</span>
                      <span className="text-[#00C987] font-medium">Reorder Suggestion: 50 Units</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#11211B]/60 border border-[#26322C]">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-[#F4F5F1]">Cold Pressed Sesame Oil (500ml)</span>
                      <span className="text-emerald-400 font-mono font-bold">42 Units in Stock</span>
                    </div>
                    <div className="w-full bg-[#26322C] h-1.5 rounded-full overflow-hidden mb-2">
                      <div className="bg-emerald-400 h-full rounded-full" style={{ width: "70%" }} />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#A5B1AA]">
                      <span>Supplier: Lanka Naturals (Pvt)</span>
                      <span className="text-slate-400">Next expected delivery: 28 Oct</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="order-1 lg:order-2">
                <span className="text-xs font-ibm uppercase tracking-wider text-[#42C0C8] block mb-2">
                  02 / INVENTORY & PROCUREMENT
                </span>
                <h3 className="font-manrope font-extrabold text-2xl sm:text-3xl text-[#F4F5F1] tracking-tight mb-4">
                  Keep suppliers, purchase orders, and stock locked.
                </h3>
                <p className="text-sm sm:text-base text-[#A5B1AA] leading-relaxed mb-6">
                  Eliminate blind stockouts and excessive dead inventory. Generate Goods Received Notes (GRN),
                  track supplier invoices against actual deliveries, and receive automated reorder triggers when
                  safety stock falls below your minimum threshold.
                </p>
                <ul className="space-y-3 text-xs sm:text-sm text-[#F4F5F1]">
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-[#42C0C8] shrink-0" />
                    <span>Goods Received Notes (GRN) with weighted average cost updates</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-[#42C0C8] shrink-0" />
                    <span>FEFO & FIFO batch expiry date notifications</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-[#42C0C8] shrink-0" />
                    <span>Supplier payment ledgers with credit period reminders</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-[#42C0C8] shrink-0" />
                    <span>Stock variance audit logging for periodic store inventory counts</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          06 — INDUSTRY SOLUTIONS: DIFFERENT BUSINESSES. ONE PLATFORM.
          Interactive industry switcher updating real functional data.
          ========================================================================= */}
      <section id="solutions" className="relative z-10 py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-ibm uppercase tracking-widest text-[#00C987] mb-3 block">
              SPECIALIZED WORKFLOWS
            </span>
            <h2 className="font-manrope font-extrabold text-3xl sm:text-4xl text-[#F4F5F1] tracking-tight mb-5">
              Different businesses. Different workflows. One platform.
            </h2>
            <p className="text-base sm:text-lg text-[#A5B1AA]">
              A retail boutique doesn&apos;t run like an emergency pharmacy or a busy seafood bistro. Select your
              industry to see how XONIT tailors its counter.
            </p>
          </div>

          {/* Industry Tabs Selector */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-12 p-1.5 rounded-xl bg-[#0B100F] border border-[#26322C] max-w-3xl mx-auto">
            {(Object.keys(INDUSTRIES) as IndustryKey[]).map((key) => {
              const item = INDUSTRIES[key];
              const isActive = activeIndustry === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveIndustry(key)}
                  className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-manrope font-bold transition-all duration-200 ${
                    isActive
                      ? "bg-[#11211B] text-[#00C987] border border-[#00C987]/40 shadow-md shadow-[#00C987]/10"
                      : "text-[#A5B1AA] hover:text-[#F4F5F1] hover:bg-[#11211B]/40"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Active Industry Showcase Panel */}
          {(() => {
            const current = INDUSTRIES[activeIndustry];
            return (
              <div className="rounded-2xl bg-[#0B100F] border border-[#26322C] p-6 sm:p-10 shadow-2xl transition-all duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                  {/* Left Column: Copy & Checklist */}
                  <div className="lg:col-span-6">
                    <span className="text-xs font-ibm uppercase tracking-wider text-[#00C987] block mb-2">
                      {current.tagline}
                    </span>
                    <h3 className="font-manrope font-extrabold text-2xl sm:text-3xl text-[#F4F5F1] tracking-tight mb-4">
                      {current.headline}
                    </h3>
                    <p className="text-sm sm:text-base text-[#A5B1AA] leading-relaxed mb-8">
                      {current.description}
                    </p>

                    <div className="space-y-3 mb-8">
                      {current.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <CheckCircle2 className="w-4 h-4 text-[#00C987] shrink-0 mt-0.5" />
                          <span className="text-xs sm:text-sm text-[#F4F5F1]">{feat}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => setDemoModalOpen(true)}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-manrope font-bold text-xs sm:text-sm text-[#050706] bg-[#F4F5F1] hover:bg-white transition-colors"
                    >
                      <span>Schedule {current.label} Demo</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Right Column: Real Industry POS Register Mockup */}
                  <div className="lg:col-span-6 bg-[#050706] rounded-xl border border-[#26322C] p-6">
                    {/* Header bar */}
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#26322C]">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-ibm font-bold text-[#F4F5F1]">
                          {current.label.toUpperCase()} WORKFLOW
                        </span>
                        <span className="text-[10px] font-ibm px-2 py-0.5 rounded bg-[#11211B] text-[#00C987] border border-[#26322C]">
                          {current.badge}
                        </span>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-[#00C987]" />
                    </div>

                    {/* Pre-loaded sample items */}
                    <div className="space-y-2 mb-6">
                      {current.posItemPreview.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-lg bg-[#11211B]/40 border border-[#26322C]/70 text-xs"
                        >
                          <div>
                            <span className="font-semibold text-[#F4F5F1] block">{item.name}</span>
                            <span className="text-[10px] text-[#A5B1AA] font-ibm">{item.sku}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono text-[#00C987] font-bold block">{item.price}</span>
                            <span className="text-[10px] text-[#A5B1AA]">Qty: {item.qty} · {item.tag}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Metrics verification row */}
                    <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[#26322C]">
                      {current.metrics.map((m, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-[#11211B]/30 border border-[#26322C] text-center">
                          <span className="text-xs sm:text-sm font-bold font-mono text-[#F4F5F1] block mb-0.5">
                            {m.value}
                          </span>
                          <span className="text-[10px] text-[#A5B1AA] block leading-tight">
                            {m.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* =========================================================================
          07 — MULTI-BRANCH OPERATIONS: ONE BUSINESS VIEW. EVERY LOCATION.
          Consolidated reporting, live inter-branch transfers, location price books.
          ========================================================================= */}
      <section id="branches" className="relative z-10 py-24 bg-[#0B100F] border-t border-[#26322C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-ibm uppercase tracking-widest text-[#00C987] mb-3 block">
              MULTI-LOCATION GOVERNANCE
            </span>
            <h2 className="font-manrope font-extrabold text-3xl sm:text-4xl text-[#F4F5F1] tracking-tight mb-5">
              One business view. Every location accounted for.
            </h2>
            <p className="text-base sm:text-lg text-[#A5B1AA]">
              See what is selling, understand where stock is moving, and compare branch performance
              without stitching together separate spreadsheets.
            </p>
          </div>

          {/* Multi-Branch Console Showcase */}
          <div className="rounded-2xl bg-[#050706] border border-[#26322C] p-6 sm:p-8 shadow-2xl">
            {/* Top Toolbar: Branch Selector & Global Filter */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-[#26322C]">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-[#00C987]" />
                <span className="font-manrope font-bold text-sm text-[#F4F5F1]">Consolidated Network Monitor</span>
                <span className="text-xs font-ibm px-2 py-0.5 rounded bg-[#11211B] text-[#00C987] border border-[#26322C]">
                  4 Active Branches
                </span>
              </div>
              <div className="text-xs font-ibm text-[#A5B1AA]">
                Fiscal Day: 22 Oct 2026 · Colombo HQ Realtime Sync
              </div>
            </div>

            {/* Branch Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Branch 1 */}
              <div className="p-4 rounded-xl bg-[#11211B]/40 border border-[#26322C]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-manrope font-bold text-xs text-[#F4F5F1]">Colombo 03 (Flagship)</span>
                  <span className="w-2 h-2 rounded-full bg-[#00C987]" />
                </div>
                <div className="text-lg font-mono font-bold text-[#F4F5F1] mb-1">LKR 482,900</div>
                <div className="flex items-center justify-between text-[11px] text-[#A5B1AA]">
                  <span>142 Transactions</span>
                  <span className="text-[#00C987]">+18.4% YoY</span>
                </div>
              </div>

              {/* Branch 2 */}
              <div className="p-4 rounded-xl bg-[#11211B]/40 border border-[#26322C]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-manrope font-bold text-xs text-[#F4F5F1]">Kandy City Centre</span>
                  <span className="w-2 h-2 rounded-full bg-[#00C987]" />
                </div>
                <div className="text-lg font-mono font-bold text-[#F4F5F1] mb-1">LKR 310,450</div>
                <div className="flex items-center justify-between text-[11px] text-[#A5B1AA]">
                  <span>96 Transactions</span>
                  <span className="text-[#00C987]">+8.2% YoY</span>
                </div>
              </div>

              {/* Branch 3 */}
              <div className="p-4 rounded-xl bg-[#11211B]/40 border border-[#26322C]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-manrope font-bold text-xs text-[#F4F5F1]">Galle Fort Outpost</span>
                  <span className="w-2 h-2 rounded-full bg-[#00C987]" />
                </div>
                <div className="text-lg font-mono font-bold text-[#F4F5F1] mb-1">LKR 245,800</div>
                <div className="flex items-center justify-between text-[11px] text-[#A5B1AA]">
                  <span>78 Transactions</span>
                  <span className="text-[#42C0C8]">+24.0% YoY</span>
                </div>
              </div>

              {/* Branch 4 */}
              <div className="p-4 rounded-xl bg-[#11211B]/40 border border-[#26322C]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-manrope font-bold text-xs text-[#F4F5F1]">Negombo Coastal Hub</span>
                  <span className="w-2 h-2 rounded-full bg-[#00C987]" />
                </div>
                <div className="text-lg font-mono font-bold text-[#F4F5F1] mb-1">LKR 189,200</div>
                <div className="flex items-center justify-between text-[11px] text-[#A5B1AA]">
                  <span>54 Transactions</span>
                  <span className="text-[#00C987]">+6.1% YoY</span>
                </div>
              </div>
            </div>

            {/* Inter-Branch Transfer Workflow Preview */}
            <div className="p-5 rounded-xl bg-[#11211B]/20 border border-[#26322C]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="w-4 h-4 text-[#42C0C8]" />
                  <span className="font-manrope font-bold text-xs sm:text-sm text-[#F4F5F1]">
                    Live Inter-Branch Stock Transfers (Zero-Discrepancy Dispatch)
                  </span>
                </div>
                <span className="text-[10px] font-ibm text-[#A5B1AA]">Auto-Deduction & Receive Handshake</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#26322C] text-[#A5B1AA] font-ibm text-[10px] uppercase">
                      <th className="py-2">Transfer Ref</th>
                      <th className="py-2">Origin Outlet</th>
                      <th className="py-2">Destination</th>
                      <th className="py-2">SKU & Batch Details</th>
                      <th className="py-2">Quantity</th>
                      <th className="py-2 text-right">Transfer Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#26322C]/60 text-[#F4F5F1]">
                    <tr>
                      <td className="py-3 font-mono text-[#00C987]">TRF-2026-0891</td>
                      <td className="py-3">Colombo HQ Warehouse</td>
                      <td className="py-3">Kandy City Centre</td>
                      <td className="py-3 text-[#A5B1AA]">Linen Shirts (RET-LSH-042)</td>
                      <td className="py-3 font-mono">40 Units</td>
                      <td className="py-3 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-ibm bg-[#00C987]/15 text-[#00C987]">
                          ✓ Received & Verified
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 font-mono text-[#00C987]">TRF-2026-0894</td>
                      <td className="py-3">Colombo HQ Warehouse</td>
                      <td className="py-3">Galle Fort Outpost</td>
                      <td className="py-3 text-[#A5B1AA]">Ceylon Tea Tins (TEA-OP-500)</td>
                      <td className="py-3 font-mono">100 Units</td>
                      <td className="py-3 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-ibm bg-amber-500/15 text-amber-400">
                          ⧗ In Transit (Driver Assigned)
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          08 — CONNECTED WORKFLOW: FROM PURCHASE ORDER TO DAILY CLOSE
          Horizontal process progression with thin emerald connecting line.
          ========================================================================= */}
      <section className="relative z-10 py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-xs font-ibm uppercase tracking-widest text-[#00C987] mb-3 block">
              OPERATIONAL LIFECYCLE
            </span>
            <h2 className="font-manrope font-extrabold text-3xl sm:text-4xl text-[#F4F5F1] tracking-tight mb-5">
              From purchase order to daily close.
            </h2>
            <p className="text-base sm:text-lg text-[#A5B1AA]">
              Four seamless stages that remove guesswork from your staff, ensure stock integrity,
              and balance cash drawers down to the exact rupee.
            </p>
          </div>

          {/* Connected Process Flow */}
          <div className="relative">
            {/* Connecting Emerald Line for Desktop */}
            <div
              className="hidden lg:block absolute top-1/2 left-0 right-0 h-[2px] -translate-y-1/2 z-0"
              style={{
                background: "linear-gradient(90deg, #26322C 0%, #00C987 50%, #26322C 100%)",
              }}
              aria-hidden="true"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
              {/* Step 1 */}
              <div className="p-6 rounded-xl bg-[#0B100F] border border-[#26322C] shadow-lg flex flex-col justify-between hover:border-[#00C987]/50 transition-colors">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-ibm font-bold text-xs text-[#00C987]">STAGE 01</span>
                    <Truck className="w-5 h-5 text-[#A5B1AA]" />
                  </div>
                  <h3 className="font-manrope font-bold text-base text-[#F4F5F1] mb-2">Purchase & GRN</h3>
                  <p className="text-xs text-[#A5B1AA] leading-relaxed">
                    Issue formal supplier purchase orders. Receive deliveries via Goods Received Notes with automated
                    cost variance checks.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#26322C] text-[11px] font-ibm text-[#00C987]">
                  → Cost Basis Logged
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-6 rounded-xl bg-[#0B100F] border border-[#26322C] shadow-lg flex flex-col justify-between hover:border-[#00C987]/50 transition-colors">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-ibm font-bold text-xs text-[#42C0C8]">STAGE 02</span>
                    <Warehouse className="w-5 h-5 text-[#A5B1AA]" />
                  </div>
                  <h3 className="font-manrope font-bold text-base text-[#F4F5F1] mb-2">Stock Allocation</h3>
                  <p className="text-xs text-[#A5B1AA] leading-relaxed">
                    Assign barcode labels, shelf locations, and batch expiry dates. Transfer needed units to store branches
                    instantly.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#26322C] text-[11px] font-ibm text-[#42C0C8]">
                  → FEFO Priority Armed
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-6 rounded-xl bg-[#0B100F] border border-[#26322C] shadow-lg flex flex-col justify-between hover:border-[#00C987]/50 transition-colors">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-ibm font-bold text-xs text-[#00C987]">STAGE 03</span>
                    <ShoppingBag className="w-5 h-5 text-[#A5B1AA]" />
                  </div>
                  <h3 className="font-manrope font-bold text-base text-[#F4F5F1] mb-2">Counter Checkout</h3>
                  <p className="text-xs text-[#A5B1AA] leading-relaxed">
                    Sub-second barcode scan, multi-tender split settlement, instant thermal receipt, and automatic customer
                    loyalty ledger.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#26322C] text-[11px] font-ibm text-[#00C987]">
                  → Live Stock Deducted
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-6 rounded-xl bg-[#0B100F] border border-[#26322C] shadow-lg flex flex-col justify-between hover:border-[#00C987]/50 transition-colors">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-ibm font-bold text-xs text-[#42C0C8]">STAGE 04</span>
                    <TrendingUp className="w-5 h-5 text-[#A5B1AA]" />
                  </div>
                  <h3 className="font-manrope font-bold text-base text-[#F4F5F1] mb-2">Close & P&L Audit</h3>
                  <p className="text-xs text-[#A5B1AA] leading-relaxed">
                    Count drawer cash against card settlement slips, lock the register shift, and generate automated
                    gross profit & tax reports.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#26322C] text-[11px] font-ibm text-[#42C0C8]">
                  → 100% Cash Matched
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          09 — REPORTING & BUSINESS CONTROL: KNOW THE NUMBERS BEHIND THE SALES
          Clean financial dashboard with 3 primary operational metrics.
          ========================================================================= */}
      <section className="relative z-10 py-24 bg-[#0B100F] border-t border-[#26322C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-ibm uppercase tracking-widest text-[#00C987] mb-3 block">
              EXECUTIVE INTELLIGENCE
            </span>
            <h2 className="font-manrope font-extrabold text-3xl sm:text-4xl text-[#F4F5F1] tracking-tight mb-5">
              Know the numbers behind the sales.
            </h2>
            <p className="text-base sm:text-lg text-[#A5B1AA]">
              Go beyond the total at the end of the day. Understand which products perform, where money is tied up
              in stock, and how each location is operating.
            </p>
          </div>

          {/* 3 Metric Cards Highlight */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="p-6 rounded-xl bg-[#050706] border border-[#26322C]">
              <span className="text-xs font-ibm text-[#A5B1AA] uppercase tracking-wider block mb-2">
                CONSOLIDATED NET REVENUE (TODAY)
              </span>
              <div className="text-3xl sm:text-4xl font-mono font-bold text-[#F4F5F1] mb-2">
                LKR 1,228,350
              </div>
              <div className="flex items-center gap-2 text-xs text-[#00C987]">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+14.6% vs same day last week</span>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-[#050706] border border-[#26322C]">
              <span className="text-xs font-ibm text-[#A5B1AA] uppercase tracking-wider block mb-2">
                WEIGHTED GROSS PROFIT MARGIN
              </span>
              <div className="text-3xl sm:text-4xl font-mono font-bold text-[#00C987] mb-2">
                42.8%
              </div>
              <div className="flex items-center gap-2 text-xs text-[#A5B1AA]">
                <span>COGS: LKR 702,616 · Gross Profit: LKR 525,734</span>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-[#050706] border border-[#26322C]">
              <span className="text-xs font-ibm text-[#A5B1AA] uppercase tracking-wider block mb-2">
                DRAWER CASH RECONCILIATION
              </span>
              <div className="text-3xl sm:text-4xl font-mono font-bold text-[#42C0C8] mb-2">
                LKR 0.00
              </div>
              <div className="flex items-center gap-2 text-xs text-[#00C987]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Zero discrepancy across 6 active shift registers</span>
              </div>
            </div>
          </div>

          {/* Audit Trail Note */}
          <div className="p-4 rounded-xl bg-[#11211B]/30 border border-[#26322C] text-xs text-[#A5B1AA] flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#00C987]" />
              <span>Full GAAP & IRD Sri Lanka compliant sales ledger with immutable transaction logs.</span>
            </div>
            <span className="font-ibm text-[#00C987]">Export to CSV, Excel, or PDF in 1 Click</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          10 — HARDWARE & PAYMENTS: BUILT AROUND THE WAY YOUR COUNTER WORKS
          Clear breakdown of verified compatible devices & payment channels.
          ========================================================================= */}
      <section id="hardware" className="relative z-10 py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-ibm uppercase tracking-widest text-[#00C987] mb-3 block">
              COUNTER COMPATIBILITY
            </span>
            <h2 className="font-manrope font-extrabold text-3xl sm:text-4xl text-[#F4F5F1] tracking-tight mb-5">
              Built around the way your counter works.
            </h2>
            <p className="text-base sm:text-lg text-[#A5B1AA]">
              Bring your checkout software together with the hardware and payment channels your store already trusts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Column 1: Supported Hardware */}
            <div className="p-8 rounded-2xl bg-[#0B100F] border border-[#26322C]">
              <div className="flex items-center gap-3 mb-6">
                <Printer className="w-6 h-6 text-[#00C987]" />
                <h3 className="font-manrope font-bold text-lg text-[#F4F5F1]">Supported Counter Hardware</h3>
              </div>
              <p className="text-xs sm:text-sm text-[#A5B1AA] mb-6 leading-relaxed">
                Plug-and-play operation with existing peripherals. Controlled by our lightweight Node/Desktop Print Bridge
                for rapid 0-click receipt dispatch.
              </p>
              <div className="space-y-3 text-xs sm:text-sm">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-[#050706] border border-[#26322C]">
                  <Check className="w-4 h-4 text-[#00C987] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#F4F5F1] block">80mm & 58mm Thermal Printers</span>
                    <span className="text-xs text-[#A5B1AA]">Epson, Rongta, Xprinter, Sunmi, Bixolon (USB / LAN / Bluetooth)</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-[#050706] border border-[#26322C]">
                  <Check className="w-4 h-4 text-[#00C987] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#F4F5F1] block">1D & 2D Barcode Scanners</span>
                    <span className="text-xs text-[#A5B1AA]">Honeywell, Zebra, Datalogic, wireless handheld & omni-directional</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-[#050706] border border-[#26322C]">
                  <Check className="w-4 h-4 text-[#00C987] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#F4F5F1] block">Automatic Cash Drawers</span>
                    <span className="text-xs text-[#A5B1AA]">Standard RJ11 / RJ12 kick-out triggered on receipt print</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-[#050706] border border-[#26322C]">
                  <Check className="w-4 h-4 text-[#00C987] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#F4F5F1] block">Customer Facing Secondary Displays</span>
                    <span className="text-xs text-[#A5B1AA]">Dual-screen Windows, iPad, or Android tablet basket monitors</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Supported Payment Gateways */}
            <div className="p-8 rounded-2xl bg-[#0B100F] border border-[#26322C]">
              <div className="flex items-center gap-3 mb-6">
                <CreditCard className="w-6 h-6 text-[#42C0C8]" />
                <h3 className="font-manrope font-bold text-lg text-[#F4F5F1]">Sri Lankan Payments & BNPL</h3>
              </div>
              <p className="text-xs sm:text-sm text-[#A5B1AA] mb-6 leading-relaxed">
                Accept every payment channel your customers prefer. Support split transactions on the same bill without
                complicating your reconciliation.
              </p>
              <div className="space-y-3 text-xs sm:text-sm">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-[#050706] border border-[#26322C]">
                  <Check className="w-4 h-4 text-[#42C0C8] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#F4F5F1] block">Cash & Credit/Debit Cards</span>
                    <span className="text-xs text-[#A5B1AA]">Compatible with Commercial Bank, HNB, Sampath, Seylan & Dialog terminals</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-[#050706] border border-[#26322C]">
                  <Check className="w-4 h-4 text-[#42C0C8] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#F4F5F1] block">LankaQR Instant Mobile Pay</span>
                    <span className="text-xs text-[#A5B1AA]">Dynamic QR generated on customer display for CBSL compliant payment</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-[#050706] border border-[#26322C]">
                  <Check className="w-4 h-4 text-[#42C0C8] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#F4F5F1] block">Buy Now Pay Later (BNPL)</span>
                    <span className="text-xs text-[#A5B1AA]">Koko, Mintpay, Onepay, Payzy integrated checkout workflows</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-[#050706] border border-[#26322C]">
                  <Check className="w-4 h-4 text-[#42C0C8] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#F4F5F1] block">Customer Store Credit & Ledger</span>
                    <span className="text-xs text-[#A5B1AA]">Credit customer accounts with automated repayment tracking and statements</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          11 — OPERATIONAL DIFFERENTIATION: LESS GUESSWORK. MORE CONTROL.
          Straightforward comparison table vs fragmented / disconnected workflows.
          ========================================================================= */}
      <section className="relative z-10 py-24 bg-[#0B100F] border-t border-[#26322C]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-ibm uppercase tracking-widest text-[#00C987] mb-3 block">
              WORKFLOW IMPROVEMENT
            </span>
            <h2 className="font-manrope font-extrabold text-3xl sm:text-4xl text-[#F4F5F1] tracking-tight mb-5">
              Less operational guesswork. More control.
            </h2>
            <p className="text-base text-[#A5B1AA]">
              See how moving to a connected POS workflow transforms daily retail and hospitality operations.
            </p>
          </div>

          <div className="rounded-2xl bg-[#050706] border border-[#26322C] overflow-hidden shadow-2xl">
            <div className="grid grid-cols-2 p-5 border-b border-[#26322C] bg-[#11211B]/40 font-manrope font-bold text-xs sm:text-sm">
              <span className="text-[#A5B1AA]">When operations rely on disconnected tools...</span>
              <span className="text-[#00C987]">With XONIT Connected POS Workflow</span>
            </div>

            <div className="divide-y divide-[#26322C]/60 text-xs sm:text-sm">
              <div className="grid grid-cols-2 p-5 gap-4">
                <span className="text-[#A5B1AA]">Separate Excel spreadsheets for store inventory</span>
                <span className="text-[#F4F5F1] font-medium flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#00C987] shrink-0" />
                  Inventory automatically deducted live as each barcode is scanned
                </span>
              </div>

              <div className="grid grid-cols-2 p-5 gap-4">
                <span className="text-[#A5B1AA]">Manually calculating gross margins at the end of the month</span>
                <span className="text-[#F4F5F1] font-medium flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#00C987] shrink-0" />
                  Realtime GAAP gross margins updated with every single transaction
                </span>
              </div>

              <div className="grid grid-cols-2 p-5 gap-4">
                <span className="text-[#A5B1AA]">Calling store branches to check if items are in stock</span>
                <span className="text-[#F4F5F1] font-medium flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#00C987] shrink-0" />
                  Single cross-branch lookup directly on the cashier counter screen
                </span>
              </div>

              <div className="grid grid-cols-2 p-5 gap-4">
                <span className="text-[#A5B1AA]">Repeated manual product and price entry at each shop</span>
                <span className="text-[#F4F5F1] font-medium flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#00C987] shrink-0" />
                  Centralized master catalogue with location-specific price books
                </span>
              </div>

              <div className="grid grid-cols-2 p-5 gap-4">
                <span className="text-[#A5B1AA]">Slow, laggy print dialogs interrupting counter queues</span>
                <span className="text-[#F4F5F1] font-medium flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#00C987] shrink-0" />
                  Instant zero-click hardware print bridge directly to ESC/POS thermal printer
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          12 — IMPLEMENTATION & SUPPORT: A SYSTEM YOUR TEAM CAN ACTUALLY USE
          Four numbered stages with onboarding clarity.
          ========================================================================= */}
      <section className="relative z-10 py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-ibm uppercase tracking-widest text-[#00C987] mb-3 block">
              ONBOARDING & HANDOVER
            </span>
            <h2 className="font-manrope font-extrabold text-3xl sm:text-4xl text-[#F4F5F1] tracking-tight mb-5">
              A system your team can actually start using.
            </h2>
            <p className="text-base sm:text-lg text-[#A5B1AA]">
              We don&apos;t just hand you a software login and leave. We guide you through four structured stages
              to ensure your cashiers and managers are 100% confident.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-xl bg-[#0B100F] border border-[#26322C]">
              <span className="font-ibm font-bold text-xs text-[#00C987] block mb-2">STAGE 01</span>
              <h3 className="font-manrope font-bold text-base text-[#F4F5F1] mb-2">Discovery & Audit</h3>
              <p className="text-xs text-[#A5B1AA] leading-relaxed">
                We review your product catalogue, existing printers, barcode scanners, and store counter arrangement.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#0B100F] border border-[#26322C]">
              <span className="font-ibm font-bold text-xs text-[#42C0C8] block mb-2">STAGE 02</span>
              <h3 className="font-manrope font-bold text-base text-[#F4F5F1] mb-2">Configuration & Import</h3>
              <p className="text-xs text-[#A5B1AA] leading-relaxed">
                We import your Excel catalogue, establish price books, format thermal receipts with your brand logo, and test hardware.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#0B100F] border border-[#26322C]">
              <span className="font-ibm font-bold text-xs text-[#00C987] block mb-2">STAGE 03</span>
              <h3 className="font-manrope font-bold text-base text-[#F4F5F1] mb-2">Staff Training</h3>
              <p className="text-xs text-[#A5B1AA] leading-relaxed">
                Hands-on training for cashiers, store supervisors, and managers with simulated checkout and return scenarios.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#0B100F] border border-[#26322C]">
              <span className="font-ibm font-bold text-xs text-[#42C0C8] block mb-2">STAGE 04</span>
              <h3 className="font-manrope font-bold text-base text-[#F4F5F1] mb-2">Go-Live & Hotline Support</h3>
              <p className="text-xs text-[#A5B1AA] leading-relaxed">
                We stand by during your store opening day, backed by dedicated WhatsApp and phone support with rapid response terms.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          13 — TRANSPARENT PRICING IN SRI LANKAN RUPEES (LKR)
          Annual / Monthly toggle, realistic inclusions, no hidden surprises.
          ========================================================================= */}
      <section id="pricing" className="relative z-10 py-24 bg-[#0B100F] border-t border-[#26322C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-ibm uppercase tracking-widest text-[#00C987] mb-3 block">
              TRANSPARENT PLANS
            </span>
            <h2 className="font-manrope font-extrabold text-3xl sm:text-4xl text-[#F4F5F1] tracking-tight mb-5">
              Start with what your business needs.
            </h2>
            <p className="text-base sm:text-lg text-[#A5B1AA]">
              Honest pricing in Sri Lankan Rupees. No foreign exchange currency surprises, no hidden per-receipt charges.
            </p>

            {/* Billing Interval Toggle */}
            <div className="inline-flex items-center gap-3 p-1 rounded-full bg-[#050706] border border-[#26322C] mt-8">
              <button
                onClick={() => setBillingCycle("annual")}
                className={`px-5 py-2 rounded-full text-xs font-manrope font-bold transition-all ${
                  billingCycle === "annual"
                    ? "bg-[#11211B] text-[#00C987] border border-[#00C987]/30 shadow"
                    : "text-[#A5B1AA] hover:text-[#F4F5F1]"
                }`}
              >
                Annual Billing (Save 20%)
              </button>
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-5 py-2 rounded-full text-xs font-manrope font-bold transition-all ${
                  billingCycle === "monthly"
                    ? "bg-[#11211B] text-[#00C987] border border-[#00C987]/30 shadow"
                    : "text-[#A5B1AA] hover:text-[#F4F5F1]"
                }`}
              >
                Monthly Billing
              </button>
            </div>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
            {/* Single Store Tier */}
            <div className="p-8 rounded-2xl bg-[#050706] border border-[#26322C] flex flex-col justify-between hover:border-[#26322C]/90 transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-manrope font-bold text-base text-[#F4F5F1]">Single Store</span>
                  <span className="text-[10px] font-ibm px-2.5 py-0.5 rounded bg-[#11211B] text-[#A5B1AA]">
                    1 Location
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl sm:text-4xl font-mono font-bold text-[#F4F5F1]">
                    {formatLKR(getPrice(4500))}
                  </span>
                  <span className="text-xs text-[#A5B1AA]">/ month</span>
                </div>
                <p className="text-xs text-[#A5B1AA] leading-relaxed mb-6">
                  Perfect for independent retail boutiques, single cafes, neighbourhood pharmacies, and salons.
                </p>
                <div className="space-y-3 text-xs text-[#F4F5F1] mb-8">
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#00C987] shrink-0" />
                    <span>1 Store Branch / Outlet</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#00C987] shrink-0" />
                    <span>Up to 2 Cashier & Manager logins</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#00C987] shrink-0" />
                    <span>80mm & 58mm Thermal Print Bridge</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#00C987] shrink-0" />
                    <span>Barcode scanning & product catalogue</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#00C987] shrink-0" />
                    <span>Free Excel inventory data import</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setDemoModalOpen(true)}
                className="w-full py-3 rounded-xl font-manrope font-bold text-xs text-[#F4F5F1] bg-[#11211B] hover:bg-[#11211B]/80 border border-[#26322C] transition-colors"
              >
                Choose Single Store
              </button>
            </div>

            {/* Growing Business Tier (Featured) */}
            <div className="p-8 rounded-2xl bg-gradient-to-b from-[#11211B]/80 to-[#050706] border-2 border-[#00C987]/60 shadow-2xl shadow-[#00C987]/10 flex flex-col justify-between relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#00C987] text-[#050706] font-manrope font-extrabold text-[10px] uppercase tracking-wider shadow">
                Most Popular in Sri Lanka
              </div>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-manrope font-bold text-base text-[#00C987]">Growing Business</span>
                  <span className="text-[10px] font-ibm px-2.5 py-0.5 rounded bg-[#00C987]/20 text-[#00C987]">
                    Multi-Branch
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl sm:text-4xl font-mono font-bold text-[#F4F5F1]">
                    {formatLKR(getPrice(9500))}
                  </span>
                  <span className="text-xs text-[#A5B1AA]">/ month</span>
                </div>
                <p className="text-xs text-[#A5B1AA] leading-relaxed mb-6">
                  For growing businesses expanding across 2-3 outlets requiring live inventory transfers and consolidated reporting.
                </p>
                <div className="space-y-3 text-xs text-[#F4F5F1] mb-8">
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#00C987] shrink-0" />
                    <span>Up to 3 Branches included</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#00C987] shrink-0" />
                    <span>Up to 10 Cashier & Staff logins</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#00C987] shrink-0" />
                    <span>Inter-branch stock transfer requests</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#00C987] shrink-0" />
                    <span>KOT restaurant routing or FEFO batch control</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#00C987] shrink-0" />
                    <span>Customer credit accounts & statements</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#00C987] shrink-0" />
                    <span>Realtime GAAP gross margin P&L reporting</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setDemoModalOpen(true)}
                className="w-full py-3.5 rounded-xl font-manrope font-bold text-xs text-[#050706] bg-[#00C987] hover:bg-[#00C987]/90 shadow-lg shadow-[#00C987]/20 transition-all"
              >
                Start with Growing Business
              </button>
            </div>

            {/* Enterprise Tier */}
            <div className="p-8 rounded-2xl bg-[#050706] border border-[#26322C] flex flex-col justify-between hover:border-[#26322C]/90 transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-manrope font-bold text-base text-[#F4F5F1]">Multi-Branch & Enterprise</span>
                  <span className="text-[10px] font-ibm px-2.5 py-0.5 rounded bg-[#11211B] text-[#A5B1AA]">
                    Unlimited
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl sm:text-4xl font-mono font-bold text-[#F4F5F1]">
                    {formatLKR(getPrice(18500))}
                  </span>
                  <span className="text-xs text-[#A5B1AA]">/ month</span>
                </div>
                <p className="text-xs text-[#A5B1AA] leading-relaxed mb-6">
                  Wholesale distributors, retail supermarket networks, and pharmacy chains with dedicated hardware fleets.
                </p>
                <div className="space-y-3 text-xs text-[#F4F5F1] mb-8">
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#00C987] shrink-0" />
                    <span>Unlimited Branches & POS Terminals</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#00C987] shrink-0" />
                    <span>Unlimited staff roles & granular permission levels</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#00C987] shrink-0" />
                    <span>Purchase order approvals & supplier ledgers</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#00C987] shrink-0" />
                    <span>Custom payment gateway webhooks & ERP sync</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#00C987] shrink-0" />
                    <span>24/7 Priority telephone & WhatsApp support</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setDemoModalOpen(true)}
                className="w-full py-3 rounded-xl font-manrope font-bold text-xs text-[#F4F5F1] bg-[#11211B] hover:bg-[#11211B]/80 border border-[#26322C] transition-colors"
              >
                Contact Enterprise Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          14 — PRACTICAL FAQ ACCORDION
          Accessible expand/collapse answering real Sri Lankan business questions.
          ========================================================================= */}
      <section id="faq" className="relative z-10 py-24 sm:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-ibm uppercase tracking-widest text-[#00C987] mb-3 block">
              QUESTIONS ANSWERED
            </span>
            <h2 className="font-manrope font-extrabold text-3xl sm:text-4xl text-[#F4F5F1] tracking-tight mb-5">
              Frequently asked questions.
            </h2>
            <p className="text-base text-[#A5B1AA]">
              Straightforward answers to the practical questions retail and hospitality owners ask us every day.
            </p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl bg-[#0B100F] border border-[#26322C] overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-5 text-left font-manrope font-bold text-sm sm:text-base text-[#F4F5F1] hover:text-[#00C987] transition-colors focus:outline-none"
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-[#A5B1AA] shrink-0 transition-transform duration-200 ml-4 ${
                        isOpen ? "rotate-180 text-[#00C987]" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-[#A5B1AA] leading-relaxed border-t border-[#26322C]/50 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          15 — FINAL DEMO CONVERSION CTA & ACCESSIBLE BOOKING TRIGGER
          High-contrast conversion unit with live demo modal.
          ========================================================================= */}
      <section className="relative z-10 py-24 bg-[#0B100F] border-t border-[#26322C]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="p-10 sm:p-16 rounded-3xl bg-gradient-to-b from-[#11211B] via-[#0B100F] to-[#050706] border border-[#00C987]/30 shadow-2xl relative overflow-hidden">
            {/* Emerald glow highlight */}
            <div
              className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 rounded-full filter blur-[80px] opacity-25 pointer-events-none"
              style={{ background: "#00C987" }}
            />

            <span className="text-xs font-ibm uppercase tracking-widest text-[#00C987] mb-3 block">
              SCHEDULE YOUR WORKFLOW REVIEW
            </span>
            <h2 className="font-manrope font-extrabold text-3xl sm:text-5xl text-[#F4F5F1] tracking-tight mb-6">
              See how XONIT fits your business.
            </h2>
            <p className="text-base sm:text-lg text-[#A5B1AA] max-w-2xl mx-auto leading-relaxed mb-10">
              Bring your current store workflow, the pain points you&apos;re facing, and the questions your team needs
              answered. We&apos;ll walk you through the live platform on your own terms.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setDemoModalOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-xl font-manrope font-bold text-sm sm:text-base text-[#050706] bg-[#F4F5F1] hover:bg-white shadow-xl hover:shadow-[#00C987]/20 transition-all duration-200"
              >
                <span>Book a Live Demo</span>
                <ArrowUpRight className="w-4 h-4 ml-2" />
              </button>
              <a
                href="https://wa.me/94771234567"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-4 rounded-xl font-medium text-sm sm:text-base text-[#F4F5F1] bg-[#11211B] hover:bg-[#11211B]/80 border border-[#26322C] transition-colors"
              >
                <span>Talk to our Team via WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FOOTER: LEGAL, LINKS & COLOMBO ADDRESS
          Restrained, clean, enterprise finish.
          ========================================================================= */}
      <footer className="relative z-10 border-t border-[#26322C] bg-[#050706] py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            {/* Col 1: Brand & Colombo Headquarters */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src="/logo/xonit-white-trimmed.png"
                  alt="XONIT POS Logo"
                  width={30}
                  height={30}
                  className="object-contain"
                />
                <span className="font-manrope font-extrabold text-base text-[#F4F5F1]">
                  XONIT POS
                </span>
              </div>
              <p className="text-xs text-[#A5B1AA] max-w-sm leading-relaxed mb-4">
                Universal Cloud POS, Multi-Branch Inventory & Enterprise Management Platform engineered for
                Sri Lankan retail, hospitality, healthcare, and wholesale businesses.
              </p>
              <div className="flex items-center gap-2 text-xs font-ibm text-[#A5B1AA]">
                <MapPin className="w-3.5 h-3.5 text-[#00C987]" />
                <span>XONIT SPACE TECHNOLOGIES (PVT) LTD · Colombo, Sri Lanka</span>
              </div>
            </div>

            {/* Col 2: Solutions Navigation */}
            <div>
              <span className="font-manrope font-bold text-xs text-[#F4F5F1] uppercase tracking-wider block mb-4">
                Solutions
              </span>
              <ul className="space-y-2 text-xs text-[#A5B1AA]">
                <li>
                  <button onClick={() => { setActiveIndustry("retail"); window.location.hash = "solutions"; }} className="hover:text-[#00C987] transition-colors">
                    Retail & Apparel POS
                  </button>
                </li>
                <li>
                  <button onClick={() => { setActiveIndustry("restaurants"); window.location.hash = "solutions"; }} className="hover:text-[#00C987] transition-colors">
                    Restaurant & KOT Suite
                  </button>
                </li>
                <li>
                  <button onClick={() => { setActiveIndustry("pharmacies"); window.location.hash = "solutions"; }} className="hover:text-[#00C987] transition-colors">
                    Pharmacy FEFO Dispensing
                  </button>
                </li>
                <li>
                  <button onClick={() => { setActiveIndustry("salons"); window.location.hash = "solutions"; }} className="hover:text-[#00C987] transition-colors">
                    Salon & Spa Commission
                  </button>
                </li>
                <li>
                  <button onClick={() => { setActiveIndustry("wholesale"); window.location.hash = "solutions"; }} className="hover:text-[#00C987] transition-colors">
                    Wholesale B2B Distribution
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Resources & System Links */}
            <div>
              <span className="font-manrope font-bold text-xs text-[#F4F5F1] uppercase tracking-wider block mb-4">
                Platform
              </span>
              <ul className="space-y-2 text-xs text-[#A5B1AA]">
                <li>
                  <Link href="/login" className="hover:text-[#00C987] transition-colors">
                    Cashier Terminal Login
                  </Link>
                </li>
                <li>
                  <a href="#hardware" className="hover:text-[#00C987] transition-colors">
                    Hardware Bridge Client
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-[#00C987] transition-colors">
                    LKR Subscriptions
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-[#00C987] transition-colors">
                    Implementation FAQ
                  </a>
                </li>
                <li>
                  <span className="text-slate-500">API Documentation (Enterprise)</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Legal Strip */}
          <div className="pt-8 border-t border-[#26322C] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#A5B1AA]">
            <span>© 2026 XONIT SPACE TECHNOLOGIES (PVT) LTD. All rights reserved.</span>
            <div className="flex items-center gap-6">
              <span className="hover:text-[#F4F5F1] transition-colors cursor-pointer">Privacy Policy</span>
              <span className="hover:text-[#F4F5F1] transition-colors cursor-pointer">Terms of Service</span>
              <span className="text-[#00C987] font-ibm">System Operational (99.98%)</span>
            </div>
          </div>
        </div>
      </footer>

      {/* =========================================================================
          INTERACTIVE DEMO REQUEST DIALOG MODAL
          Accessible keyboard modal for scheduling a guided product walkthrough.
          ========================================================================= */}
      {demoModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="demo-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="relative w-full max-w-lg rounded-2xl bg-[#0B100F] border border-[#26322C] p-6 sm:p-8 shadow-2xl">
            {/* Close button */}
            <button
              onClick={() => {
                setDemoModalOpen(false);
                setDemoSubmitted(false);
              }}
              className="absolute top-4 right-4 p-2 text-[#A5B1AA] hover:text-[#F4F5F1] rounded-lg hover:bg-[#11211B] transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            {!demoSubmitted ? (
              <div>
                <span className="text-xs font-ibm uppercase tracking-widest text-[#00C987] mb-2 block">
                  BOOK A LIVE DEMO
                </span>
                <h3 id="demo-modal-title" className="font-manrope font-extrabold text-2xl text-[#F4F5F1] mb-2">
                  See XONIT in action with your team.
                </h3>
                <p className="text-xs sm:text-sm text-[#A5B1AA] mb-6">
                  We&apos;ll schedule a 20-minute tailored walkthrough focused on your specific retail, restaurant,
                  pharmacy, or wholesale requirements.
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setDemoSubmitted(true);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label htmlFor={nameId} className="block text-xs font-medium text-[#F4F5F1] mb-1">
                      Your Name / Business Owner *
                    </label>
                    <input
                      id={nameId}
                      required
                      type="text"
                      placeholder="e.g. Asitha Bandara"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#050706] border border-[#26322C] text-sm text-[#F4F5F1] placeholder-[#A5B1AA]/50 focus:outline-none focus:border-[#00C987]"
                    />
                  </div>

                  <div>
                    <label htmlFor={phoneId} className="block text-xs font-medium text-[#F4F5F1] mb-1">
                      WhatsApp / Mobile Contact Number *
                    </label>
                    <input
                      id={phoneId}
                      required
                      type="tel"
                      placeholder="+94 77 000 0000"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#050706] border border-[#26322C] text-sm text-[#F4F5F1] placeholder-[#A5B1AA]/50 focus:outline-none focus:border-[#00C987]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor={businessTypeId} className="block text-xs font-medium text-[#F4F5F1] mb-1">
                        Business Type
                      </label>
                      <select
                        id={businessTypeId}
                        className="w-full px-3 py-2.5 rounded-lg bg-[#050706] border border-[#26322C] text-xs text-[#F4F5F1] focus:outline-none focus:border-[#00C987]"
                      >
                        <option value="retail">Retail & Apparel</option>
                        <option value="restaurant">Restaurant / Cafe</option>
                        <option value="pharmacy">Pharmacy & Health</option>
                        <option value="salon">Salon & Spa</option>
                        <option value="wholesale">Wholesale & Trade</option>
                        <option value="other">Other / Multi-Store</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor={locationId} className="block text-xs font-medium text-[#F4F5F1] mb-1">
                        Location / District
                      </label>
                      <input
                        id={locationId}
                        type="text"
                        placeholder="e.g. Colombo, Kandy"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-[#050706] border border-[#26322C] text-sm text-[#F4F5F1] placeholder-[#A5B1AA]/50 focus:outline-none focus:border-[#00C987]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl font-manrope font-bold text-sm text-[#050706] bg-[#00C987] hover:bg-[#00C987]/90 shadow-lg shadow-[#00C987]/20 transition-all mt-2"
                  >
                    Confirm Demo Request
                  </button>
                </form>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-[#00C987]/20 text-[#00C987] flex items-center justify-center mx-auto mb-4">
                  <Check className="w-6 h-6" />
                </div>
                <h3 className="font-manrope font-bold text-xl text-[#F4F5F1] mb-2">
                  Thank You! Demo Scheduled.
                </h3>
                <p className="text-xs sm:text-sm text-[#A5B1AA] max-w-sm mx-auto mb-6">
                  Our product specialist will reach out to you via WhatsApp / phone to confirm your preferred session time.
                </p>
                <button
                  onClick={() => {
                    setDemoModalOpen(false);
                    setDemoSubmitted(false);
                  }}
                  className="px-6 py-2.5 rounded-lg font-manrope font-semibold text-xs text-[#F4F5F1] bg-[#11211B] border border-[#26322C] hover:border-[#00C987]"
                >
                  Close Window
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
