import api from './api';

export interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  oldData: any;
  newData: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export const auditService = {
  getLogs: async (params?: { search?: string; action?: string; timeframe?: string; page?: number; limit?: number }) => {
    try {
      const { data } = await api.get('/audit', { params });
      return data;
    } catch (err) {
      const { data } = await api.get('/system/audit', { params });
      return data;
    }
  }
};
