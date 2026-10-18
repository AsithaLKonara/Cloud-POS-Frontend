import { api } from './api';

export interface PnLResponse {
  period: {
    startDate: string;
    endDate: string;
  };
  branchId: string;
  summary: {
    totalOrdersCount: number;
    grossRevenue: number;
    totalDiscounts: number;
    totalTaxes: number;
    netRevenue: number;
    cogs: {
      totalCogs: number;
      oilCogs: number;
      nonOilCogs: number;
      oilRevenue: number;
      nonOilRevenue: number;
    };
    grossProfit: number;
    grossMarginPercent: number;
    operatingExpenses: {
      total: number;
      breakdown: {
        category: string;
        amount: number;
        percentageOfExpenses: number;
      }[];
    };
    wastageLoss: number;
    netProfit: number;
    netMarginPercent: number;
  };
  branchComparison: {
    branchId: string;
    branchName: string;
    branchCode: string;
    revenue: number;
    expenses: number;
    estimatedNet: number;
  }[];
}

export const pnlService = {
  async getStatement(params?: { branchId?: string; startDate?: string; endDate?: string }): Promise<PnLResponse> {
    const { data } = await api.get<PnLResponse>('/pnl', { params });
    return data;
  },
};
