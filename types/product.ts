export interface ProductVariant {
  id: string;
  productId: string;
  name: string | null;
  sku: string | null;
  barcode?: string | null;
  price: number;
  salePrice: number | null;
  costPrice?: number;
  wholesalePrice?: number | null;
  packUnit?: string | null;
  unitVolumeLiters?: number | null;
  stockStatus: string;
  quantity: number;
  color: string | null;
  size: string | null;
  featuredImage: string | null;
  gallery: string[];
  flashSaleItems?: {
    salePrice: number;
    flashSale: {
      name: string;
      discount: number;
      status: string;
      startDate: string | null;
      endDate: string | null;
    };
  }[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  excerpt: string | null;
  categoryId: string | null;
  category?: { id: string; name: string; slug: string; };
  status?: string;
  productType?: string; // LUBRICANT, FILTER, BATTERY, CAR_CARE, SPARE_PART, ACCESSORY, SERVICE, GENERAL
  brand?: string | null;
  viscosity?: string | null;
  oilType?: string | null;
  apiStandard?: string | null;
  partNumber?: string | null;
  compatibleVehicles?: string | null;
  allowedPaymentMethods?: string[];
  sizeGuideEnabled?: boolean;
  sizeGuideContent?: string | null;
  sizeGuideImageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  variants?: ProductVariant[];
}
