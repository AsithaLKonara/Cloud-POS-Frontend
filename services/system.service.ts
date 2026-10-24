import { api } from './api';

export interface VpsTelemetry {
  timestamp: string;
  uptimeSeconds: number;
  uptimeFormatted: string;
  cpu: {
    cores: number;
    model: string;
    loadAvg: {
      '1m': number;
      '5m': number;
      '15m': number;
    };
    usagePercentage: number;
  };
  memory: {
    totalMb: number;
    usedMb: number;
    freeMb: number;
    percentage: number;
    processRssMb: number;
    processHeapUsedMb: number;
  };
  disk: {
    totalGb: number;
    usedGb: number;
    freeGb: number;
    percentage: number;
  };
  database: {
    status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
    latencyMs: number;
  };
  redis: {
    status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
    latencyMs: number;
  };
  alerts: Array<{
    severity: 'WARNING' | 'CRITICAL' | 'INFO';
    title: string;
    message: string;
    timestamp: string;
  }>;
}

export interface SystemErrorLogItem {
  id: string;
  statusCode: number;
  message: string;
  humanReadable?: string;
  stack?: string;
  path: string;
  method: string;
  ip?: string;
  userAgent?: string;
  tenantId?: string;
  userId?: string;
  createdAt: string;
}

export const systemService = {
  async getTelemetry(): Promise<VpsTelemetry> {
    const res = await api.get('/system/telemetry');
    return res.data.data;
  },

  async getErrorLogs(limit = 25): Promise<SystemErrorLogItem[]> {
    const res = await api.get(`/system/errors?limit=${limit}`);
    return res.data.data;
  },

  async triggerBackup(): Promise<{ success: boolean; message: string; output: string }> {
    const res = await api.post('/system/backup');
    return res.data;
  },

  async getHealth(): Promise<{ status: string; uptimeFormatted: string; services: any }> {
    const res = await api.get('/system/health');
    return res.data;
  },
};
