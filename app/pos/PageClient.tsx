"use client";
"use client";

import {
  Maximize,
  Search,
  Trash2,
  CreditCard,
  Banknote,
  LayoutGrid,
  List,
  UserPlus,
  X,
  ChevronRight,
  CheckCircle2,
  ShoppingBag,
  Lock,
  RotateCcw,
  ShoppingCart,
  Zap,
  ArrowLeft,
  Clock,
  History,
  ArrowRightLeft,
  Droplets,
  Wrench,
  FlaskConical,
  Sparkles,
  Plus,
  Layers,
  Cpu,
  LogOut,
  Sun,
  Moon,
} from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useTheme } from "@/components/theme/ThemeProvider";
import VariantSelectionModal from "@/components/pos/VariantSelectionModal";
import PaymentModal from "@/components/pos/PaymentModal";
import CustomerSelectionModal from "@/components/pos/CustomerSelectionModal";
import OrderSuccessModal from "@/components/pos/OrderSuccessModal";
import PosReturnsMode from "@/components/pos/PosReturnsMode";
import PosDispatchTicket from "@/components/pos/PosDispatchTicket";
import PosExchangeTicket from "@/components/pos/PosExchangeTicket";
import PosShiftModal from "@/components/pos/PosShiftModal";
import HardwareSettingsModal from "@/components/hardware/HardwareSettingsModal";
import Link from "next/link";
import { useInfiniteProducts, useScanBarcode } from "@/hooks/useProducts";
import { useIntersection } from "@/hooks/useIntersection";
import OrderSidePanel from "@/components/admin/OrderSidePanel";
import { useCategories } from "@/hooks/useCategories";
import { useBranches } from "@/hooks/useInventory";
import { useRouter } from "next/navigation";
import { useProcessPosOrder, useCurrentSession, useValidateVoucher } from "@/hooks/usePos";
import { useDebounce } from "@/hooks/useDebounce";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { globalDialog } from "@/store/dialog.store";
import { useAuthStore } from "@/store/auth.store";

export default function POSPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const [terminalId, setTerminalId] = useState("TERM-001");
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pos_terminal_id");
      if (saved) setTerminalId(saved);
    }
  }, []);
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [posMode, setPosMode] = useState<"SALES" | "RETURNS" | "DISPATCH" | "EXCHANGE">("SALES");
  const [posViewMode, setPosViewMode] = useState<"GRID" | "LIST">("GRID");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pos_view_mode") as "GRID" | "LIST" | null;
      if (saved) setPosViewMode(saved);
    }
  }, []);

  const handleViewModeChange = (mode: "GRID" | "LIST") => {
    setPosViewMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("pos_view_mode", mode);
    }
  };
  
  const { data: activeSession, isLoading: sessionLoading } = useCurrentSession(terminalId);
  const { data: branchesResponse } = useBranches();
  const branches = Array.isArray(branchesResponse) ? branchesResponse : (branchesResponse as any)?.data || [];

  // Priority: active session branch (guaranteed real) > user branch > first available branch
  const branchId = activeSession?.branchId || user?.branchId || user?.branch?.id || branches?.[0]?.id || "";
  
  const processOrderMutation = useProcessPosOrder();
  const scanBarcodeMutation = useScanBarcode();
  
  // Modal states
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  
  const [pollingOrder, setPollingOrder] = useState<any>(null);

  useEffect(() => {
    let interval: any;
    if (pollingOrder) {
      interval = setInterval(async () => {
        try {
          const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
          const res = await fetch(`${baseUrl}/api/payments/status/${pollingOrder.orderNumber}`);
          const data = await res.json();
          if (data.paymentStatus === 'PAID') {
            clearInterval(interval);
            setPollingOrder(null);
            setLastOrderData({ ...pollingOrder, paymentStatus: 'PAID' });
            clearCart();
            setSelectedCustomer(null);
            setIsSuccessModalOpen(true);
          }
        } catch (e) {
           console.error("Polling error", e);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [pollingOrder]);
  
  // New States for POS Upgrades
  // New States for POS Upgrades
  // Default to OPEN if activeSession exists, else CLOSED
  const [shiftState, setShiftState] = useState<"CLOSED" | "OPEN">("CLOSED");
  const [shiftModalMode, setShiftModalMode] = useState<"OPEN" | "CLOSE" | null>(null);
  const isShiftModalOpen = shiftModalMode !== null;
  
  useEffect(() => {
    if (sessionLoading) return; // wait until loaded
    if (activeSession) setShiftState("OPEN");
    else setShiftState("CLOSED");
  }, [activeSession, sessionLoading]);
  
  const [heldCarts, setHeldCarts] = useState<{id: string, time: string, items: any[]}[]>([]);
  const [isHeldCartsModalOpen, setIsHeldCartsModalOpen] = useState(false);
  const [isHardwareModalOpen, setIsHardwareModalOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('posHeldCarts');
    if (saved) {
      try {
        setHeldCarts(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('posHeldCarts', JSON.stringify(heldCarts));
  }, [heldCarts]);

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [cartVouchers, setCartVouchers] = useState<{code: string, amount: number}[]>([]);
  const [lastOrderData, setLastOrderData] = useState<any>(null);

  const holdCurrentCart = () => {
    if (cart.length === 0) return;
    setHeldCarts(prev => [...prev, { id: `H-${Math.floor(Math.random() * 10000)}`, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), items: [...cart] }]);
    clearCart();
  };

  const restoreHeldCart = (heldId: string) => {
    const held = heldCarts.find(h => h.id === heldId);
    if (held) {
      setCart(held.items);
      setHeldCarts(prev => prev.filter(h => h.id !== heldId));
      setIsHeldCartsModalOpen(false);
    }
  };

  const resolveProductImage = (product: any, variant?: any): string => {
    // Prefer the specific variant's image
    if (variant?.featuredImage) return variant.featuredImage;
    if (variant?.gallery?.length > 0) return variant.gallery[0];
    // Fall back to first variant with an image
    if (product?.variants?.length > 0) {
      for (const v of product.variants) {
        if (v.featuredImage) return v.featuredImage;
        if (v.gallery?.length > 0) return v.gallery[0];
      }
    }
    // Fall back to product-level image fields
    if (product?.images?.length > 0) return product.images[0];
    if (product?.featuredImage) return product.featuredImage;
    return "/placeholder.png";
  };

  const addToCart = (product: any, variant?: any, selectedQty = 1) => {
    const image = resolveProductImage(product, variant);
    const itemToAdd = variant ? {
      ...product,
      id: variant.id, 
      productId: product.id,
      name: `${product.name} - ${variant.color || 'Default'} ${variant.size || ''}`.trim(),
      price: variant.price || 0,
      color: variant.color,
      size: variant.size,
      image,
    } : {
      ...product,
      id: product.variants?.[0]?.id || product.id,
      price: product.variants?.[0]?.price || 0,
      image,
    };

    setCart(prev => {
      const exists = prev.find(item => item.id === itemToAdd.id);
      if (exists) {
        return prev.map(item => item.id === itemToAdd.id ? { ...item, qty: item.qty + selectedQty } : item);
      }
      return [...prev, { ...itemToAdd, qty: selectedQty }];
    });
  };

  const updateQty = (id: any, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, Math.round((item.qty + delta) * 10) / 10);
        return { ...item, qty: newQty };
      }
      return item;
    }).filter(item => item.qty > 0));
  };

  const setExactQty = (id: any, exactVal: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, qty: Math.max(0, exactVal) };
      }
      return item;
    }).filter(item => item.qty > 0));
  };

  const clearCart = () => { setCart([]); setCartVouchers([]); };

  useBarcodeScanner({
    onScan: async (barcode) => {
      if (shiftState === 'CLOSED' || (posMode !== 'SALES' && posMode !== 'DISPATCH')) return;
      try {
        const product = await scanBarcodeMutation.mutateAsync(barcode);
        if (product && product.variants) {
          const lowerSku = barcode.toLowerCase();
          const matchingVariant = product.variants.find((v: any) => 
            v.sku?.toLowerCase() === lowerSku || 
            v.barcode?.toLowerCase() === lowerSku ||
            v.sku?.toLowerCase().startsWith(lowerSku) ||
            v.barcode?.toLowerCase().startsWith(lowerSku) ||
            v.id?.toLowerCase().startsWith(lowerSku) ||
            product.id?.toLowerCase().startsWith(lowerSku)
          );
          if (matchingVariant) {
            // If in SALES mode, don't allow scanning out-of-stock items
            if (posMode === 'SALES' && matchingVariant.stockStatus !== 'instock' && matchingVariant.quantity <= 0) {
              globalDialog.alert("Scanned item is out of stock.");
              return;
            }
            addToCart(product, matchingVariant, 1);
          } else {
            globalDialog.alert("Barcode matched a product but no specific variant SKU.");
          }
        }
      } catch (err) {
        globalDialog.alert("Product not found or invalid barcode.");
      }
    },
    disabled: isPaymentModalOpen || isCustomerModalOpen || isVariantModalOpen || isShiftModalOpen || shiftState === 'CLOSED' || (posMode !== 'SALES' && posMode !== 'DISPATCH')
  });

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const { data: categoriesResponse, isLoading: categoriesLoading } = useCategories();
  const categories = categoriesResponse?.data || [];
  
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedViscosity, setSelectedViscosity] = useState("ALL");

  const { 
    data: productsPages, 
    isLoading: productsLoading, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useInfiniteProducts({
    search: debouncedSearchTerm || undefined,
    category: selectedCategory !== "All" ? selectedCategory : undefined,
    productType: selectedType !== "ALL" ? selectedType : undefined,
    viscosity: selectedViscosity !== "ALL" ? selectedViscosity : undefined,
    take: 16
  });

  const products = productsPages?.pages.flatMap(page => page.data) || [];

  const [bottomRef, isIntersecting] = useIntersection<HTMLDivElement>({ threshold: 0.5 });
  
  // Intersection Observer hook
  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const validateVoucherMutation = useValidateVoucher();

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    
    // Barcode scanners usually end with enter, or we can check length
    if (val.startsWith("VCH-") && val.length > 8) {
      if (!cartVouchers.find(v => v.code === val)) {
        try {
          const voucher = await validateVoucherMutation.mutateAsync(val);
          setCartVouchers(prev => [...prev, { code: voucher.code, amount: voucher.value }]);
          setSearchTerm("");
        } catch (err) {
          console.error("Invalid or used voucher");
        }
      }
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchTerm) {
      if (!searchTerm.startsWith("VCH-")) {
        try {
          const product = await scanBarcodeMutation.mutateAsync(searchTerm);
          if (product && product.variants) {
            const lowerSku = searchTerm.toLowerCase();
            const matchingVariant = product.variants.find((v: any) => 
              v.sku?.toLowerCase() === lowerSku || 
              v.barcode?.toLowerCase() === lowerSku ||
              v.sku?.toLowerCase().startsWith(lowerSku) ||
              v.barcode?.toLowerCase().startsWith(lowerSku) ||
              v.id?.toLowerCase().startsWith(lowerSku) ||
              product.id?.toLowerCase().startsWith(lowerSku)
            );
            if (matchingVariant) {
              addToCart(product, matchingVariant, 1);
              setSearchTerm("");
            }
          }
        } catch (err) {
          console.error("Barcode scan failed", err);
        }
      }
    }
  };

  const filteredProducts = products; // Already filtered by backend!

  return (
    <div className="flex flex-col w-full h-full bg-background">
      
      {/* POS Top Ribbon */}
      <div className="h-[28px] bg-stone-900 text-stone-300 flex items-center justify-between px-6 shrink-0 z-20 text-xs font-inter font-medium tracking-wide">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-stone-400">Branch:</span>
            <span className="text-white" suppressHydrationWarning>
              {!mounted
                ? "Loading..."
                : (activeSession?.branch?.name || 
                   user?.branch?.name || 
                   (branches?.find((b: any) => b.id === branchId)?.name) || 
                   (branchesResponse === undefined ? "Loading..." : "Unknown Branch"))}
            </span>
          </div>
          <div className="w-px h-3 bg-stone-700"></div>
          <div className="flex items-center gap-2">
            <span className="text-stone-400">Terminal:</span>
            <span className="text-white" suppressHydrationWarning>
              {!mounted ? "TERM-001" : (activeSession?.terminal?.name || terminalId)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-stone-400">Cashier:</span>
            <span className="text-white" suppressHydrationWarning>
              {!mounted
                ? "User"
                : (activeSession?.user?.firstName ? `${activeSession.user.firstName} ${activeSession.user.lastName}` : (user?.name || "User"))}
            </span>
          </div>
          <div className="w-px h-3 bg-stone-700"></div>
          <button 
            onClick={() => router.push("/login")}
            className="hover:text-white transition-colors flex items-center gap-1"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* POS Header */}
      <div className="h-[60px] bg-surface text-foreground flex items-center justify-between px-6 shrink-0 shadow-sm border-b border-border z-10">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="flex items-center gap-2 text-muted hover:text-foreground transition-colors mr-2 group">
            <div className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center group-hover:bg-surface transition-colors">
              <ArrowLeft size={16} />
            </div>
          </Link>
          <h1 className="font-bold text-lg tracking-wider uppercase flex items-center gap-2 text-foreground">
            <LayoutGrid size={18} className="text-amber-500" />
            <span>XONIT <span className="text-amber-500 font-black">POS</span></span>
          </h1>
          
          {/* Mode Switcher */}
          <div className="hidden sm:flex bg-background border border-border rounded-lg p-1">
            <button 
              onClick={() => setPosMode("SALES")}
              className={`px-4 py-1.5 rounded-md font-inter font-bold text-xs flex items-center gap-2 transition-colors ${posMode === 'SALES' ? 'bg-primary text-white shadow-sm' : 'text-muted hover:bg-surface'}`}
            >
              <ShoppingCart size={14} /> SALES
            </button>
            <button 
              onClick={() => setPosMode("RETURNS")}
              className={`px-4 py-1.5 rounded-md font-inter font-bold text-xs flex items-center gap-2 transition-colors ${posMode === 'RETURNS' ? 'bg-primary text-white shadow-sm' : 'text-muted hover:bg-surface'}`}
            >
              <RotateCcw size={14} /> RETURNS
            </button>
            <button 
              onClick={() => setPosMode("EXCHANGE")}
              className={`px-4 py-1.5 rounded-md font-inter font-bold text-xs flex items-center gap-2 transition-colors ${posMode === 'EXCHANGE' ? 'bg-primary text-white shadow-sm' : 'text-muted hover:bg-surface'}`}
            >
              <ArrowRightLeft size={14} /> EXCHANGE
            </button>
            <button 
              onClick={() => setPosMode("DISPATCH")}
              className={`px-4 py-1.5 rounded-md font-inter font-bold text-xs flex items-center gap-2 transition-colors ${posMode === 'DISPATCH' ? 'bg-primary text-white shadow-sm' : 'text-muted hover:bg-surface'}`}
            >
              <Zap size={14} /> DISPATCH
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-4 md:gap-6">
          <button 
            onClick={() => setShiftModalMode(shiftState === "CLOSED" ? "OPEN" : "CLOSE")}
            className="hidden md:flex items-center gap-2 hover:bg-surface border border-transparent hover:border-border px-3 py-1.5 rounded transition-colors cursor-pointer"
          >
            <div className={`w-2 h-2 rounded-full ${shiftState === "OPEN" ? "bg-success animate-pulse" : "bg-error"}`}></div>
            <span className="text-sm font-inter font-bold text-foreground">
              {shiftState === "OPEN" ? "Shift OPEN" : "Shift CLOSED"}
            </span>
          </button>
          
          <button 
            onClick={() => setIsHeldCartsModalOpen(true)}
            className="hidden md:flex items-center gap-2 text-sm font-inter text-muted hover:text-foreground transition-colors border-l border-border pl-6 relative"
          >
            <History size={16} />
            <span>Held Orders</span>
            {heldCarts.length > 0 && (
              <span className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-primary text-white text-[10px] flex items-center justify-center rounded-full font-bold">
                {heldCarts.length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setIsHardwareModalOpen(true)}
            className="hidden md:flex items-center gap-1.5 text-sm font-inter text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/30 hover:bg-cyan-100 dark:hover:bg-cyan-950/50 border border-cyan-500/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            title="Configure 80mm printers, cash drawers, scales, scanners, customer display"
          >
            <Cpu size={15} />
            <span className="font-semibold text-xs">Hardware</span>
          </button>

          {/* Light / Dark Mode Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-1.5 bg-background hover:bg-surface border border-border px-3 py-1.5 rounded-lg transition-all text-xs font-inter cursor-pointer shadow-sm group"
            title={theme === "dark" ? "Switch to Calm Light Theme" : "Switch to Deep Dark Theme"}
            aria-label="Toggle POS Theme"
          >
            {theme === "dark" ? (
              <>
                <Sun size={15} className="text-amber-400 group-hover:rotate-45 transition-transform" />
                <span className="hidden sm:inline font-semibold text-slate-200">Light</span>
              </>
            ) : (
              <>
                <Moon size={15} className="text-slate-700 group-hover:-rotate-12 transition-transform" />
                <span className="hidden sm:inline font-semibold text-slate-700">Dark</span>
              </>
            )}
          </button>

          <button 
            onClick={toggleFullscreen}
            className="flex items-center gap-2 bg-background hover:bg-surface border border-border px-3 py-1.5 rounded-lg transition-colors text-xs font-inter"
          >
            <Maximize size={14} />
            <span className="hidden sm:inline">{isFullscreen ? "Exit Full Screen" : "Full Screen"}</span>
          </button>
          <button 
            onClick={() => useAuthStore.getState().logout('/login')}
            className="flex items-center gap-1.5 text-xs font-inter font-semibold text-rose-500 hover:text-rose-400 hover:bg-rose-950/20 border border-rose-500/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            title="Log out of Cashier Terminal"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Layout Area */}
      {sessionLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-surface overflow-hidden">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="font-inter text-muted text-sm">Checking shift status...</p>
        </div>
      ) : shiftState === "CLOSED" ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-surface overflow-hidden">
          <div className="w-24 h-24 bg-stone-100 rounded-full flex items-center justify-center mb-6">
            <Lock size={48} className="text-stone-400" />
          </div>
          <h2 className="font-inter font-bold text-3xl text-foreground mb-4">Shift Closed</h2>
          <p className="font-inter text-muted mb-8 max-w-md text-center">
            You need to open a shift with an initial cash float before you can start processing sales, returns, or exchanges.
          </p>
          <button 
            onClick={() => setShiftModalMode("OPEN")}
            className="px-8 py-3 bg-primary text-white font-inter font-bold rounded-xl shadow-lg hover:bg-primary-hover hover:-translate-y-1 transition-all"
          >
            Open Shift Now
          </button>
          <button
            onClick={() => useAuthStore.getState().logout('/login')}
            className="mt-4 text-xs font-inter text-muted hover:text-rose-500 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut size={13} />
            <span>Sign out ({user?.name || user?.email || 'Cashier'})</span>
          </button>
        </div>
      ) : posMode === "RETURNS" ? (
        <PosReturnsMode branchId={branchId} />
      ) : posMode === "EXCHANGE" ? (
        <PosExchangeTicket
          isMobileCartOpen={isMobileCartOpen}
          setIsMobileCartOpen={setIsMobileCartOpen}
          cart={cart}
          updateQty={updateQty}
          clearCart={clearCart}
          branchId={branchId}
        />
      ) : (
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Side: Products (2/3 width) */}
          <div className="flex-1 flex flex-col bg-surface overflow-hidden border-r border-border">
            
            {/* Search Bar + Grid/List View Toggle */}
            <div className="p-3.5 border-b border-border shrink-0 bg-surface flex items-center gap-3">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Search brand, grade (0W-20, 15W-40), part #, scan barcode..."
                  className="w-full bg-background border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm font-inter text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
                  autoFocus
                />
              </div>

              {/* View Mode Toggle (Grid / List) */}
              <div className="flex items-center gap-1 bg-background border border-border p-1 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => handleViewModeChange("GRID")}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    posViewMode === "GRID"
                      ? "bg-amber-500 text-slate-950 shadow-sm"
                      : "text-muted hover:text-foreground"
                  }`}
                  title="Grid Card View"
                  aria-label="Grid Card View"
                >
                  <LayoutGrid size={15} />
                  <span className="hidden sm:inline">Grid</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleViewModeChange("LIST")}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    posViewMode === "LIST"
                      ? "bg-amber-500 text-slate-950 shadow-sm"
                      : "text-muted hover:text-foreground"
                  }`}
                  title="Dense List / Table View"
                  aria-label="Dense List / Table View"
                >
                  <List size={15} />
                  <span className="hidden sm:inline">List</span>
                </button>
              </div>
            </div>

            {/* Quick Item Type Filter Bar (Zero Emojis, Clean Vector Icons) */}
            <div className="px-4 py-2 border-b border-border flex gap-2 overflow-x-auto shrink-0 no-scrollbar bg-surface/50">
              {[
                { id: "ALL", label: "All Items", icon: Layers },
                { id: "LUBRICANT", label: "Oils & Lubricants", icon: Droplets },
                { id: "FILTER", label: "Filters (Non-Oil)", icon: Wrench },
                { id: "BATTERY", label: "Batteries", icon: Zap },
                { id: "CAR_CARE", label: "Coolants & Fluids", icon: FlaskConical },
                { id: "SPARE_PART", label: "Plugs & Spares", icon: Sparkles },
              ].map((tab) => {
                const TabIcon = tab.icon;
                const isSelected = selectedType === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => { setSelectedType(tab.id); setSelectedViscosity("ALL"); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-inter font-semibold text-xs whitespace-nowrap transition-all border ${
                      isSelected
                        ? "bg-amber-500 text-slate-950 border-amber-500 shadow-sm"
                        : "bg-background text-muted border-border hover:bg-surface hover:text-foreground"
                    }`}
                  >
                    <TabIcon size={14} className={isSelected ? "text-slate-950" : "text-muted"} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Viscosity / Oil Grade Fast Filter (Active when Lubricants or All selected) */}
            {(selectedType === "ALL" || selectedType === "LUBRICANT") && (
              <div className="px-4 py-2 border-b border-border flex gap-1.5 overflow-x-auto shrink-0 no-scrollbar bg-background/60">
                <span className="text-[11px] font-bold text-muted self-center uppercase tracking-wider mr-1">Grade:</span>
                {["ALL", "0W-20", "5W-30", "5W-40", "10W-30", "10W-40", "15W-40", "20W-50", "ATF", "80W-90"].map((grade) => (
                  <button
                    key={grade}
                    onClick={() => setSelectedViscosity(grade)}
                    className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs whitespace-nowrap transition-colors border ${
                      selectedViscosity === grade
                        ? "bg-amber-500 text-slate-950 border-amber-500 shadow-sm"
                        : "bg-surface text-foreground border-border hover:bg-background"
                    }`}
                  >
                    {grade === "ALL" ? "All Grades" : grade}
                  </button>
                ))}
              </div>
            )}

            {/* Products Container: Grid or List */}
            <div className="flex-1 overflow-y-auto p-4 bg-background pb-24 lg:pb-4 custom-scrollbar">
              {posViewMode === "GRID" ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredProducts.map((p: any) => {
                    let imageUrl = "/placeholder.png";
                    if (p.variants && p.variants.length > 0) {
                      for (const v of p.variants) {
                        if (v.featuredImage) { imageUrl = v.featuredImage; break; }
                        if (v.gallery && v.gallery.length > 0) { imageUrl = v.gallery[0]; break; }
                      }
                    }
                    
                    const price = p.variants?.[0]?.price || 0;
                    const packUnit = p.variants?.[0]?.packUnit || (p.productType === 'LUBRICANT' ? 'Can/Bottle' : 'Piece');
                    const inStock = p.variants?.some((v: any) => v.stockStatus === 'instock') ?? true;

                    return (
                      <button 
                        key={p.id}
                        onClick={() => { 
                          setSelectedProduct(p); 
                          setIsVariantModalOpen(true); 
                        }}
                        className="bg-surface border border-border rounded-xl flex flex-col hover:border-amber-500 hover:shadow-md transition-all text-left active:scale-[0.98] overflow-hidden group"
                      >
                        <div className="relative w-full aspect-square bg-background flex items-center justify-center overflow-hidden border-b border-border/50">
                          <Image src={imageUrl} alt={p.name} fill sizes="150px" className="object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                            {p.viscosity && (
                              <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-mono font-bold text-[10px] rounded-md shadow-sm">
                                {p.viscosity}
                              </span>
                            )}
                            {p.partNumber && (
                              <span className="px-2 py-0.5 bg-blue-600 text-white font-mono font-bold text-[10px] rounded-md shadow-sm">
                                #{p.partNumber}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="p-3 flex flex-col justify-between flex-1">
                          <div>
                            {p.brand && (
                              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                                {p.brand}
                              </span>
                            )}
                            <span className="font-inter font-bold text-foreground text-sm leading-snug line-clamp-2 mt-0.5 mb-1">
                              {p.name}
                            </span>
                            <span className="text-[11px] text-muted font-medium">
                              Pack: {packUnit}
                            </span>
                          </div>
                          <div className="flex justify-between items-end w-full mt-2.5 pt-2 border-t border-border/50">
                            <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-base">
                              Rs {price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                            <span className={`font-inter text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-md border ${
                              (inStock || posMode === 'DISPATCH') ? "text-muted bg-background border-border" : "text-error bg-error/10 border-error/20"
                            }`}>
                              {inStock ? "In Stock" : (posMode === 'DISPATCH' ? "Pre-Sold" : "Out")}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {filteredProducts.map((p: any) => {
                    let imageUrl = "/placeholder.png";
                    if (p.variants && p.variants.length > 0) {
                      for (const v of p.variants) {
                        if (v.featuredImage) { imageUrl = v.featuredImage; break; }
                        if (v.gallery && v.gallery.length > 0) { imageUrl = v.gallery[0]; break; }
                      }
                    }
                    
                    const price = p.variants?.[0]?.price || 0;
                    const packUnit = p.variants?.[0]?.packUnit || (p.productType === 'LUBRICANT' ? 'Can/Bottle' : 'Piece');
                    const inStock = p.variants?.some((v: any) => v.stockStatus === 'instock') ?? true;

                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedProduct(p);
                          setIsVariantModalOpen(true);
                        }}
                        className="p-3 bg-surface border border-border hover:border-amber-500/60 hover:shadow-md rounded-xl flex items-center justify-between gap-4 cursor-pointer transition-all group"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="relative w-12 h-12 rounded-lg bg-background border border-border/80 overflow-hidden shrink-0 flex items-center justify-center">
                            <Image src={imageUrl} alt={p.name} fill sizes="48px" className="object-cover group-hover:scale-105 transition-transform" />
                          </div>

                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                              {p.brand && (
                                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
                                  {p.brand}
                                </span>
                              )}
                              {p.viscosity && (
                                <span className="px-1.5 py-0.2 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono font-bold text-[10px] rounded border border-amber-500/20">
                                  {p.viscosity}
                                </span>
                              )}
                              {p.partNumber && (
                                <span className="px-1.5 py-0.2 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono font-bold text-[10px] rounded border border-blue-500/20">
                                  #{p.partNumber}
                                </span>
                              )}
                            </div>

                            <span className="font-inter font-semibold text-foreground text-sm truncate mt-0.5 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                              {p.name}
                            </span>

                            <span className="text-[11px] text-muted">
                              Pack: {packUnit}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-right">
                            <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-base block">
                              Rs {price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                            <span className={`text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded-md border inline-block mt-0.5 ${
                              (inStock || posMode === 'DISPATCH')
                                ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                                : "text-error bg-error/10 border-error/20"
                            }`}>
                              {inStock ? "In Stock" : (posMode === 'DISPATCH' ? "Pre-Sold" : "Out")}
                            </span>
                          </div>

                          <button
                            type="button"
                            className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs shadow-sm transition-all"
                          >
                            <Plus size={14} />
                            <span>Select</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* Intersection Observer target */}
              <div ref={bottomRef} className="h-10 w-full flex items-center justify-center mt-6">
                {isFetchingNextPage && <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>}
              </div>
            </div>

            {/* Mobile FAB */}
            <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] z-40">
              <button 
                onClick={() => setIsMobileCartOpen(true)}
                className="w-full bg-primary text-white py-4 rounded-full shadow-xl shadow-primary/30 flex items-center justify-between px-6 font-inter font-bold"
              >
                <div className="flex items-center gap-2">
                  <ShoppingBag size={20} />
                  <span>{cart.length > 0 ? cart.reduce((a, b) => a + b.qty, 0) : 2} Items</span>
                </div>
                <span>View Order</span>
              </button>
            </div>

          </div>

          {/* Right Side: Cart & Payment */}
          {posMode === "DISPATCH" ? (
            <PosDispatchTicket 
              isMobileCartOpen={isMobileCartOpen}
              setIsMobileCartOpen={setIsMobileCartOpen}
              cart={cart}
              updateQty={updateQty}
              clearCart={clearCart}
              branchId={branchId}
            />
          ) : (
            <div className={`fixed inset-y-0 right-0 w-full sm:w-[420px] bg-surface flex flex-col shrink-0 shadow-2xl lg:shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-50 lg:z-0 lg:static transform transition-transform duration-300 lg:translate-x-0 ${isMobileCartOpen ? "translate-x-0" : "translate-x-full"}`}>
              {/* Rest of Sales Cart goes here */}
              <div className="p-4 border-b border-border bg-background flex justify-between items-center shrink-0 h-[60px]">
                <h2 className="font-inter font-bold text-lg flex items-center gap-2">
                  <button className="lg:hidden p-1 -ml-1 text-muted" onClick={() => setIsMobileCartOpen(false)}>
                    <X size={20} />
                  </button>
                  Current Order
                </h2>
                <div className="flex items-center gap-2">
                  {selectedCustomer && (
                    <button
                      onClick={() => setSelectedCustomer(null)}
                      className="text-xs text-muted hover:text-foreground font-semibold px-2 py-1 rounded hover:bg-surface"
                      title="Clear Customer"
                    >
                      Clear
                    </button>
                  )}
                  <button 
                    onClick={() => setIsCustomerModalOpen(true)}
                    className={`flex items-center gap-2 text-xs font-inter px-3 py-1.5 rounded-lg transition-colors ${
                      selectedCustomer 
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 hover:bg-amber-200 dark:hover:bg-amber-900/60 font-bold' 
                        : 'text-primary bg-primary-soft hover:bg-primary/20 font-semibold'
                    }`}
                  >
                    <UserPlus size={15} /> 
                    {selectedCustomer 
                      ? (selectedCustomer.companyName || selectedCustomer.name) 
                      : 'Add Workshop / Customer'}
                  </button>
                </div>
              </div>

              {/* Selected Customer Credit Banner */}
              {selectedCustomer && (
                <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between text-xs font-inter shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground truncate max-w-[170px]">
                      {selectedCustomer.companyName || selectedCustomer.name}
                    </span>
                    {selectedCustomer.vehicleNumber && (
                      <span className="font-mono text-[10px] bg-surface px-1.5 py-0.5 rounded border border-border font-semibold text-muted">
                        {selectedCustomer.vehicleNumber}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-muted block">Balance Owed</span>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                      Rs. {(selectedCustomer.creditBalance || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
                {cart.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-muted gap-2 h-full opacity-60">
                    <p className="font-inter text-sm">Cart is empty</p>
                  </div>
                ) : (
                  cart.map(item => {
                    const isLooseOrDrum = item.packUnit?.toLowerCase().includes("drum") || 
                                          item.packUnit?.toLowerCase().includes("loose") || 
                                          item.name?.toLowerCase().includes("loose") ||
                                          (item.qty % 1 !== 0);

                    return (
                      <div key={item.id} className="flex flex-col bg-background border border-border rounded-xl p-3.5 relative group shadow-sm">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-inter font-bold text-foreground text-sm leading-snug pr-8">{item.name}</span>
                          <button onClick={() => updateQty(item.id, -item.qty)} className="absolute top-3 right-3 text-muted hover:text-error transition-colors opacity-0 group-hover:opacity-100 p-1">
                            <Trash2 size={15} />
                          </button>
                        </div>
                        <div className="text-xs font-inter text-muted mb-3 flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-surface border border-border font-medium text-[11px]">
                            {item.packUnit || item.size || 'Standard Unit'}
                          </span>
                          {(item.viscosity || item.partNumber) && (
                            <span className="font-mono text-[11px] font-bold text-muted">
                              {item.viscosity || item.partNumber}
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-border/50">
                          {isLooseOrDrum ? (
                            /* Fractional Loose Oil Dispenser Controls */
                            <div className="flex items-center gap-1.5 bg-surface border border-border rounded-lg p-1">
                              <button 
                                type="button" 
                                onClick={() => updateQty(item.id, -0.5)} 
                                className="px-2 py-1 text-xs font-bold font-mono hover:bg-background rounded"
                              >
                                -0.5L
                              </button>
                              <span className="font-mono font-black text-sm px-2 text-foreground">
                                {item.qty} L
                              </span>
                              <button 
                                type="button" 
                                onClick={() => updateQty(item.id, 0.5)} 
                                className="px-2 py-1 text-xs font-bold font-mono hover:bg-background rounded"
                              >
                                +0.5L
                              </button>
                            </div>
                          ) : (
                            /* Standard Unit Increments */
                            <div className="flex items-center gap-2.5">
                              <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 rounded-lg bg-surface border border-border font-bold text-muted flex items-center justify-center hover:bg-background">-</button>
                              <span className="font-mono font-bold text-base w-5 text-center text-foreground">{item.qty}</span>
                              <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 rounded-lg bg-surface border border-border font-bold text-muted flex items-center justify-center hover:bg-background">+</button>
                            </div>
                          )}
                          <span className="font-mono font-bold text-base text-foreground">
                            Rs. {(item.price * item.qty).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Totals & Payment Actions */}
              <div className="border-t border-border bg-surface p-6 shrink-0 flex flex-col gap-4 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                
                {cartVouchers.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="font-inter font-bold text-sm text-muted">Applied Vouchers</span>
                    {cartVouchers.map(v => (
                      <div key={v.code} className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        <span className="font-mono text-xs font-bold">{v.code}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-inter font-bold">-Rs. {v.amount.toLocaleString()}</span>
                          <button onClick={() => setCartVouchers(prev => prev.filter(cv => cv.code !== v.code))} className="text-emerald-600 hover:text-emerald-900 dark:hover:text-emerald-200"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4">
                  <button 
                    disabled={cart.length === 0}
                    onClick={() => {
                      if (!branchId) {
                        globalDialog.alert("No branch assigned to your account. Please contact your administrator to assign you to a branch before processing sales.");
                        return;
                      }
                      setIsPaymentModalOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:bg-stone-200 dark:disabled:bg-stone-800 disabled:text-stone-400 dark:disabled:text-stone-600 disabled:cursor-not-allowed text-slate-950 font-inter font-bold text-base rounded-xl py-4 transition-all shadow-lg shadow-amber-500/20"
                  >
                    <span>Charge</span>
                    <ChevronRight size={20} className="text-slate-950" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <button 
                    onClick={holdCurrentCart}
                    disabled={cart.length === 0}
                    className="bg-background hover:bg-border disabled:opacity-50 text-foreground font-inter font-semibold py-3 rounded-lg text-sm transition-colors border border-border"
                  >
                    Hold Cart
                  </button>
                  <button onClick={clearCart} className="bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 font-inter font-semibold py-3 rounded-lg text-sm transition-colors border border-rose-200 dark:border-rose-900/60">
                    Clear All
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
      

      {/* Modals */}
      {isHardwareModalOpen && (
        <HardwareSettingsModal onClose={() => setIsHardwareModalOpen(false)} />
      )}
      {shiftModalMode && (
        <PosShiftModal 
          mode={shiftModalMode}
          activeSession={activeSession}
          branchId={branchId}
          terminalId={terminalId}
          userId={user?.id || "USER-001"}
          onClose={() => setShiftModalMode(null)} 
          onSuccess={() => {
            setShiftState(shiftModalMode === "OPEN" ? "OPEN" : "CLOSED");
            setShiftModalMode(null);
          }} 
        />
      )}
      {isHeldCartsModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-[500px] bg-background shadow-2xl rounded-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-4 border-b border-border bg-surface shrink-0">
              <h3 className="font-inter font-bold text-lg text-foreground">Held Carts</h3>
              <button onClick={() => setIsHeldCartsModalOpen(false)} className="p-2 text-muted hover:text-foreground hover:bg-background rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
              {heldCarts.length === 0 ? (
                <div className="py-8 text-center text-muted font-inter">No held carts available.</div>
              ) : (
                heldCarts.map(hc => (
                  <div key={hc.id} className="flex justify-between items-center bg-surface border border-border p-3 rounded-xl">
                    <div className="flex flex-col">
                      <span className="font-inter font-bold text-sm text-foreground">Cart {hc.id}</span>
                      <span className="font-inter text-xs text-muted">{hc.time} - {hc.items.length} items</span>
                    </div>
                    <button onClick={() => restoreHeldCart(hc.id)} className="px-4 py-2 bg-primary text-white rounded-lg font-inter text-sm font-bold hover:bg-primary-hover transition-colors">
                      Resume
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {isVariantModalOpen && <VariantSelectionModal product={selectedProduct} onClose={() => setIsVariantModalOpen(false)} onAdd={addToCart} allowOutOfStock={posMode !== 'SALES'} />}
      {isPaymentModalOpen && <PaymentModal 
        total={Math.max(0, cart.reduce((sum, item) => sum + (item.price * item.qty), 0) - cartVouchers.reduce((sum, v) => sum + v.amount, 0)).toFixed(2)} 
        selectedCustomer={selectedCustomer}
        onOpenCustomerModal={() => {
          setIsPaymentModalOpen(false);
          setIsCustomerModalOpen(true);
        }}
        onClose={() => setIsPaymentModalOpen(false)} 
        onSuccess={async (method: string) => {
          setIsPaymentModalOpen(false);
          const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
          const voucherAmount = cartVouchers.reduce((sum, v) => sum + v.amount, 0);
          const total = Math.max(0, subtotal - voucherAmount);
          try {
            const orderRes = await processOrderMutation.mutateAsync({
              branchId,
              sessionId: activeSession?.id || undefined,
              customerId: selectedCustomer?.id,
              items: cart.map(item => ({ 
                variantId: item.id, 
                qty: item.qty,
                dispensedVolumeLiters: (item.packUnit?.toLowerCase().includes("drum") || item.packUnit?.toLowerCase().includes("loose") || item.qty % 1 !== 0) ? item.qty : undefined
              })),
              paymentMethod: method,
              appliedVouchers: cartVouchers.map(v => v.code),
              subtotal,
              total,
              tax: 0
            });
            
            const activeBranch = activeSession?.branch || user?.branch || branches?.find((b: any) => b.id === branchId);

            const newOrderData = {
              orderId: orderRes?.orderNumber || `POS-${Date.now()}`,
              orderNumber: orderRes?.orderNumber,
              cashierName: user?.name || "User",
              items: cart,
              subtotal,
              discount: voucherAmount,
              total,
              paymentMethod: method,
              tendered: total,
              change: 0,
              branchName: activeBranch?.name,
              branchAddress: activeBranch?.address,
              branchPhone: activeBranch?.phone,
              customer: selectedCustomer
            };

            setLastOrderData(newOrderData);
            clearCart();
            setSelectedCustomer(null);
            setIsSuccessModalOpen(true);
          } catch (err: any) {
            console.error(err);
            const serverMsg = err?.response?.data?.error?.message || err?.response?.data?.error || err?.response?.data?.message;
            globalDialog.alert(serverMsg || (err?.isAxiosError ? "Network error. Please try again." : err?.message) || "Failed to process payment. Please try again.");
          }
        }}  
      />}
      {isCustomerModalOpen && (
        <CustomerSelectionModal 
          activeSessionId={activeSession?.id}
          onClose={() => setIsCustomerModalOpen(false)} 
          onSelect={(c) => setSelectedCustomer(c)} 
        />
      )}
      {isSuccessModalOpen && <OrderSuccessModal onClose={() => setIsSuccessModalOpen(false)} orderData={lastOrderData} />}
      
      {pollingOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface p-8 rounded-2xl flex flex-col items-center gap-4 max-w-sm w-full">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <h2 className="text-xl font-bold font-inter text-foreground">Awaiting Koko Payment</h2>
            <p className="text-muted text-center text-sm font-inter">
              Please ask the customer to complete the payment via the Koko app. We are waiting for the confirmation.
            </p>
            <button onClick={() => setPollingOrder(null)} className="mt-4 w-full px-6 py-3 bg-surface border border-border font-inter font-semibold text-foreground hover:bg-background rounded-lg transition-colors">
              Run in Background
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
