import { api } from './api';

export interface PlanConfig {
  key: string;
  name: string;
  badge?: string;
  description?: string;
  monthlyLkr: number;
  quarterlyLkr: number;
  annualLkr: number;
  maxBranches: number;
  maxUsers: number;
  trialDays: number;
  features: string[];
  isPopular?: boolean;
  isActive?: boolean;
  color?: string;
  subscriberCount?: number;
  totalMrrLkr?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface GlobalFeatureFlag {
  key: string;
  name: string;
  description: string;
  category: string;
  minTier: 'STARTER' | 'GROWTH' | 'ENTERPRISE';
  defaultEnabled: boolean;
  isGloballyEnabled: boolean;
  settingKey: string;
  updatedAt?: string;
}

export interface TenantEntitlementItem {
  key: string;
  name: string;
  description: string;
  category: string;
  minTier: 'STARTER' | 'GROWTH' | 'ENTERPRISE';
  isGloballyEnabled: boolean;
  override: boolean | null;
  tierIncluded: boolean;
  effective: boolean;
  source: 'GLOBAL_DISABLED' | 'OVERRIDE_ENABLED' | 'OVERRIDE_DISABLED' | 'TIER_INCLUDED' | 'TIER_EXCLUDED';
  reason: string;
}

export interface TenantEntitlementsData {
  tenant: {
    id: string;
    name: string;
    slug: string;
    subscriptionTier: string;
  };
  entitlements: TenantEntitlementItem[];
  overrides: Record<string, boolean | null>;
}

export interface GlobalAuditLogItem {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  oldData?: any;
  newData?: any;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  user?: {
    id: string;
    name?: string;
    email: string;
  } | null;
  tenant?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface AuditStatsResponse {
  totalEvents: number;
  events24h: number;
  impersonationCount: number;
  securityEvents: number;
}

export interface GlobalAuditResponse {
  logs: GlobalAuditLogItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DelinquentTenantItem {
  tenantId: string;
  name: string;
  slug: string;
  businessType: string;
  status: string;
  subscriptionTier: string;
  delinquencyStatus: 'IN_GRACE_PERIOD' | 'OVERDUE' | 'SUSPENDED_DELINQUENT' | 'EXEMPT' | 'HEALTHY';
  daysOverdue: number;
  graceExpiresAt: string | null;
  periodEnd: string | null;
  amountAtRiskLkr: number;
  isExempt: boolean;
  notes?: string;
}

export interface DunningOverviewResponse {
  kpis: {
    totalDelinquentCount: number;
    atRiskMrrLkr: number;
    inGraceCount: number;
    overdueCount: number;
    suspendedCount: number;
    exemptCount: number;
  };
  tenants: DelinquentTenantItem[];
}

export interface BroadcastAnnouncement {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'MAINTENANCE' | 'CRITICAL_ALERT' | 'NEW_FEATURE';
  targetAudience: 'ALL_TENANTS' | 'TIER_SPECIFIC' | 'BUSINESS_TYPE';
  targetTier?: 'STARTER' | 'GROWTH' | 'ENTERPRISE';
  targetBusinessType?: string;
  isSticky: boolean;
  isActive: boolean;
  actionUrl?: string;
  actionLabel?: string;
  startsAt: string;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface DatabaseBackupItem {
  filename: string;
  filepath: string;
  sizeBytes: number;
  sizeFormatted: string;
  createdAt: string;
  checksumSha256?: string;
  status: 'VERIFIED' | 'PENDING' | 'CORRUPTED';
  type: 'SCHEDULED' | 'MANUAL';
  label?: string;
}

export interface TenantStorageQuotaItem {
  tenantId: string;
  name: string;
  slug: string;
  tier: string;
  quotaBytes: number;
  quotaFormatted: string;
  usedBytes: number;
  usedFormatted: string;
  usagePct: number;
  totalProducts: number;
  totalOrders: number;
  totalMediaFiles: number;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
}

export interface PlatformStorageStatsResponse {
  summary: {
    totalBackupCount: number;
    totalBackupSizeBytes: number;
    totalBackupSizeFormatted: string;
    totalMediaUploadsBytes: number;
    totalMediaUploadsFormatted: string;
    totalDiskUsedBytes: number;
    totalDiskUsedFormatted: string;
    schedulerStatus: string;
    retentionDays: number;
  };
  backups: DatabaseBackupItem[];
  tenantQuotas: TenantStorageQuotaItem[];
}

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

  async getPlans(): Promise<PlanConfig[]> {
    const res = await api.get('/superadmin/plans');
    return res.data.data;
  },

  async createPlan(data: Partial<PlanConfig>): Promise<PlanConfig> {
    const res = await api.post('/superadmin/plans', data);
    return res.data.data;
  },

  async updatePlan(planKey: string, data: Partial<PlanConfig>): Promise<PlanConfig> {
    const res = await api.put(`/superadmin/plans/${planKey}`, data);
    return res.data.data;
  },

  async deletePlan(planKey: string): Promise<any> {
    const res = await api.delete(`/superadmin/plans/${planKey}`);
    return res.data;
  },

  async assignPlanToTenant(tenantId: string, payload: { planKey: string; billingCycle?: string; customPriceLkr?: number }): Promise<any> {
    const res = await api.post(`/superadmin/tenants/${tenantId}/assign-plan`, payload);
    return res.data;
  },

  async generateInvoice(payload: { tenantId: string; billingCycle?: string; amountLkr?: number }): Promise<any> {
    const res = await api.post('/superadmin/invoices', payload);
    return res.data.data;
  },

  async updateInvoiceStatus(invoiceId: string, status: string): Promise<any> {
    const res = await api.patch(`/superadmin/invoices/${invoiceId}/status`, { status });
    return res.data.data;
  },

  async getTenantAdmins(tenantId: string): Promise<any[]> {
    const res = await api.get(`/superadmin/tenants/${tenantId}/admins`);
    return res.data.data;
  },

  async createTenantAdmin(tenantId: string, payload: { email: string; password: string; name?: string; phone?: string; branchId?: string }): Promise<any> {
    const res = await api.post(`/superadmin/tenants/${tenantId}/admins`, payload);
    return res.data.data;
  },

  async updateTenantAdminStatus(tenantId: string, adminId: string, status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE'): Promise<any> {
    const res = await api.patch(`/superadmin/tenants/${tenantId}/admins/${adminId}/status`, { status });
    return res.data.data;
  },

  async resetTenantAdminPassword(tenantId: string, adminId: string, newPassword?: string): Promise<any> {
    const res = await api.post(`/superadmin/tenants/${tenantId}/admins/${adminId}/reset-password`, { newPassword });
    return res.data.data;
  },

  async impersonateTenant(tenantId: string): Promise<{
    accessToken: string;
    user: any;
    redirectTo: string;
  }> {
    const res = await api.post(`/superadmin/tenants/${tenantId}/impersonate`);
    return res.data.data;
  },

  async getFeatureFlags(): Promise<GlobalFeatureFlag[]> {
    const res = await api.get('/superadmin/features');
    return res.data.data;
  },

  async updateGlobalFeatureFlag(key: string, isEnabled: boolean): Promise<GlobalFeatureFlag> {
    const res = await api.patch(`/superadmin/features/global/${key}`, { isEnabled });
    return res.data.data;
  },

  async getTenantEntitlements(tenantId: string): Promise<TenantEntitlementsData> {
    const res = await api.get(`/superadmin/tenants/${tenantId}/entitlements`);
    return res.data.data;
  },

  async updateTenantEntitlements(
    tenantId: string,
    overrides: Record<string, boolean | null>
  ): Promise<TenantEntitlementsData> {
    const res = await api.put(`/superadmin/tenants/${tenantId}/entitlements`, { overrides });
    return res.data.data;
  },

  async getGlobalAuditLogs(params?: Record<string, any>): Promise<GlobalAuditResponse> {
    const res = await api.get('/superadmin/audit', { params });
    return res.data.data;
  },

  async getAuditStats(): Promise<AuditStatsResponse> {
    const res = await api.get('/superadmin/audit/stats');
    return res.data.data;
  },

  async getDunningOverview(): Promise<DunningOverviewResponse> {
    const res = await api.get('/superadmin/dunning');
    return res.data.data;
  },

  async extendGracePeriod(tenantId: string, days: number = 7): Promise<any> {
    const res = await api.post(`/superadmin/dunning/tenants/${tenantId}/extend-grace`, { days });
    return res.data.data;
  },

  async toggleDunningExemption(tenantId: string, isExempt: boolean): Promise<any> {
    const res = await api.post(`/superadmin/dunning/tenants/${tenantId}/exemption`, { isExempt });
    return res.data.data;
  },

  async triggerDunningScan(): Promise<any> {
    const res = await api.post('/superadmin/dunning/run');
    return res.data.data;
  },

  async getAnnouncements(): Promise<BroadcastAnnouncement[]> {
    const res = await api.get('/superadmin/announcements');
    return res.data.data;
  },

  async createAnnouncement(data: Partial<BroadcastAnnouncement>): Promise<BroadcastAnnouncement> {
    const res = await api.post('/superadmin/announcements', data);
    return res.data.data;
  },

  async updateAnnouncement(id: string, data: Partial<BroadcastAnnouncement>): Promise<BroadcastAnnouncement> {
    const res = await api.put(`/superadmin/announcements/${id}`, data);
    return res.data.data;
  },

  async toggleAnnouncement(id: string): Promise<BroadcastAnnouncement> {
    const res = await api.patch(`/superadmin/announcements/${id}/toggle`);
    return res.data.data;
  },

  async deleteAnnouncement(id: string): Promise<any> {
    const res = await api.delete(`/superadmin/announcements/${id}`);
    return res.data;
  },

  async getActiveBroadcasts(tenantId?: string): Promise<BroadcastAnnouncement[]> {
    const res = await api.get('/announcements/active', { params: tenantId ? { tenantId } : undefined });
    return res.data.data;
  },

  async getBackups(): Promise<DatabaseBackupItem[]> {
    const res = await api.get('/superadmin/backups');
    return res.data.data;
  },

  async createBackup(label?: string): Promise<DatabaseBackupItem> {
    const res = await api.post('/superadmin/backups', { label });
    return res.data.data;
  },

  async deleteBackup(filename: string): Promise<any> {
    const res = await api.delete(`/superadmin/backups/${encodeURIComponent(filename)}`);
    return res.data;
  },

  async getStorageStats(): Promise<PlatformStorageStatsResponse> {
    const res = await api.get('/superadmin/storage/stats');
    return res.data.data;
  },

  async getWhatsAppTelemetry(): Promise<any> {
    const res = await api.get('/superadmin/whatsapp/telemetry');
    return res.data.data;
  },

  async getWhatsAppTenants(): Promise<any> {
    const res = await api.get('/superadmin/whatsapp/tenants');
    return res.data.data;
  },

  async broadcastWhatsAppNotice(title: string, message: string, targetTier?: string): Promise<any> {
    const res = await api.post('/superadmin/whatsapp/broadcast', { title, message, targetTier });
    return res.data;
  },

  async getWhatsAppAiGovernance(): Promise<any> {
    const res = await api.get('/superadmin/whatsapp/ai-governance');
    return res.data.data;
  },

  async updateWhatsAppAiGovernance(data: any): Promise<any> {
    const res = await api.put('/superadmin/whatsapp/ai-governance', data);
    return res.data;
  },

  async simulateWhatsAppAiAgent(message: string, tenantId?: string): Promise<any> {
    const res = await api.post('/superadmin/whatsapp/ai-simulate', { message, tenantId });
    return res.data.data;
  },

  async getWhatsAppCampaigns(): Promise<any> {
    const res = await api.get('/superadmin/whatsapp/campaigns');
    return res.data.data;
  },

  async triggerWhatsAppCampaign(campaignType: string): Promise<any> {
    const res = await api.post('/superadmin/whatsapp/campaigns/trigger', { campaignType });
    return res.data;
  },

  async getWhatsAppThreads(tenantId?: string, search?: string): Promise<any> {
    const params: any = {};
    if (tenantId) params.tenantId = tenantId;
    if (search) params.search = search;
    const res = await api.get('/superadmin/whatsapp/threads', { params });
    return res.data.data;
  },

  async getWhatsAppThreadDetails(tenantId: string, phone: string): Promise<any> {
    const res = await api.get(`/superadmin/whatsapp/threads/${tenantId}/${encodeURIComponent(phone)}`);
    return res.data.data;
  },

  async sendWhatsAppIntervention(tenantId: string, phone: string, text: string): Promise<any> {
    const res = await api.post('/superadmin/whatsapp/threads/reply', { tenantId, phone, text });
    return res.data;
  },
};
