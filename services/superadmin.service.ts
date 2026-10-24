import { api } from './api';

export interface PlatformKPIs {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  suspendedTenants: number;
  cancelledTenants: number;
  totalBranches: number;
  totalUsers: number;
  platformGmvLkr: number;
  totalOrders: number;
  mrrLkr: number;
  arrLkr: number;
}

export interface PlatformExpenseItem {
  id: string;
  category: 'CLOUD_SERVERS' | 'DATABASE' | 'REDIS_CACHE' | 'SMS_GATEWAY' | 'SECURITY_SSL' | 'OPERATIONS';
  amountLkr: number;
  vendor: string;
  description: string;
  recordedAt: string;
}

export interface PlatformFinancials {
  mrrLkr: number;
  arrLkr: number;
  grossSubscriptionRevenueLkr: number;
  gatewayMarginRevenueLkr: number;
  totalInflowLkr: number;
  totalPlatformExpensesLkr: number;
  netSaaSProfitLkr: number;
  profitMarginPercent: number;
  expensesBreakdown: PlatformExpenseItem[];
  recentInvoices: Array<{
    id: string;
    tenantName?: string;
    amountLkr: number;
    billingCycle?: string;
    status: string;
    invoiceNumber: string;
    issuedAt: string;
  }>;
}

export interface TenantRegistryItem {
  id: string;
  name: string;
  slug: string;
  businessType: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'CANCELLED';
  subscriptionTier: string;
  maxBranches: number;
  maxUsers: number;
  branchesCount: number;
  usersCount: number;
  productsCount: number;
  ordersCount: number;
  createdAt: string;
  settings?: any;
}

export interface ClusterTelemetry {
  database: {
    status: 'HEALTHY' | 'DEGRADED' | 'ONLINE' | 'OFFLINE';
    latencyMs: number;
  };
  redis: {
    status: 'ONLINE' | 'OFFLINE' | 'DEGRADED';
    latencyMs: number;
  };
  cpu?: {
    cores: number;
    model: string;
    loadAvg: {
      '1m': number;
      '5m': number;
      '15m': number;
    };
    usagePercentage: number;
  };
  memory?: {
    totalMb: number;
    usedMb: number;
    freeMb: number;
    percentage: number;
    processRssMb: number;
    processHeapUsedMb: number;
  };
  disk?: {
    totalGb: number;
    usedGb: number;
    freeGb: number;
    percentage: number;
  };
  alerts?: Array<{
    severity: 'WARNING' | 'CRITICAL' | 'INFO';
    title: string;
    message: string;
    timestamp: string;
  }>;
  schedulers: Array<{
    name: string;
    schedule: string;
    status: 'ACTIVE';
  }>;
  uptimeSeconds: number;
  uptimeFormatted?: string;
}

export interface MonthlyAnalyticsSeriesItem {
  month: string;
  monthKey: string;
  revenueLkr: number;
  gmvLkr: number;
  orderCount: number;
  newTenantsCount: number;
}

export interface PlatformMoMGrowth {
  mrrGrowthPct: number;
  tenantsGrowthPct: number;
  gmvGrowthPct: number;
  ordersGrowthPct: number;
}

export interface MonthlyAnalyticsResponse {
  series: MonthlyAnalyticsSeriesItem[];
  momGrowth: PlatformMoMGrowth;
}

export interface PlatformRevenueStream {
  id: string;
  name: string;
  amountLkr: number;
  pct: number;
  color: string;
  dotClass: string;
  highlight?: boolean;
}

export interface PlatformRevenueBreakdownResponse {
  totalInflowLkr: number;
  streams: PlatformRevenueStream[];
}

export interface TopOutletPerformanceItem {
  id: string;
  branchName: string;
  tenantName: string;
  businessType: string;
  totalOrders: number;
  gmvLkr: number;
  velocityPct: number;
}

export const superAdminService = {
  async getMonthlyAnalytics(): Promise<MonthlyAnalyticsResponse> {
    const res = await api.get('/superadmin/analytics/monthly');
    return res.data.data;
  },

  async getRevenueBreakdown(): Promise<PlatformRevenueBreakdownResponse> {
    const res = await api.get('/superadmin/analytics/breakdown');
    return res.data.data;
  },

  async getTopOutlets(limit = 5): Promise<TopOutletPerformanceItem[]> {
    const res = await api.get('/superadmin/analytics/top-outlets', { params: { limit } });
    return res.data.data;
  },

  async getKPIs(): Promise<PlatformKPIs> {
    const res = await api.get('/superadmin/kpis');
    return res.data.data;
  },

  async getFinancials(): Promise<PlatformFinancials> {
    const res = await api.get('/superadmin/financials');
    return res.data.data;
  },

  async addExpense(expense: Omit<PlatformExpenseItem, 'id' | 'recordedAt'>): Promise<PlatformExpenseItem> {
    const res = await api.post('/superadmin/expenses', expense);
    return res.data.data;
  },

  async getTenants(params?: { search?: string; status?: string; businessType?: string }): Promise<TenantRegistryItem[]> {
    const res = await api.get('/superadmin/tenants', { params });
    return res.data.data;
  },

  async updateTenantStatus(tenantId: string, status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'CANCELLED'): Promise<any> {
    const res = await api.patch(`/superadmin/tenants/${tenantId}/status`, { status });
    return res.data.data;
  },

  async extendTrial(tenantId: string, days = 14): Promise<any> {
    const res = await api.patch(`/superadmin/tenants/${tenantId}/trial`, { days });
    return res.data.data;
  },

  async provisionTenant(payload: any): Promise<any> {
    const res = await api.post('/superadmin/tenants/provision', payload);
    return res.data.data;
  },

  async getClusterTelemetry(): Promise<ClusterTelemetry> {
    const res = await api.get('/superadmin/cluster');
    return res.data.data;
  },

  async getTelemetry(): Promise<ClusterTelemetry> {
    return this.getClusterTelemetry();
  },

  async recordExpense(expense: Omit<PlatformExpenseItem, 'id' | 'recordedAt'>): Promise<PlatformExpenseItem> {
    return this.addExpense(expense);
  },

  async updatePlanPrice(tier: string, monthlyLkr: number): Promise<any> {
    const res = await api.patch(`/superadmin/plans/${tier}/price`, { monthlyLkr });
    return res.data.data;
  },

  async generateInvoice(payload: { tenantId: string; billingCycle?: string; amountLkr?: number }): Promise<any> {
    const res = await api.post('/superadmin/invoices', payload);
    return res.data.data;
  },

  async updateInvoiceStatus(invoiceId: string, status: string): Promise<any> {
    const res = await api.patch(`/superadmin/invoices/${invoiceId}/status`, { status });
    return res.data.data;
  },
};
