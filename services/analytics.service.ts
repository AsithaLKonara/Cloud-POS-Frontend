import { api } from './api';

export const analyticsService = {
  getBusinessOverview: async (period: string, branch: string) => {
    const { data } = await api.get('/analytics/overview', {
      params: { period, branch }
    });
    return data;
  },

  getExecutiveOverview: async (period: string, branchId?: string) => {
    const { data } = await api.get('/analytics/executive', {
      params: { period, branchId: branchId || undefined }
    });
    return data;
  },

  getBranchDashboard: async (branchId?: string) => {
    const { data } = await api.get('/analytics/branch-dashboard', {
      params: { branchId: branchId || undefined }
    });
    return data;
  }
};
