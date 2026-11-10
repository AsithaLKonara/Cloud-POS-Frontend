import { api } from "./api";

export interface WarrantyKPIs {
  activeSerials: number;
  openClaims: number;
  resolvedMonth: number;
  avgTatDays: number;
  statusBreakdown: {
    received: number;
    inDiagnosis: number;
    sentToVendor: number;
    repaired: number;
    replaced: number;
    rejected: number;
    closed: number;
  };
}

export interface WarrantyClaim {
  id: string;
  claimNumber: string;
  tenantId: string;
  branchId?: string;
  customerId?: string;
  orderId?: string;
  variantId?: string;
  productVariantId?: string;
  productSerialId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  serialNumber?: string;
  productName?: string;
  imei?: string;
  status: 'RECEIVED' | 'IN_DIAGNOSIS' | 'AWAITING_PARTS' | 'SENT_TO_VENDOR' | 'REPAIRED' | 'REPLACED' | 'REJECTED' | 'CLOSED';
  issueDescription: string;
  reportedDefect?: string;
  physicalCondition?: string;
  accessoryNotes?: string;
  diagnosticNotes?: string;
  technicianNotes?: string;
  technicianName?: string;
  resolutionNotes?: string;
  resolutionType?: string;
  replacementSerial?: string;
  replacementSerialId?: string;
  repairCost?: number;
  customerCharge?: number;
  laborCost?: number;
  partsCost?: number;
  totalCost?: number;
  isCovered?: boolean;
  receivedAt: string;
  repairedAt?: string;
  completedAt?: string;
  closedAt?: string;
  customer?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
  productVariant?: {
    id: string;
    name: string;
    sku?: string;
    product?: {
      name: string;
      warrantyPeriodMonths?: number;
      warrantyPolicy?: string;
    };
  };
  order?: {
    orderNumber: string;
    createdAt: string;
  };
  branch?: {
    name: string;
  };
  logs?: Array<{
    id: string;
    previousStatus?: string;
    newStatus: string;
    action: string;
    notes?: string;
    performedBy?: string;
    createdAt: string;
  }>;
}

export interface ProductSerialItem {
  id: string;
  serialNumber: string;
  imei?: string;
  status: 'IN_STOCK' | 'SOLD' | 'UNDER_WARRANTY' | 'REPLACED' | 'DEFECTIVE';
  warrantyMonths: number;
  warrantyStartsAt?: string;
  warrantyExpiresAt?: string;
  activatedAt?: string;
  productVariant?: {
    name: string;
    sku?: string;
    product?: {
      name: string;
    };
  };
  branch?: {
    name: string;
  };
  orderItem?: {
    order?: {
      orderNumber: string;
      customer?: {
        name: string;
        phone: string;
      };
    };
  };
}

export const warrantyService = {
  getKPIs: async (): Promise<WarrantyKPIs> => {
    const res = await api.get("/warranty/kpis");
    return res.data?.data || res.data;
  },

  getClaims: async (params?: { page?: number; limit?: number; search?: string; status?: string; branchId?: string }) => {
    const res = await api.get("/warranty/claims", { params });
    return res.data?.data || res.data;
  },

  getClaimById: async (claimId: string): Promise<WarrantyClaim> => {
    const res = await api.get(`/warranty/claims/${claimId}`);
    return res.data?.data || res.data;
  },

  createClaim: async (data: {
    productVariantId: string;
    serialNumber?: string;
    imei?: string;
    customerId?: string;
    orderId?: string;
    branchId?: string;
    issueDescription: string;
    reportedDefect?: string;
    physicalCondition?: string;
    isCovered?: boolean;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
  }): Promise<WarrantyClaim> => {
    const res = await api.post("/warranty/claims", data);
    return res.data?.data || res.data;
  },

  updateClaimStatus: async (claimId: string, data: {
    status: string;
    diagnosticNotes?: string;
    resolutionNotes?: string;
    replacementSerialNumber?: string;
    laborCost?: number;
    partsCost?: number;
    notes?: string;
    performedBy?: string;
  }): Promise<WarrantyClaim> => {
    const res = await api.put(`/warranty/claims/${claimId}/status`, data);
    return res.data?.data || res.data;
  },

  getSerials: async (params?: { page?: number; limit?: number; search?: string; status?: string; branchId?: string; variantId?: string }) => {
    const res = await api.get("/warranty/serials", { params });
    return res.data?.data || res.data;
  },

  registerSerial: async (data: {
    variantId: string;
    serialNumber: string;
    imei?: string;
    branchId?: string;
    warrantyMonths?: number;
  }) => {
    const res = await api.post("/warranty/serials", data);
    return res.data?.data || res.data;
  },

  bulkRegisterSerials: async (data: {
    variantId: string;
    serialNumbers: string[];
    branchId?: string;
  }) => {
    const res = await api.post("/warranty/serials/bulk", data);
    return res.data?.data || res.data;
  },

  checkWarrantyStatus: async (params: { serialNumber?: string; imei?: string; orderNumber?: string; phone?: string; tenantId?: string }) => {
    const res = await api.get("/warranty/check", { params });
    return res.data?.data || res.data;
  },
};
