import { api } from './api';

export interface TenantSummary {
  id: string;
  name: string;
  slug: string;
  businessType: 'RETAIL' | 'RESTAURANT_CAFE' | 'SALON_SPA' | 'PHARMACY_CLINIC' | 'GROCERY_SUPERMARKET' | 'AUTOMOTIVE_SERVICES' | 'WHOLESALE_DISTRIBUTION' | 'GENERAL_SERVICES';
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'CANCELLED';
  subscriptionTier: 'FREE_TRIAL' | 'STARTER' | 'STANDARD' | 'PROFESSIONAL' | 'ENTERPRISE';
  maxBranches: number;
  maxUsers: number;
  currency: string;
  currencySymbol: string;
  timezone: string;
  taxRate: number;
  logoUrl?: string;
  settings?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  _count?: {
    branches: number;
    products: number;
    orders: number;
    users: number;
  };
}

export interface ProvisionTenantPayload {
  name: string;
  slug?: string;
  businessType: TenantSummary['businessType'];
  subscriptionTier?: TenantSummary['subscriptionTier'];
  maxBranches?: number;
  maxUsers?: number;
  currency?: string;
  currencySymbol?: string;
  timezone?: string;
  taxRate?: number;
  logoUrl?: string;
  initialBranchName?: string;
  initialBranchCode?: string;
  adminUser: {
    email: string;
    password: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
}

export interface TenantUsageResponse {
  tenantId: string;
  name: string;
  slug: string;
  businessType: string;
  subscriptionTier: string;
  status: string;
  branches: {
    current: number;
    max: number;
    canAddMore: boolean;
    usagePercent: number;
  };
  users: {
    current: number;
    max: number;
    canAddMore: boolean;
    usagePercent: number;
  };
  totalProducts: number;
  totalOrders: number;
}

export interface PlatformOverviewResponse {
  tenants: {
    total: number;
    active: number;
    suspended: number;
    trial: number;
    cancelled: number;
    byStatus: Record<string, number>;
    byBusinessType: Record<string, number>;
    bySubscriptionTier: Record<string, number>;
  };
  infrastructure: {
    totalBranches: number;
    totalUsers: number;
  };
  commerce: {
    totalPaidOrders: number;
    totalPlatformVolume: number;
  };
}

export const tenantService = {
  /**
   * Provision a brand-new business tenant with admin user and industry catalog presets.
   */
  async provisionTenant(payload: ProvisionTenantPayload) {
    const { data } = await api.post<{ success: boolean; data: any }>('/tenants/provision', payload);
    return data.data;
  },

  /**
   * List all tenants across the platform.
   */
  async getAllTenants(params?: { search?: string; status?: string; businessType?: string; subscriptionTier?: string }) {
    const { data } = await api.get<{ success: boolean; data: TenantSummary[] }>('/tenants', { params });
    return data.data;
  },

  /**
   * Get single tenant details.
   */
  async getTenantById(id: string) {
    const { data } = await api.get<{ success: boolean; data: TenantSummary }>('/tenants/' + id);
    return data.data;
  },

  /**
   * Get tenant resource usage against quotas.
   */
  async getTenantUsage(id: string) {
    const { data } = await api.get<{ success: boolean; data: TenantUsageResponse }>('/tenants/' + id + '/usage');
    return data.data;
  },

  /**
   * Update tenant operating status (ACTIVE, SUSPENDED, TRIAL, CANCELLED).
   */
  async updateTenantStatus(id: string, status: TenantSummary['status'], reason?: string) {
    const { data } = await api.patch<{ success: boolean; data: TenantSummary }>('/tenants/' + id + '/status', { status, reason });
    return data.data;
  },

  /**
   * Update tenant plan and quotas.
   */
  async updateTenantPlan(id: string, update: { subscriptionTier?: string; maxBranches?: number; maxUsers?: number; settings?: any }) {
    const { data } = await api.patch<{ success: boolean; data: TenantSummary }>('/tenants/' + id + '/plan', update);
    return data.data;
  },

  /**
   * Retrieve platform-wide SaaS KPIs and health overview.
   */
  async getPlatformOverview() {
    const { data } = await api.get<{ success: boolean; data: PlatformOverviewResponse }>('/tenants/overview');
    return data.data;
  },
};
