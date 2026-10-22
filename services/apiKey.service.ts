import { api } from './api';

export interface ApiKeyItem {
  id: string;
  name: string;
  clientId: string;
  scopes: string[];
  rateLimitPerMin: number;
  allowedOrigins: string[];
  allowedIps: string[];
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  lastUsedAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  secretKey?: string; // only present on creation
}

export interface CreateApiKeyDto {
  name: string;
  scopes?: string[];
  rateLimitPerMin?: number;
  allowedOrigins?: string[];
  allowedIps?: string[];
}

export const apiKeyService = {
  async listKeys(tenantId: string): Promise<ApiKeyItem[]> {
    const res = await api.get(`/api-keys/${tenantId}`);
    return res.data.data;
  },

  async createKey(tenantId: string, payload: CreateApiKeyDto): Promise<ApiKeyItem> {
    const res = await api.post(`/api-keys/${tenantId}`, payload);
    return res.data.data;
  },

  async revokeKey(tenantId: string, keyId: string): Promise<ApiKeyItem> {
    const res = await api.delete(`/api-keys/${tenantId}/${keyId}`);
    return res.data.data;
  },
};
