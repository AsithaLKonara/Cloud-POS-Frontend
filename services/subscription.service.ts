import { api } from './api';

export interface PlanConfig {
  key: string;
  name: string;
  badge?: string;
  monthlyLkr: number;
  quarterlyLkr: number;
  annualLkr: number;
  maxBranches: number;
  maxUsers: number;
  trialDays: number;
  features: string[];
}

export interface TenantSubscriptionStatus {
  tenantId: string;
  name: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'CANCELLED';
  subscriptionTier: string;
  isTrial: boolean;
  daysRemaining: number;
  currentPeriodEnd: string | null;
  currency: string;
  quotas: {
    branches: { current: number; max: number };
    users: { current: number; max: number };
  };
  latestInvoice: {
    invoiceNumber: string;
    amountLkr: number;
    billingCycle: string;
    status: string;
  } | null;
}

export const subscriptionService = {
  /**
   * Fetch all subscription plans in LKR
   */
  async getPlans(): Promise<PlanConfig[]> {
    const { data } = await api.get<{ success: boolean; data: PlanConfig[] }>('/subscriptions/plans');
    return data.data;
  },

  /**
   * Super Admin: Update plan pricing, quotas, or features
   */
  async updatePlan(planKey: string, update: Partial<PlanConfig>): Promise<PlanConfig> {
    const { data } = await api.put<{ success: boolean; data: PlanConfig }>(`/subscriptions/plans/${planKey}`, update);
    return data.data;
  },

  /**
   * Start 14-day free trial for a tenant
   */
  async startTrial(tenantId: string) {
    const { data } = await api.post<{ success: boolean; data: any }>(`/subscriptions/tenants/${tenantId}/trial`);
    return data.data;
  },

  /**
   * Activate paid subscription with LKR billing cycle
   */
  async activateSubscription(
    tenantId: string,
    payload: {
      planKey: 'STARTER' | 'GROWTH' | 'ENTERPRISE';
      billingCycle: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
      customMonthlyPriceLkr?: number;
      paymentReference?: string;
    }
  ) {
    const { data } = await api.post<{ success: boolean; data: any }>(`/subscriptions/tenants/${tenantId}/subscribe`, payload);
    return data.data;
  },

  /**
   * Get live subscription and quota status for a tenant
   */
  async getTenantStatus(tenantId: string): Promise<TenantSubscriptionStatus> {
    const { data } = await api.get<{ success: boolean; data: TenantSubscriptionStatus }>(`/subscriptions/tenants/${tenantId}/status`);
    return data.data;
  },
};
