import { api } from './api';

export interface OnePayConfig {
  enabled: boolean;
  appId: string;
  appToken?: string;
  hashSalt?: string;
  isSandbox: boolean;
}

export interface PayHereConfig {
  enabled: boolean;
  merchantId: string;
  merchantSecret?: string;
  isSandbox: boolean;
}

export interface KokoConfig {
  enabled: boolean;
  merchantId: string;
  apiKey?: string;
  apiSecret?: string;
  isSandbox: boolean;
}

export interface WebXPayConfig {
  enabled: boolean;
  secretKey?: string;
  publicKey?: string;
  isSandbox: boolean;
}

export interface LankaQRConfig {
  enabled: boolean;
  merchantCategoryCode: string;
  accountNumber: string;
  bankCode: string;
  terminalId?: string;
  merchantName?: string;
}

export interface BankTransferConfig {
  enabled: boolean;
  bankName: string;
  accountNumber: string;
  accountName: string;
  branchName?: string;
  instructions?: string;
}

export interface KoombiyoConfig {
  enabled: boolean;
  apiKey?: string;
  pickupCode?: string;
}

export interface PromptXConfig {
  enabled: boolean;
  apiKey?: string;
  clientCode?: string;
}

export interface DomexConfig {
  enabled: boolean;
  username?: string;
  accountNumber?: string;
}

export interface FardarConfig {
  enabled: boolean;
  apiKey?: string;
  merchantCode?: string;
  pickupBranch?: string;
  serviceType?: string;
  isSandbox?: boolean;
}

export interface TenantIntegrations {
  paymentGateways: {
    onepay?: OnePayConfig;
    payhere: PayHereConfig;
    koko: KokoConfig;
    webxpay: WebXPayConfig;
    lankaQr: LankaQRConfig;
    bankTransfer: BankTransferConfig;
  };
  couriers: {
    koombiyo: KoombiyoConfig;
    promptx: PromptXConfig;
    domex: DomexConfig;
    fardar?: FardarConfig;
  };
}

export const integrationService = {
  async getIntegrations(tenantId: string): Promise<TenantIntegrations> {
    const res = await api.get(`/integrations/${tenantId}`);
    return res.data.data;
  },

  async updatePaymentGateway(
    tenantId: string,
    gateway: 'onepay' | 'payhere' | 'koko' | 'webxpay' | 'lankaQr' | 'bankTransfer',
    config: any
  ): Promise<TenantIntegrations> {
    const res = await api.put(`/integrations/${tenantId}/payments/${gateway}`, config);
    return res.data.data;
  },

  async updateCourier(
    tenantId: string,
    courier: 'koombiyo' | 'promptx' | 'domex' | 'fardar',
    config: any
  ): Promise<TenantIntegrations> {
    const res = await api.put(`/integrations/${tenantId}/couriers/${courier}`, config);
    return res.data.data;
  },

  async testConnection(
    tenantId: string,
    type: 'payment' | 'courier',
    provider: string
  ): Promise<{ success: boolean; provider: string; status: string; latencyMs: number; message: string }> {
    const res = await api.post(`/integrations/${tenantId}/test`, { type, provider });
    return res.data.data;
  },
};
