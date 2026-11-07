"use client";

import { v4 as uuidv4 } from "uuid";

export interface OfflineOrderPayload {
  id: string;
  idempotencyKey: string;
  createdAt: string;
  branchId: string;
  sessionId: string;
  customerId?: string;
  items: Array<{
    id?: string;
    variantId: string;
    name: string;
    price: number;
    qty: number;
  }>;
  paymentMethod: string;
  subtotal: number;
  total: number;
  discount?: number;
  appliedVouchers?: string[];
  notes?: string;
  synced: boolean;
}

const STORAGE_CATALOG_KEY = "xonit_offline_catalog";
const STORAGE_QUEUE_KEY = "xonit_offline_order_queue";

export class OfflineStorageManager {
  /**
   * Caches products locally for offline scanning and checkout
   */
  static cacheCatalog(products: any[]): void {
    if (typeof window === "undefined" || !products || !Array.isArray(products)) return;
    try {
      localStorage.setItem(STORAGE_CATALOG_KEY, JSON.stringify(products));
    } catch (e) {
      console.warn("Offline cache storage quota exceeded", e);
    }
  }

  /**
   * Retrieves locally cached products
   */
  static getCachedCatalog(): any[] {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem(STORAGE_CATALOG_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Finds matching product or variant from offline cache by barcode, SKU, or name
   */
  static findOfflineItem(query: string): { product: any; variant: any } | null {
    const catalog = this.getCachedCatalog();
    if (!catalog || catalog.length === 0) return null;

    const term = query.trim().toLowerCase();

    // Check if this is an embedded scale barcode (20-29 prefix, 12-13 digits)
    let scaleItemCode: string | null = null;
    let scaleWeightKg: number | null = null;
    if (term.length >= 12 && term.length <= 13 && /^(2[0-9])/.test(term)) {
      scaleItemCode = term.substring(2, 7);
      const val = parseInt(term.substring(7, 12), 10);
      if (!isNaN(val)) scaleWeightKg = val / 1000;
    }

    for (const product of catalog) {
      if (product.variants && Array.isArray(product.variants)) {
        for (const variant of product.variants) {
          const sku = variant.sku?.toLowerCase() || '';
          const barcode = variant.barcode?.toLowerCase() || '';
          if (
            sku === term ||
            barcode === term ||
            variant.id?.toLowerCase() === term ||
            product.id?.toLowerCase() === term ||
            (scaleItemCode && (sku.includes(scaleItemCode) || barcode.includes(scaleItemCode)))
          ) {
            const productWithScale = scaleWeightKg ? { ...product, scaleData: { isScaleBarcode: true, weightKg: scaleWeightKg, itemCode: scaleItemCode } } : product;
            return { product: productWithScale, variant };
          }
        }
      }
      if (product.name?.toLowerCase().includes(term) || product.slug?.toLowerCase() === term) {
        const defaultVariant = product.variants?.[0];
        if (defaultVariant) {
          return { product, variant: defaultVariant };
        }
      }
    }
    return null;
  }

  /**
   * Enqueues an offline order with an idempotency key
   */
  static queueOfflineOrder(data: Omit<OfflineOrderPayload, "id" | "idempotencyKey" | "createdAt" | "synced">): OfflineOrderPayload {
    const queue = this.getQueuedOrders();
    const order: OfflineOrderPayload = {
      ...data,
      id: `OFF-${Date.now()}`,
      idempotencyKey: uuidv4(),
      createdAt: new Date().toISOString(),
      synced: false,
    };

    queue.push(order);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_QUEUE_KEY, JSON.stringify(queue));
    }
    return order;
  }

  /**
   * Returns all queued offline orders
   */
  static getQueuedOrders(): OfflineOrderPayload[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /**
   * Flushes queued orders against the backend idempotently
   */
  static async syncQueuedOrders(syncFn: (order: OfflineOrderPayload) => Promise<any>): Promise<{ synced: number; failed: number }> {
    const queue = this.getQueuedOrders();
    if (queue.length === 0) return { synced: 0, failed: 0 };

    let synced = 0;
    let failed = 0;
    const remaining: OfflineOrderPayload[] = [];

    for (const order of queue) {
      try {
        await syncFn(order);
        synced++;
      } catch (err) {
        console.error(`Failed to sync offline order ${order.id}:`, err);
        failed++;
        remaining.push(order);
      }
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_QUEUE_KEY, JSON.stringify(remaining));
    }

    return { synced, failed };
  }

  /**
   * Clears synced queue
   */
  static clearQueue(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_QUEUE_KEY);
    }
  }
}

