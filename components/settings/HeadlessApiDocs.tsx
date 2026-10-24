"use client";

import { useState } from "react";
import {
  Code2,
  Copy,
  Check,
  Terminal,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Shield,
  Zap,
  BookOpen,
  ArrowRight,
  CreditCard,
  ShoppingBag,
  UserCheck,
  Truck,
  CheckCircle2,
  AlertCircle,
  FileCode2,
  Play
} from "lucide-react";
import { toast } from "@/store/toast.store";

interface HeadlessApiDocsProps {
  clientId?: string;
  baseUrl?: string;
}

export function HeadlessApiDocs({ clientId = "xcl_live_sample_client_id", baseUrl = "https://api.xonit.space/api/v1/headless" }: HeadlessApiDocsProps) {
  // Selected Language Tab for Quickstart
  const [activeLang, setActiveLang] = useState<"curl" | "nextjs" | "typescript" | "flutter" | "python">("nextjs");
  
  // Selected Integration Step for the End-to-End Walkthrough
  const [activeFlowStep, setActiveFlowStep] = useState<number>(1);

  // Expanded endpoint accordion state
  const [expandedEndpoint, setExpandedEndpoint] = useState<string>("catalog-products");

  // Copied indicator
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Snippet copied to clipboard!");
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const codeSnippets = {
    curl: {
      auth: `# Storefront Authentication & Headers
curl -X GET "${baseUrl}/catalog/products?limit=10" \\
  -H "x-client-id: ${clientId}" \\
  -H "x-api-key: xak_live_YOUR_API_KEY_SECRET"`,

      catalog: `# 1. Fetch products with active branch inventory
curl -X GET "${baseUrl}/catalog/products?limit=20&category=beverages&sort=price_asc" \\
  -H "x-client-id: ${clientId}" \\
  -H "x-api-key: xak_live_YOUR_API_KEY_SECRET"

# 2. Fetch product by slug
curl -X GET "${baseUrl}/catalog/products/organic-green-tea-250g" \\
  -H "x-client-id: ${clientId}" \\
  -H "x-api-key: xak_live_YOUR_API_KEY_SECRET"`,

      calculate: `# 3. Real-time Cart, Promo & Delivery Zone Calculation
curl -X POST "${baseUrl}/checkout/calculate" \\
  -H "x-client-id: ${clientId}" \\
  -H "x-api-key: xak_live_YOUR_API_KEY_SECRET" \\
  -H "Content-Type: application/json" \\
  -d '{
    "items": [
      { "productId": "prod_88291a", "quantity": 2, "unitPrice": 1250 }
    ],
    "deliveryZone": "COLOMBO_METRO",
    "promoCode": "NEWSTORE10"
  }'`,

      order: `# 4. Atomic Headless Order Submission & Inventory Locking
curl -X POST "${baseUrl}/orders" \\
  -H "x-client-id: ${clientId}" \\
  -H "x-api-key: xak_live_YOUR_API_KEY_SECRET" \\
  -H "Content-Type: application/json" \\
  -d '{
    "customer": {
      "name": "Kamal Perera",
      "email": "kamal@perera.lk",
      "phone": "+94771234567"
    },
    "deliveryAddress": {
      "street": "42 Galle Road",
      "city": "Colombo 03",
      "postalCode": "00300"
    },
    "items": [
      { "productId": "prod_88291a", "quantity": 2, "unitPrice": 1250 }
    ],
    "paymentMethod": "ONEPAY",
    "deliveryFee": 350
  }'`,

      payment: `# 5. Initiate Sri Lankan Online Payment (OnePay / PayHere / Koko)
curl -X POST "${baseUrl}/payments/initiate" \\
  -H "x-client-id: ${clientId}" \\
  -H "x-api-key: xak_live_YOUR_API_KEY_SECRET" \\
  -H "Content-Type: application/json" \\
  -d '{
    "gateway": "ONEPAY",
    "orderId": "ord_9901726a",
    "amount": 2850,
    "currency": "LKR",
    "customerName": "Kamal Perera",
    "customerEmail": "kamal@perera.lk",
    "customerPhone": "+94771234567",
    "returnUrl": "https://mystore.lk/checkout/success"
  }'`,

      tracking: `# 6. Track Headless Order & Courier Dispatch Status
curl -X GET "${baseUrl}/orders/ord_9901726a" \\
  -H "x-client-id: ${clientId}" \\
  -H "x-api-key: xak_live_YOUR_API_KEY_SECRET"`
    },

    nextjs: {
      auth: `// lib/xonit-client.ts - Production Next.js 15 Server Client
const XONIT_BASE_URL = process.env.XONIT_API_URL || "${baseUrl}";
const CLIENT_ID = process.env.XONIT_CLIENT_ID || "${clientId}";
const API_KEY = process.env.XONIT_API_KEY || "xak_live_YOUR_SECRET";

export async function xonitFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = \`\${XONIT_BASE_URL}\${endpoint.startsWith("/") ? "" : "/"}\${endpoint}\`;
  
  const headers = new Headers(options.headers || {});
  headers.set("x-client-id", CLIENT_ID);
  headers.set("x-api-key", API_KEY);
  if (!headers.has("Content-Type") && options.method && options.method !== "GET") {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(url, { ...options, headers });
  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || data.error?.message || "XONIT API Request Failed");
  }

  return data.data;
}`,

      catalog: `// app/products/page.tsx - Server Component with Zero-Latency ISR
import { xonitFetch } from "@/lib/xonit-client";

export interface ProductItem {
  id: string;
  name: string;
  slug: string;
  retailPrice: number;
  stockQty: number;
  imageUrl?: string;
  category?: { name: string };
}

export default async function ProductsCatalogPage() {
  // Cached with Next.js ISR (revalidated every 60s)
  const products = await xonitFetch<ProductItem[]>("/catalog/products?limit=24", {
    next: { revalidate: 60, tags: ["xonit-products"] }
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-8">
      {products.map((p) => (
        <div key={p.id} className="border rounded-2xl p-4 shadow-sm hover:shadow-md transition">
          <img src={p.imageUrl || "/placeholder.png"} alt={p.name} className="h-48 w-full object-cover rounded-xl" />
          <h3 className="font-bold mt-3 text-lg">{p.name}</h3>
          <p className="text-zinc-500 text-sm">{p.category?.name}</p>
          <div className="flex items-center justify-between mt-4">
            <span className="font-mono font-bold text-emerald-600">Rs. {p.retailPrice.toLocaleString()}</span>
            <span className="text-xs text-zinc-400">{p.stockQty > 0 ? \`\${p.stockQty} in stock\` : "Out of Stock"}</span>
          </div>
        </div>
      ))}
    </div>
  );
}`,

      calculate: `// app/actions/cart.ts - Server Action for Real-time Cart Calculation
"use server";
import { xonitFetch } from "@/lib/xonit-client";

export async function calculateCartCheckout(items: Array<{ productId: string; quantity: number }>, deliveryZone = "COLOMBO_METRO") {
  return await xonitFetch("/checkout/calculate", {
    method: "POST",
    body: JSON.stringify({
      items,
      deliveryZone,
      promoCode: "WELCOME10"
    }),
    cache: "no-store"
  });
}`,

      order: `// app/actions/order.ts - Submit Order & Reserve Inventory
"use server";
import { xonitFetch } from "@/lib/xonit-client";

export async function submitHeadlessOrder(checkoutPayload: {
  customer: { name: string; email: string; phone: string };
  deliveryAddress: { street: string; city: string; postalCode: string };
  items: Array<{ productId: string; quantity: number; unitPrice: number }>;
  paymentMethod: "ONEPAY" | "PAYHERE" | "KOKO" | "COD";
}) {
  const result = await xonitFetch<{ orderId: string; orderNumber: string; totalAmount: number }>(
    "/orders",
    {
      method: "POST",
      body: JSON.stringify(checkoutPayload)
    }
  );

  return result;
}`,

      payment: `// app/api/checkout/pay/route.ts - Next.js Route Handler for OnePay / PayHere
import { NextResponse } from "next/server";
import { xonitFetch } from "@/lib/xonit-client";

export async function POST(req: Request) {
  const { orderId, amount, gateway, customer } = await req.json();

  const paymentSession = await xonitFetch<{ redirectUrl?: string; paymentPayload?: any }>(
    "/payments/initiate",
    {
      method: "POST",
      body: JSON.stringify({
        gateway: gateway || "ONEPAY",
        orderId,
        amount,
        currency: "LKR",
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        returnUrl: \`\${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?orderId=\${orderId}\`
      })
    }
  );

  return NextResponse.json(paymentSession);
}`,

      tracking: `// app/orders/[orderId]/page.tsx - Real-time Status & Courier Tracking
import { xonitFetch } from "@/lib/xonit-client";

export default async function OrderTrackPage({ params }: { params: { orderId: string } }) {
  const order = await xonitFetch<any>(\`/orders/\${params.orderId}\`, {
    cache: "no-store"
  });

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Order #{order.orderNumber}</h1>
      <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
        <span className="text-sm font-semibold text-emerald-800">Status: {order.status}</span>
        <p className="text-xs text-emerald-600 mt-1">Payment Status: {order.paymentStatus}</p>
        {order.courierTrackingNumber && (
          <p className="text-xs text-emerald-700 font-mono mt-1">
            Tracking Code ({order.courierProvider}): {order.courierTrackingNumber}
          </p>
        )}
      </div>
    </div>
  );
}`
    },

    typescript: {
      auth: `import axios from "axios";

export const xonitApi = axios.create({
  baseURL: "${baseUrl}",
  timeout: 10000,
  headers: {
    "x-client-id": "${clientId}",
    "x-api-key": process.env.XONIT_API_KEY || "xak_live_YOUR_SECRET",
    "Content-Type": "application/json"
  }
});`,
      catalog: `// Query Catalog with type safety
export interface CatalogQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
}

export async function getStorefrontProducts(query?: CatalogQuery) {
  const response = await xonitApi.get("/catalog/products", { params: query });
  return response.data.data;
}`,
      calculate: `export async function calculateCart(items: Array<{ productId: string; quantity: number }>, deliveryZone: string) {
  const response = await xonitApi.post("/checkout/calculate", {
    items,
    deliveryZone
  });
  return response.data.data;
}`,
      order: `export async function createStorefrontOrder(orderData: any) {
  const response = await xonitApi.post("/orders", orderData);
  return response.data.data;
}`,
      payment: `export async function initiateGateway(orderId: string, amount: number, gateway = "ONEPAY") {
  const response = await xonitApi.post("/payments/initiate", {
    orderId,
    amount,
    gateway
  });
  return response.data.data;
}`,
      tracking: `export async function getOrderDetails(orderIdOrRef: string) {
  const response = await xonitApi.get(\`/orders/\${orderIdOrRef}\`);
  return response.data.data;
}`
    },

    flutter: {
      auth: `// lib/services/xonit_api_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class XonitApiService {
  static const String baseUrl = '${baseUrl}';
  static const String clientId = '${clientId}';
  static const String apiKey = 'xak_live_YOUR_API_KEY_SECRET';

  static Map<String, String> get headers => {
    'Content-Type': 'application/json',
    'x-client-id': clientId,
    'x-api-key': apiKey,
  };
}`,
      catalog: `  // Fetch Product Catalog
  static Future<List<dynamic>> getProducts({String? category}) async {
    final uri = Uri.parse('\$baseUrl/catalog/products').replace(
      queryParameters: category != null ? {'category': category} : null,
    );
    final response = await http.get(uri, headers: headers);
    if (response.statusCode == 200) {
      final json = jsonDecode(response.body);
      return json['data'];
    }
    throw Exception('Failed to load products: \${response.body}');
  }`,
      calculate: `  // Cart Subtotal & Shipping Calculation
  static Future<Map<String, dynamic>> calculateCheckout(List<Map<String, dynamic>> items, String zone) async {
    final response = await http.post(
      Uri.parse('\$baseUrl/checkout/calculate'),
      headers: headers,
      body: jsonEncode({'items': items, 'deliveryZone': zone}),
    );
    return jsonDecode(response.body)['data'];
  }`,
      order: `  // Submit Headless Order
  static Future<Map<String, dynamic>> placeOrder(Map<String, dynamic> payload) async {
    final response = await http.post(
      Uri.parse('\$baseUrl/orders'),
      headers: headers,
      body: jsonEncode(payload),
    );
    if (response.statusCode == 201 || response.statusCode == 200) {
      return jsonDecode(response.body)['data'];
    }
    throw Exception('Order placement failed: \${response.body}');
  }`,
      payment: `  // Initiate Mobile Gateway Payment Session (OnePay / PayHere)
  static Future<Map<String, dynamic>> initiatePayment(String orderId, double amount, String gateway) async {
    final response = await http.post(
      Uri.parse('\$baseUrl/payments/initiate'),
      headers: headers,
      body: jsonEncode({
        'orderId': orderId,
        'amount': amount,
        'gateway': gateway,
      }),
    );
    return jsonDecode(response.body)['data'];
  }`,
      tracking: `  // Order Tracking
  static Future<Map<String, dynamic>> trackOrder(String orderId) async {
    final response = await http.get(
      Uri.parse('\$baseUrl/orders/\$orderId'),
      headers: headers,
    );
    return jsonDecode(response.body)['data'];
  }`
    },

    python: {
      auth: `import os
import requests

XONIT_BASE_URL = "${baseUrl}"
XONIT_CLIENT_ID = "${clientId}"
XONIT_API_KEY = os.getenv("XONIT_API_KEY", "xak_live_YOUR_SECRET")

HEADERS = {
    "x-client-id": XONIT_CLIENT_ID,
    "x-api-key": XONIT_API_KEY,
    "Content-Type": "application/json"
}`,
      catalog: `# 1. Fetch Products
def get_products(category=None, limit=20):
    params = {"limit": limit}
    if category:
        params["category"] = category
    res = requests.get(f"{XONIT_BASE_URL}/catalog/products", headers=HEADERS, params=params)
    res.raise_for_status()
    return res.json()["data"]`,
      calculate: `# 2. Calculate Cart
def calculate_cart(items, delivery_zone="COLOMBO_METRO"):
    payload = {"items": items, "deliveryZone": delivery_zone}
    res = requests.post(f"{XONIT_BASE_URL}/checkout/calculate", headers=HEADERS, json=payload)
    res.raise_for_status()
    return res.json()["data"]`,
      order: `# 3. Submit Order
def create_order(order_payload):
    res = requests.post(f"{XONIT_BASE_URL}/orders", headers=HEADERS, json=order_payload)
    res.raise_for_status()
    return res.json()["data"]`,
      payment: `# 4. Initiate Payment
def initiate_payment(order_id, amount, gateway="ONEPAY"):
    payload = {"orderId": order_id, "amount": amount, "gateway": gateway}
    res = requests.post(f"{XONIT_BASE_URL}/payments/initiate", headers=HEADERS, json=payload)
    res.raise_for_status()
    return res.json()["data"]`,
      tracking: `# 5. Track Order
def get_order_status(order_id):
    res = requests.get(f"{XONIT_BASE_URL}/orders/{order_id}", headers=HEADERS)
    res.raise_for_status()
    return res.json()["data"]`
    }
  };

  const flowSteps = [
    {
      step: 1,
      title: "Authentication & Dual Headers",
      badge: "Core Auth",
      desc: "Every headless request must send your public Client ID and scoped API Key secret in HTTP headers.",
      key: "auth"
    },
    {
      step: 2,
      title: "Product Catalog & Inventory",
      badge: "Catalog API",
      desc: "Query live storefront products with real-time stock balances across all registered branches.",
      key: "catalog"
    },
    {
      step: 3,
      title: "Cart & Regional Tax Engine",
      badge: "Checkout Engine",
      desc: "Submit cart line items to compute regional VAT/SSCL, promo discounts, and delivery fees.",
      key: "calculate"
    },
    {
      step: 4,
      title: "Atomic Order Placement",
      badge: "Order Pipeline",
      desc: "Place the order atomically. Reserves branch inventory and queues automatic courier fulfillment.",
      key: "order"
    },
    {
      step: 5,
      title: "Online Payment Initiation",
      badge: "Fintech Gateways",
      desc: "Generate signed payment payloads for OnePay, PayHere, Koko, or LankaQR directly using the encrypted vault.",
      key: "payment"
    },
    {
      step: 6,
      title: "Order Tracking & Fulfillment",
      badge: "Logistics Status",
      desc: "Poll or listen to live order status, courier dispatch codes (Fardar / Koombiyo), and return statuses.",
      key: "tracking"
    }
  ];

  const currentStep = flowSteps.find(s => s.step === activeFlowStep) || flowSteps[0];
  const activeSnippet = (codeSnippets[activeLang] as any)[currentStep.key];

  return (
    <div className="space-y-8 mt-8 border-t border-border pt-8 animate-in fade-in duration-300">
      {/* SECTION HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
              <BookOpen size={18} />
            </div>
            <h2 className="text-xl font-bold text-foreground font-poppins">
              Headless Storefront Integration Guide & Full API Reference
            </h2>
          </div>
          <p className="text-xs text-muted font-inter mt-1 max-w-2xl">
            Complete architectural documentation with verified end-to-end code samples in Next.js 15, TypeScript, Flutter, Python, and cURL. Use XONIT as the centralized operations backend for your web storefronts, mobile apps, or headless marketplaces.
          </p>
        </div>

        {/* Live Client ID Pill */}
        <div className="flex items-center gap-2 bg-surface border border-border rounded-xl px-3 py-1.5 self-start md:self-auto shadow-sm">
          <Shield size={14} className="text-emerald-500" />
          <span className="text-[11px] text-muted font-inter">Active Client ID:</span>
          <span className="font-mono text-xs font-bold text-foreground">{clientId.length > 20 ? clientId.substring(0, 18) + "..." : clientId}</span>
          <button
            onClick={() => handleCopy(clientId, "header-cid")}
            className="text-muted hover:text-foreground ml-1"
            title="Copy Client ID"
          >
            {copiedKey === "header-cid" ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
          </button>
        </div>
      </div>

      {/* QUICKSTART CODE PLAYGROUND */}
      <div className="p-6 rounded-2xl bg-surface border border-border shadow-sm flex flex-col gap-6">
        {/* Step Indicator Tabs */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted font-mono flex items-center gap-1.5">
              <Layers size={14} className="text-primary" /> End-to-End Integration Journey
            </span>
            <span className="text-[11px] text-muted font-inter">Step {activeFlowStep} of 6</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {flowSteps.map((s) => {
              const isActive = s.step === activeFlowStep;
              return (
                <button
                  key={s.step}
                  onClick={() => setActiveFlowStep(s.step)}
                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    isActive
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "bg-background border-border text-foreground hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                      isActive ? "bg-white/20 text-white" : "bg-muted/10 text-muted"
                    }`}>
                      0{s.step}
                    </span>
                    <span className={`text-[9px] font-semibold uppercase ${isActive ? "text-white/80" : "text-muted"}`}>
                      {s.badge}
                    </span>
                  </div>
                  <div className="font-bold text-[11px] font-poppins mt-2 truncate w-full">
                    {s.title}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Step Description & Language Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/60">
          <div>
            <h3 className="text-sm font-bold text-foreground font-poppins flex items-center gap-2">
              <span>{currentStep.title}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                {currentStep.badge}
              </span>
            </h3>
            <p className="text-xs text-muted font-inter mt-0.5">
              {currentStep.desc}
            </p>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-1 bg-background border border-border p-1 rounded-xl shrink-0 self-start sm:self-auto">
            {(["nextjs", "typescript", "flutter", "python", "curl"] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setActiveLang(lang)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold font-mono transition-all capitalize ${
                  activeLang === lang
                    ? "bg-surface text-foreground shadow-sm border border-border"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {lang === "nextjs" ? "Next.js 15" : lang}
              </button>
            ))}
          </div>
        </div>

        {/* Code Snippet Box */}
        <div className="relative group rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
          <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/70 text-xs text-zinc-400 font-mono">
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-primary" />
              <span>
                {activeLang === "nextjs"
                  ? "Next.js App Router (TypeScript)"
                  : activeLang === "flutter"
                  ? "Flutter / Dart SDK"
                  : activeLang === "python"
                  ? "Python 3 Client"
                  : activeLang === "typescript"
                  ? "Node.js / TypeScript"
                  : "cURL / Terminal"}
              </span>
            </div>
            <button
              onClick={() => handleCopy(activeSnippet, "active-snippet")}
              className="flex items-center gap-1 text-[11px] font-semibold text-zinc-400 hover:text-white transition-colors bg-zinc-800/80 px-2.5 py-1 rounded-lg"
            >
              {copiedKey === "active-snippet" ? (
                <>
                  <Check size={12} className="text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-4 text-xs font-mono text-zinc-200 overflow-x-auto leading-relaxed select-all max-h-[380px]">
            {activeSnippet}
          </pre>
        </div>
      </div>

      {/* FULL ENDPOINT REFERENCE DIRECTORY */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground font-poppins">
              Complete Headless REST API Reference
            </h3>
            <p className="text-xs text-muted font-inter">
              All endpoints strictly require <code className="font-mono bg-muted/10 px-1 py-0.5 rounded text-[11px]">x-client-id</code> and <code className="font-mono bg-muted/10 px-1 py-0.5 rounded text-[11px]">x-api-key</code> request headers.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {/* ENDPOINT 1: Catalog Products */}
          <div className="rounded-2xl bg-surface border border-border overflow-hidden transition-all shadow-sm">
            <button
              onClick={() => setExpandedEndpoint(expandedEndpoint === "catalog-products" ? "" : "catalog-products")}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-surface-hover/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  GET
                </span>
                <span className="font-mono text-xs font-bold text-foreground">
                  /catalog/products
                </span>
                <span className="text-xs text-muted font-inter hidden sm:inline">
                  List storefront products with live multi-branch inventory balances
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted/10 text-muted">
                  scope: catalog:read
                </span>
                {expandedEndpoint === "catalog-products" ? <ChevronDown size={16} className="text-muted" /> : <ChevronRight size={16} className="text-muted" />}
              </div>
            </button>

            {expandedEndpoint === "catalog-products" && (
              <div className="p-5 border-t border-border bg-background/50 space-y-4 text-xs font-inter">
                <div>
                  <h4 className="font-bold text-foreground text-[11px] uppercase tracking-wider font-mono mb-1.5">Query Parameters</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border border-border rounded-xl">
                      <thead className="bg-surface text-muted text-[10px] uppercase font-mono border-b border-border">
                        <tr>
                          <th className="p-2.5">Param</th>
                          <th className="p-2.5">Type</th>
                          <th className="p-2.5">Required</th>
                          <th className="p-2.5">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border font-inter text-foreground">
                        <tr>
                          <td className="p-2.5 font-mono text-primary">limit</td>
                          <td className="p-2.5 font-mono text-muted">number</td>
                          <td className="p-2.5 text-muted">Optional (default: 20)</td>
                          <td className="p-2.5 text-muted">Number of products per page (max 100)</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-mono text-primary">page</td>
                          <td className="p-2.5 font-mono text-muted">number</td>
                          <td className="p-2.5 text-muted">Optional (default: 1)</td>
                          <td className="p-2.5 text-muted">Pagination page offset</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-mono text-primary">category</td>
                          <td className="p-2.5 font-mono text-muted">string</td>
                          <td className="p-2.5 text-muted">Optional</td>
                          <td className="p-2.5 text-muted">Filter products by category ID or category slug</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-mono text-primary">search</td>
                          <td className="p-2.5 font-mono text-muted">string</td>
                          <td className="p-2.5 text-muted">Optional</td>
                          <td className="p-2.5 text-muted">Fuzzy search by product name, SKU, or barcode</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-foreground text-[11px] uppercase tracking-wider font-mono mb-1.5">Response (200 OK)</h4>
                  <pre className="p-3 bg-zinc-950 rounded-xl text-emerald-400 font-mono text-[11px] overflow-x-auto border border-zinc-800">
{`{
  "success": true,
  "data": [
    {
      "id": "prod_101",
      "name": "Organic Ceylon Green Tea 250g",
      "slug": "organic-ceylon-green-tea-250g",
      "retailPrice": 1450.00,
      "stockQty": 34,
      "barcode": "479102938120",
      "imageUrl": "https://storage.xonit.space/images/tea-250g.webp",
      "category": { "id": "cat_tea", "name": "Organic Teas" },
      "branches": [
        { "branchId": "br_colombo", "name": "Colombo Central Hub", "stock": 24 },
        { "branchId": "br_kandy", "name": "Kandy City Store", "stock": 10 }
      ]
    }
  ],
  "meta": { "total": 1, "page": 1, "limit": 20 }
}`}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* ENDPOINT 2: Cart Calculation */}
          <div className="rounded-2xl bg-surface border border-border overflow-hidden transition-all shadow-sm">
            <button
              onClick={() => setExpandedEndpoint(expandedEndpoint === "checkout-calc" ? "" : "checkout-calc")}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-surface-hover/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                  POST
                </span>
                <span className="font-mono text-xs font-bold text-foreground">
                  /checkout/calculate
                </span>
                <span className="text-xs text-muted font-inter hidden sm:inline">
                  Calculate subtotal, regional taxes, coupon discounts, and delivery fees
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted/10 text-muted">
                  scope: orders:read
                </span>
                {expandedEndpoint === "checkout-calc" ? <ChevronDown size={16} className="text-muted" /> : <ChevronRight size={16} className="text-muted" />}
              </div>
            </button>

            {expandedEndpoint === "checkout-calc" && (
              <div className="p-5 border-t border-border bg-background/50 space-y-4 text-xs font-inter">
                <div>
                  <h4 className="font-bold text-foreground text-[11px] uppercase tracking-wider font-mono mb-1.5">Request Body (JSON)</h4>
                  <pre className="p-3 bg-zinc-950 rounded-xl text-blue-400 font-mono text-[11px] overflow-x-auto border border-zinc-800">
{`{
  "items": [
    { "productId": "prod_101", "quantity": 2, "unitPrice": 1450 }
  ],
  "deliveryZone": "COLOMBO_METRO",
  "promoCode": "SAVE10"
}`}
                  </pre>
                </div>

                <div>
                  <h4 className="font-bold text-foreground text-[11px] uppercase tracking-wider font-mono mb-1.5">Response (200 OK)</h4>
                  <pre className="p-3 bg-zinc-950 rounded-xl text-emerald-400 font-mono text-[11px] overflow-x-auto border border-zinc-800">
{`{
  "success": true,
  "data": {
    "subtotal": 2900.00,
    "discountAmount": 290.00,
    "taxAmount": 0.00,
    "deliveryFee": 350.00,
    "total": 2960.00,
    "currency": "LKR",
    "stockAvailable": true,
    "appliedPromo": { "code": "SAVE10", "discountPct": 10 }
  }
}`}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* ENDPOINT 3: Submit Order */}
          <div className="rounded-2xl bg-surface border border-border overflow-hidden transition-all shadow-sm">
            <button
              onClick={() => setExpandedEndpoint(expandedEndpoint === "order-create" ? "" : "order-create")}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-surface-hover/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  POST
                </span>
                <span className="font-mono text-xs font-bold text-foreground">
                  /orders
                </span>
                <span className="text-xs text-muted font-inter hidden sm:inline">
                  Atomically submit storefront order, lock inventory, and trigger dispatch pipelines
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted/10 text-muted">
                  scope: orders:create
                </span>
                {expandedEndpoint === "order-create" ? <ChevronDown size={16} className="text-muted" /> : <ChevronRight size={16} className="text-muted" />}
              </div>
            </button>

            {expandedEndpoint === "order-create" && (
              <div className="p-5 border-t border-border bg-background/50 space-y-4 text-xs font-inter">
                <div>
                  <h4 className="font-bold text-foreground text-[11px] uppercase tracking-wider font-mono mb-1.5">Request Body (JSON)</h4>
                  <pre className="p-3 bg-zinc-950 rounded-xl text-amber-400 font-mono text-[11px] overflow-x-auto border border-zinc-800">
{`{
  "customer": {
    "name": "Kamal Perera",
    "email": "kamal@perera.lk",
    "phone": "+94771234567"
  },
  "deliveryAddress": {
    "street": "142 Havelock Road",
    "city": "Colombo 05",
    "postalCode": "00500"
  },
  "items": [
    { "productId": "prod_101", "quantity": 2, "unitPrice": 1450 }
  ],
  "paymentMethod": "ONEPAY", // Options: ONEPAY, PAYHERE, KOKO, COD, LKR_TRANSFER
  "deliveryFee": 350.00,
  "notes": "Please call before dispatch"
}`}
                  </pre>
                </div>

                <div>
                  <h4 className="font-bold text-foreground text-[11px] uppercase tracking-wider font-mono mb-1.5">Response (201 Created)</h4>
                  <pre className="p-3 bg-zinc-950 rounded-xl text-emerald-400 font-mono text-[11px] overflow-x-auto border border-zinc-800">
{`{
  "success": true,
  "data": {
    "id": "ord_9901726a",
    "orderNumber": "ORD-202610-1092",
    "status": "PENDING",
    "paymentStatus": "UNPAID",
    "total": 3250.00,
    "currency": "LKR",
    "customer": { "id": "cust_4401", "name": "Kamal Perera" },
    "createdAt": "2026-10-25T02:45:00.000Z"
  }
}`}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* ENDPOINT 4: Initiate Payment Session */}
          <div className="rounded-2xl bg-surface border border-border overflow-hidden transition-all shadow-sm">
            <button
              onClick={() => setExpandedEndpoint(expandedEndpoint === "payment-initiate" ? "" : "payment-initiate")}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-surface-hover/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-pink-500/10 text-pink-500 border border-pink-500/20">
                  POST
                </span>
                <span className="font-mono text-xs font-bold text-foreground">
                  /payments/initiate
                </span>
                <span className="text-xs text-muted font-inter hidden sm:inline">
                  Initiate OnePay, PayHere, or Koko BNPL transaction using tenant credentials vault
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted/10 text-muted">
                  scope: payments:process
                </span>
                {expandedEndpoint === "payment-initiate" ? <ChevronDown size={16} className="text-muted" /> : <ChevronRight size={16} className="text-muted" />}
              </div>
            </button>

            {expandedEndpoint === "payment-initiate" && (
              <div className="p-5 border-t border-border bg-background/50 space-y-4 text-xs font-inter">
                <div>
                  <h4 className="font-bold text-foreground text-[11px] uppercase tracking-wider font-mono mb-1.5">Request Body (JSON)</h4>
                  <pre className="p-3 bg-zinc-950 rounded-xl text-pink-400 font-mono text-[11px] overflow-x-auto border border-zinc-800">
{`{
  "gateway": "ONEPAY", // Options: ONEPAY, PAYHERE, KOKO, LANKA_QR
  "orderId": "ord_9901726a",
  "amount": 3250.00,
  "currency": "LKR",
  "customerName": "Kamal Perera",
  "customerEmail": "kamal@perera.lk",
  "customerPhone": "+94771234567",
  "returnUrl": "https://mystore.lk/checkout/complete"
}`}
                  </pre>
                </div>

                <div>
                  <h4 className="font-bold text-foreground text-[11px] uppercase tracking-wider font-mono mb-1.5">Response (200 OK)</h4>
                  <pre className="p-3 bg-zinc-950 rounded-xl text-emerald-400 font-mono text-[11px] overflow-x-auto border border-zinc-800">
{`{
  "success": true,
  "data": {
    "gateway": "ONEPAY",
    "orderId": "ord_9901726a",
    "redirectUrl": "https://ipg.onepay.lk/payment/session/4819a-9921b",
    "paymentReference": "OP-202610-44910",
    "status": "INITIATED"
  }
}`}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
