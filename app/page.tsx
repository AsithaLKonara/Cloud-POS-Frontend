"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Zap,
  ShieldCheck,
  Building2,
  Store,
  Layers,
  Printer,
  ShoppingBag,
  Utensils,
  Scissors,
  Pill,
  Apple,
  Truck,
  CreditCard,
  QrCode,
  Scale,
  Barcode,
  TrendingUp,
  Cpu,
  Monitor,
  ChevronRight,
  Star,
  Check,
  Sliders,
  DollarSign,
  HelpCircle,
} from "lucide-react";

export default function LandingPage() {
  // Cursor coordinate tracking for Layer 1 interactive ambient glow
  const [mousePos, setMousePos] = useState({ x: 50, y: 30 });
  const [scrollY, setScrollY] = useState(0);

  // Billing interval toggle (Monthly, Quarterly, Annual)
  const [billingCycle, setBillingCycle] = useState<"monthly" | "quarterly" | "annual">("annual");

  // Active solution tab
  const [activeSolution, setActiveSolution] = useState<"retail" | "restaurant" | "salon" | "pharmacy" | "grocery" | "wholesale">("restaurant");

  // Track scroll position for smooth layer translations
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Track mouse position smoothly
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY, currentTarget } = e;
    const { width, height, left, top } = currentTarget.getBoundingClientRect();
    const x = ((clientX - left) / width) * 100;
    const y = ((clientY - top) / height) * 100;
    setMousePos({ x, y });
  };

  // Pricing calculations in LKR
  const getPlanPrice = (monthlyLkr: number) => {
    if (billingCycle === "annual") {
      // 20% discount on annual
      return Math.round(monthlyLkr * 0.8);
    }
    if (billingCycle === "quarterly") {
      // 10% discount on quarterly
      return Math.round(monthlyLkr * 0.9);
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
      className="min-h-screen bg-black text-white relative selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden font-sans"
    >
      {/* =========================================================================
          GLOBAL PUBLIC SAAS BACKGROUND: Gradient Wallpapers.png + Figma Glows
          ========================================================================= */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <Image
          src="/gradient-wallpaper.png"
          alt="Global SaaS Wallpaper"
          fill
          priority
          className="object-cover object-center opacity-85"
        />
        {/* Figma Blue/Indigo Linear Gradient Overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(360deg, rgba(0, 57, 214, 0.38) 0%, rgba(0, 0, 98, 0.25) 50%, rgba(0, 0, 0, 0.6) 100%)",
          }}
        />
        {/* Figma Cyan Glow Union Layer */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(59.85% 59.85% at 54.97% 40.15%, rgba(66, 192, 200, 0.35) 0%, rgba(66, 192, 200, 0) 100%)",
          }}
        />
        {/* Ambient Dark Scrim for High-Contrast Readability */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* =========================================================================
          FIGMA HERO NAVBAR (Frame 21): Full Glass Capsule Header
          width: 1041px; height: 64px; top: 26px; border-radius: 1000px;
          ========================================================================= */}
      <header className="fixed top-5 sm:top-[26px] left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[1041px] h-16 sm:h-[64px] z-50">
        <div className="w-full h-full rounded-full bg-black/40 backdrop-blur-2xl border border-white/[0.14] shadow-[0_8px_32px_rgba(0,0,0,0.65)] px-4 sm:px-8 flex items-center justify-between">
          {/* Frame 16: Brand Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <Image
              src="/logo/xonit-white-trimmed.png"
              alt="XONIT Space"
              width={110}
              height={24}
              priority
              className="h-6 sm:h-7 w-auto object-contain brightness-125 group-hover:opacity-90 transition-opacity"
            />
          </Link>

          {/* Frame 17: Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-3">
            <a
              href="#hero"
              className="px-3.5 py-1.5 rounded-full text-sm lg:text-[15px] font-inter font-normal text-white transition-all bg-white/10"
            >
              Overview
            </a>
            <a
              href="#solutions"
              className="px-3.5 py-1.5 rounded-full text-sm lg:text-[15px] font-inter font-normal text-white/80 hover:text-white hover:bg-white/5 transition-all"
            >
              Solutions
            </a>
            <a
              href="#hardware"
              className="px-3.5 py-1.5 rounded-full text-sm lg:text-[15px] font-inter font-normal text-white/80 hover:text-white hover:bg-white/5 transition-all"
            >
              Hardware
            </a>
            <a
              href="#fintech"
              className="px-3.5 py-1.5 rounded-full text-sm lg:text-[15px] font-inter font-normal text-white/80 hover:text-white hover:bg-white/5 transition-all"
            >
              Sri Lanka Fintech
            </a>
            <a
              href="#pricing"
              className="px-3.5 py-1.5 rounded-full text-sm lg:text-[15px] font-inter font-normal text-white/80 hover:text-white hover:bg-white/5 transition-all"
            >
              Pricing
            </a>
          </nav>

          {/* Frame 20: Right Action Buttons */}
          <div className="flex items-center gap-3 sm:gap-6 shrink-0">
            <Link
              href="/login"
              className="text-white hover:text-white/80 font-inter text-sm sm:text-base font-normal px-2 py-1 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="bg-white hover:bg-slate-100 text-black font-inter text-sm sm:text-base font-normal px-5 sm:px-6 py-2 sm:py-2.5 rounded-[24px] shadow-lg shadow-white/10 active:scale-95 transition-all"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      {/* =========================================================================
          FIGMA HERO SECTION (MacBook Air - 3): Exact Figma Geometry & Hierarchy
          width: 1280px; height: 832px;
          ========================================================================= */}
      <section
        id="hero"
        className="relative w-full min-h-[832px] lg:h-[832px] max-w-[1280px] mx-auto flex flex-col items-center justify-center overflow-hidden px-4 pt-24 sm:pt-28 pb-12 sm:pb-16 z-10"
      >
        {/* Frame 15: Giant Background XONIT Typography */}
        <div className="absolute top-[32%] sm:top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none z-0 w-full text-center">
          <span
            className="font-inter font-black text-[clamp(80px,20vw,300px)] leading-none text-transparent bg-clip-text block tracking-tight drop-shadow-[0_20px_50px_rgba(0,0,0,0.85)]"
            style={{
              background:
                "linear-gradient(180deg, rgba(255, 255, 255, 0.68) 30.77%, rgba(153, 153, 153, 0) 79.33%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            XONIT
          </span>
        </div>

        {/* Frame 14: Floating Graphite Laptop Mockup with Figma Gradient & 4.45px Blur */}
        <div className="relative z-10 w-full flex items-center justify-center">
          <div className="relative w-full max-w-[860px] lg:max-w-[1020px] aspect-[16/10] h-[36vh] sm:h-[46vh] lg:h-[510px] flex items-center justify-center">
            <Image
              src="/floating-laptop-mockup.png"
              alt="Floating Graphite Laptop POS Mockup"
              fill
              sizes="(max-width: 1024px) 100vw, 1020px"
              priority
              className="object-contain filter blur-[2px] sm:blur-[4.45px] drop-shadow-[0_30px_70px_rgba(0,0,0,0.95)]"
            />
            {/* Figma Dark Linear Gradient Mask */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(180deg, rgba(0, 0, 0, 0) 32.21%, rgba(0, 0, 0, 0.91) 84.13%)",
              }}
            />
          </div>
        </div>

        {/* Frame 22: Content Container Overlapping the Laptop Palm Rest */}
        <div className="relative z-20 flex flex-col items-center justify-center text-center max-w-[866px] mx-auto -mt-16 sm:-mt-24 lg:-mt-32 px-4">
          {/* Headline in IBM Plex Mono 700 bold */}
          <h1 className="font-ibm font-bold text-3xl sm:text-5xl lg:text-[48px] text-white leading-tight lg:leading-[62px] text-center drop-shadow-[0_4px_30px_rgba(0,0,0,0.95)] max-w-[846px]">
            One Enterprise Platform. <br />
            Any Business in Sri Lanka.
          </h1>

          {/* Subtitle in Inter 400 normal */}
          <p className="mt-4 sm:mt-5 font-inter font-normal text-sm sm:text-lg lg:text-[20px] text-white leading-relaxed lg:leading-[26px] max-w-[670px] text-center drop-shadow-md">
            From high-volume fashion boutiques and dine-in restaurants to luxury salons, pharmacies, and wholesale depots. Fast cashier checkout, live multi-branch inventory, and automated GAAP accounting.
          </p>

          {/* Frame 20: CTA Buttons */}
          <div className="mt-6 sm:mt-8 flex items-center justify-center gap-6">
            <Link
              href="/login"
              className="font-inter font-normal text-base sm:text-[20px] leading-[24px] text-white hover:text-white/80 px-4 py-2 transition-colors"
            >
              Sign in
            </Link>

            <Link
              href="/login"
              className="font-inter font-normal text-base sm:text-[20px] leading-[24px] bg-white hover:bg-slate-100 text-black px-7 sm:px-8 py-2.5 sm:py-3 rounded-[24px] shadow-xl shadow-white/10 active:scale-95 transition-all"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: INDUSTRY SOLUTIONS (Turnkey presets for Sri Lanka)
          ========================================================================= */}
      <section id="solutions" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs uppercase font-mono tracking-widest text-cyan-400 font-bold">
            Universal Adaptability
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mt-2">
            Tailored Industry Blueprints.
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-3 leading-relaxed">
            No two businesses operate alike. XONIT automatically configures your categories, stock behavior, and checkout screens based on your business type.
          </p>

          {/* Industry Archetype Selector Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
            {[
              { id: "retail", label: "Retail & Apparel", icon: ShoppingBag },
              { id: "restaurant", label: "Restaurant & Cafe", icon: Utensils },
              { id: "salon", label: "Salon & Spa", icon: Scissors },
              { id: "pharmacy", label: "Pharmacy & Clinic", icon: Pill },
              { id: "grocery", label: "Grocery & Mart", icon: Apple },
              { id: "wholesale", label: "Wholesale & Depots", icon: Truck },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSolution === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSolution(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/20"
                      : "bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Solution Card */}
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-xl">
          {activeSolution === "restaurant" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  FOOD & BEVERAGE ENGINE
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white mt-3">
                  Table Layouts, KOT Printing & Split Bill Perfection.
                </h3>
                <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                  Route food orders directly to kitchen printers, manage dining room floors (Main, Patio, Bar, VIP), split checks evenly across N guests, and handle take-away vs dine-in taxes seamlessly.
                </p>

                <div className="grid grid-cols-2 gap-4 mt-6 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Multi-printer KOT routing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>N-way split bills with exact cents</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Modifiers (Extra cheese, spice level)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Waiter & table occupation map</span>
                  </div>
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 font-mono text-xs text-slate-300">
                <span className="text-amber-400 font-bold block mb-2">HOTEL & CAFE FLOOR MAP</span>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    <span className="font-bold block">Table 01</span>
                    <span className="text-[10px]">Available</span>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    <span className="font-bold block">Table 02</span>
                    <span className="text-[10px]">Occupied (4 pax)</span>
                  </div>
                  <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                    <span className="font-bold block">Table 03</span>
                    <span className="text-[10px]">Bill Requested</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSolution === "retail" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  RETAIL & APPAREL BOUTIQUES
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white mt-3">
                  Matrix Variants, Barcode Labels & Multi-Branch Allocations.
                </h3>
                <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                  Manage clothing matrices (Sizes: XS–XXL, Colors, Fabrics), generate thermal barcode stickers, track low inventory, and transfer stock between outlets with transit audit trails.
                </p>
                <div className="grid grid-cols-2 gap-4 mt-6 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Variant matrices (Size/Color)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Automated stock transfer slips</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Instant barcode scanning</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Customer credit & store debt ledger</span>
                  </div>
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 font-mono text-xs text-slate-300">
                <span className="text-purple-400 font-bold block mb-2">VARIANT MATRIX ENGINE</span>
                <div className="space-y-2">
                  <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
                    <span>Linen Shirt [Navy / M]</span>
                    <span className="text-cyan-400 font-bold">Qty: 42 in CMB</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
                    <span>Linen Shirt [Navy / L]</span>
                    <span className="text-cyan-400 font-bold">Qty: 18 in KDY</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800">
                    <span>Linen Shirt [White / XL]</span>
                    <span className="text-amber-400 font-bold">Low Stock: 2</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSolution === "salon" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  SALON, SPA & WELLNESS
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white mt-3">
                  Non-Tracked Services, Stylist Attributions & Tip Splitting.
                </h3>
                <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                  Haircuts and spa massages don't deplete physical warehouse stock. XONIT automatically skips stock reduction for services, calculates stylist commission, and manages chair schedules.
                </p>
                <div className="grid grid-cols-2 gap-4 mt-6 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Zero physical inventory deduction</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Stylist & practitioner line items</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Appointment duration & slips</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Birthday loyalty multipliers</span>
                  </div>
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 font-mono text-xs text-slate-300">
                <span className="text-rose-400 font-bold block mb-2">SERVICE LINE ATTRIBUTION</span>
                <div className="p-3 rounded bg-slate-900 border border-slate-800 space-y-1.5">
                  <div className="flex justify-between text-white font-bold">
                    <span>Signature Balayage & Cut</span>
                    <span>Rs. 12,500.00</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Attributed Stylist: Anuki F.</span>
                    <span className="text-emerald-400">Commission: 25%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSolution === "pharmacy" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  PHARMACIES & HEALTHCARE CLINICS
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white mt-3">
                  FEFO Batch Tracking, Expiry Auditing & Generic Search.
                </h3>
                <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                  Ensure patient safety with automated First-Expired, First-Out (FEFO) dispensing, batch recall tracking, expiry notifications, and generic chemical drug matching.
                </p>
                <div className="grid grid-cols-2 gap-4 mt-6 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>FEFO & FIFO batch allocation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>60/30/15 day expiry alerts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Generic composition matching</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Purchase order cost recalculation</span>
                  </div>
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 font-mono text-xs text-slate-300">
                <span className="text-emerald-400 font-bold block mb-2">FEFO LOT EXPIRY STATUS</span>
                <div className="p-3 rounded bg-slate-900 border border-slate-800 space-y-1.5">
                  <div className="flex justify-between text-white font-bold">
                    <span>Amoxicillin 250mg [Batch #AMX-901]</span>
                    <span className="text-emerald-400">Exp: Dec 2027</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Current Qty: 320 strips</span>
                    <span>Status: Healthy</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSolution === "grocery" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  GROCERY & SUPERMARKETS
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white mt-3">
                  Digital Scale Sync, Price-Embedded Barcodes & High Traffic.
                </h3>
                <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                  Process produce by weight instantly via RS-232 weighing scale bridge, decode GS1 and embedded weight barcodes, and maintain sub-second queue velocity.
                </p>
                <div className="grid grid-cols-2 gap-4 mt-6 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Live RS-232 scale weight capture</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Price-embedded barcode parsing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Rapid PLU speed lookups</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Daily spillage & waste logging</span>
                  </div>
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 font-mono text-xs text-slate-300">
                <span className="text-teal-400 font-bold block mb-2">SCALE HARDWARE STREAM</span>
                <div className="p-3 rounded bg-slate-900 border border-slate-800 text-center">
                  <span className="text-slate-400 block text-[11px]">LIVE RS-232 READING</span>
                  <span className="text-2xl font-black text-white block my-1 font-mono">1.450 KG</span>
                  <span className="text-cyan-400 text-xs font-bold">Avocado Grade A @ Rs. 850/kg = Rs. 1,232.50</span>
                </div>
              </div>
            </div>
          )}

          {activeSolution === "wholesale" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  WHOLESALE & DISTRIBUTION DEPOTS
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white mt-3">
                  Credit Limits, Repayment Ledgers & Inward PO Receiving.
                </h3>
                <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                  Sell goods on 30/60-day credit with automated limit caps. Record partial debt settlements, calculate supplier purchase order costs, and reconcile warehouse stock.
                </p>
                <div className="grid grid-cols-2 gap-4 mt-6 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Enforced credit limits at checkout</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Audited CustomerCreditLedger</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Moving Average Cost Price POs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Wholesale case packs & MOQ rules</span>
                  </div>
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 font-mono text-xs text-slate-300">
                <span className="text-blue-400 font-bold block mb-2">CREDIT ACCOUNT STANDING</span>
                <div className="p-3 rounded bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex justify-between">
                    <span>Credit Limit:</span>
                    <span className="text-white font-bold">Rs. 500,000.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Outstanding Balance:</span>
                    <span className="text-amber-400 font-bold">Rs. 180,000.00</span>
                  </div>
                  <div className="flex justify-between text-emerald-400">
                    <span>Available Credit:</span>
                    <span className="font-bold">Rs. 320,000.00</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: HARDWARE INTEGRATION SUITE
          ========================================================================= */}
      <section id="hardware" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs uppercase font-mono tracking-widest text-cyan-400 font-bold">
            Zero-Click Silent Printing & Hardware Bridge
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mt-2">
            Engineered for Every Retail Device.
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-3 leading-relaxed">
            Browsers sandbox direct hardware communication. With our background node-print client bridge running on <code>127.0.0.1:18181</code>, trigger silent printing and scanner reads in milliseconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-cyan-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4">
              <Printer className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">80mm / 58mm Thermal Printers</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Native ESC/POS command streaming for Epson, Xprinter, Star, and generic Chinese USB/Network receipt printers.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-indigo-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Cash Drawer Kick Pulse</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Automatic electronic cash drawer opening upon cash tender finalization via RJ11 printer pulse <code>ESC p 0</code>.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-emerald-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
              <Scale className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Digital Weighing Scales</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Continuous RS-232 serial weight capture for butcheries, produce markets, and bakeries. Zero manual typing.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-purple-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
              <Barcode className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">1D/2D Barcode & QR Scanners</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Instant product barcode lookup and LankaQR camera decoding without requiring browser permission dialogues.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: SRI LANKAN FINTECH & COURIER ECOSYSTEM
          ========================================================================= */}
      <section id="fintech" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="p-8 sm:p-14 rounded-3xl bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-950 border border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="max-w-xl">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              BUILT FOR SRI LANKAN COMMERCE
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-3">
              Native LankaQR, PayHere & Island-Wide Courier Integrations.
            </h2>
            <p className="text-sm text-slate-300 mt-3 leading-relaxed">
              Configure your payment gateways and automated courier dispatch directly from your tenant dashboard. Accept instant mobile wallet payments via Central Bank approved LankaQR and generate shipping labels with a click.
            </p>

            <div className="grid grid-cols-2 gap-3 mt-6 text-xs text-slate-300 font-medium">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>LankaQR Dynamic Bill Generation</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>PayHere & WebXPay Gateways</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>Koko BNPL Split Payments</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>Koombiyo, PromptX & Domex APIs</span>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-96 p-6 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-4 text-xs font-mono">
            <div className="flex items-center justify-between text-slate-400 pb-3 border-b border-slate-800">
              <span className="font-bold text-white flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-cyan-400" />
                DYNAMIC LANKAQR READY
              </span>
              <span className="text-emerald-400">EMVCo 01</span>
            </div>

            <div className="bg-white p-4 rounded-xl flex items-center justify-center">
              {/* Symbolic QR Representation */}
              <div className="w-36 h-36 bg-slate-900 rounded-lg p-2 flex flex-col justify-between">
                <div className="flex justify-between">
                  <div className="w-8 h-8 bg-white rounded-sm border-2 border-slate-900" />
                  <div className="w-8 h-8 bg-white rounded-sm border-2 border-slate-900" />
                </div>
                <div className="text-center font-sans font-black text-cyan-400 text-xs">LANKA QR</div>
                <div className="flex justify-between">
                  <div className="w-8 h-8 bg-white rounded-sm border-2 border-slate-900" />
                  <div className="w-4 h-4 bg-cyan-400 rounded-sm" />
                </div>
              </div>
            </div>

            <div className="text-center text-slate-400 text-[11px]">
              Scan with any Sri Lankan Banking App (FriMi, Genie, BOC, Commercial, Sampath)
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: PRICING PLANS IN LKR (Monthly, Quarterly, Annual, 14-Day Trial)
          ========================================================================= */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs uppercase font-mono tracking-widest text-cyan-400 font-bold">
            Transparent LKR Pricing
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mt-2">
            Scalable Plans for Any Store.
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-3 leading-relaxed">
            No hidden setup fees. Switch between monthly, quarterly, and annual billing at any time.
          </p>

          {/* Billing Cycle Switcher with Discount Chips */}
          <div className="mt-8 inline-flex items-center p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                billingCycle === "monthly" ? "bg-cyan-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("quarterly")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                billingCycle === "quarterly" ? "bg-cyan-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              <span>Quarterly</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-extrabold">Save 10%</span>
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                billingCycle === "annual" ? "bg-cyan-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              <span>Annual</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-400/20 text-emerald-300 font-extrabold">Save 20%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {/* STARTER */}
          <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold uppercase tracking-wider text-slate-300">Starter</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">Single Outlet</span>
              </div>
              <div className="flex items-baseline gap-1 my-4">
                <span className="text-3xl sm:text-4xl font-black text-white">{formatLKR(getPlanPrice(4500))}</span>
                <span className="text-xs text-slate-400 font-medium">/ month</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Perfect for boutique shops, single cafes, independent salons, and solo entrepreneurs.
              </p>
              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> 1 Branch / Location</div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> Up to 2 Staff Logins</div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> Modular POS & 80mm Receipts</div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> Basic Inventory & Barcodes</div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> 14-Day Full Access Trial</div>
              </div>
            </div>
            <Link
              href="/login"
              className="mt-8 w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs text-center transition-colors block"
            >
              Start 14-Day Free Trial
            </Link>
          </div>

          {/* GROWTH (Featured) */}
          <div className="p-8 rounded-3xl bg-gradient-to-b from-cyan-950/40 via-slate-900/60 to-slate-900/40 border-2 border-cyan-500/60 shadow-xl shadow-cyan-500/10 flex flex-col justify-between relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-cyan-500 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow">
              Most Popular in Sri Lanka
            </div>
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold uppercase tracking-wider text-cyan-400">Growth Store</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">Multi-Branch</span>
              </div>
              <div className="flex items-baseline gap-1 my-4">
                <span className="text-3xl sm:text-4xl font-black text-white">{formatLKR(getPlanPrice(9500))}</span>
                <span className="text-xs text-slate-400 font-medium">/ month</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-6">
                For established businesses scaling across multiple outlets with inventory transfers and CRM.
              </p>
              <div className="space-y-3 text-xs text-slate-200">
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400 font-bold" /> Up to 3 Branches</div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400 font-bold" /> Up to 10 Cashier & Manager Logins</div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400 font-bold" /> Inter-Branch Stock Transfers</div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400 font-bold" /> Restaurant Tables & KOT Routing</div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400 font-bold" /> CRM & Customer Credit Accounts</div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400 font-bold" /> Full GAAP Canonical P&L Reporting</div>
              </div>
            </div>
            <Link
              href="/login"
              className="mt-8 w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs text-center shadow-lg shadow-cyan-500/20 transition-all block"
            >
              Start 14-Day Free Trial
            </Link>
          </div>

          {/* ENTERPRISE */}
          <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold uppercase tracking-wider text-slate-300">Enterprise</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">Unlimited</span>
              </div>
              <div className="flex items-baseline gap-1 my-4">
                <span className="text-3xl sm:text-4xl font-black text-white">{formatLKR(getPlanPrice(18500))}</span>
                <span className="text-xs text-slate-400 font-medium">/ month</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Wholesale distributors, pharmacy chains, and supermarket networks requiring dedicated support.
              </p>
              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> Unlimited Branches & Terminals</div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> Unlimited Staff & Role Hierarchies</div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> FEFO & FIFO Batch Lot Expirations</div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> Moving Average Purchase Orders</div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> Custom Courier & Payment Gateway Webhooks</div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> 24/7 Priority Phone & Field Hardware Support</div>
              </div>
            </div>
            <Link
              href="/login"
              className="mt-8 w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs text-center transition-colors block"
            >
              Contact Enterprise Sales
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FOOTER
          ========================================================================= */}
      <footer className="border-t border-slate-800/80 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 32 32" fill="none">
              <path d="M7.5 7.5L12.5 7.5L24.5 24.5L19.5 24.5Z" fill="currentColor" />
            </svg>
          </div>
          <span className="font-bold text-slate-300">XONIT SPACE TECHNOLOGIES (PVT) LTD</span>
          <span>•</span>
          <span>Colombo, Sri Lanka</span>
        </div>

        <div className="flex items-center gap-6">
          <Link href="/login" className="hover:text-cyan-400 transition-colors">Terminal Login</Link>
          <a href="#pricing" className="hover:text-cyan-400 transition-colors">LKR Pricing</a>
          <a href="#hardware" className="hover:text-cyan-400 transition-colors">Hardware Bridge</a>
          <span>© 2026 All Rights Reserved</span>
        </div>
      </footer>
    </div>
  );
}
