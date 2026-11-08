import { api } from "./api";

export interface ChartOfAccount {
  id: string;
  code: string;
  name: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  currency: string;
  isSystem: boolean;
  isActive: boolean;
}

export interface JournalLine {
  id?: string;
  accountId?: string;
  accountCode?: string;
  debit: number;
  credit: number;
  description?: string;
  account?: ChartOfAccount;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  reference?: string;
  description: string;
  status: string;
  lines: JournalLine[];
}

export interface TrialBalanceRow {
  code: string;
  name: string;
  type: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface TrialBalance {
  asOfDate: string;
  isBalanced: boolean;
  totalDebit: number;
  totalCredit: number;
  accounts: TrialBalanceRow[];
}

export interface BalanceSheet {
  asOfDate: string;
  assets: {
    accounts: TrialBalanceRow[];
    total: number;
  };
  liabilities: {
    accounts: TrialBalanceRow[];
    total: number;
  };
  equity: {
    accounts: TrialBalanceRow[];
    netIncome: number;
    total: number;
  };
  isBalanced: boolean;
}

export interface AgingBucket {
  current: number;
  days1_30: number;
  days31_60: number;
  days61_90: number;
  days90_plus: number;
  totalDue: number;
  bills?: any[];
  invoices?: any[];
  summary?: {
    totalOutstanding: number;
    current: number;
    overdue: number;
  };
}

export interface StocktakeItem {
  id: string;
  sessionId: string;
  variantId: string;
  variantName?: string;
  productTitle?: string;
  sku?: string;
  barcode?: string;
  systemQuantity: number;
  countedQuantity: number | null;
  variance: number | null;
  unitCost: number;
  reconciled: boolean;
  notes?: string;
}

export interface StocktakeSession {
  id: string;
  branchId: string;
  branchName?: string;
  title: string;
  status: 'DRAFT' | 'IN_PROGRESS' | 'RECONCILED' | 'CANCELLED';
  createdById?: string;
  notes?: string;
  snapshotAt: string;
  completedAt?: string;
  createdAt: string;
  items?: StocktakeItem[];
  _count?: { items: number };
}

export const erpService = {
  // General Ledger
  getChartOfAccounts: async (): Promise<ChartOfAccount[]> => {
    const res = await api.get('/erp/gl/accounts');
    return res.data;
  },

  initChartOfAccounts: async () => {
    const res = await api.post('/erp/gl/accounts/init');
    return res.data;
  },

  getTrialBalance: async (): Promise<TrialBalance> => {
    const res = await api.get('/erp/gl/trial-balance');
    return res.data;
  },

  getBalanceSheet: async (): Promise<BalanceSheet> => {
    const res = await api.get('/erp/gl/balance-sheet');
    return res.data;
  },

  getJournalEntries: async (params?: { limit?: number; offset?: number; search?: string }) => {
    const res = await api.get('/erp/gl/journals', { params });
    return res.data;
  },

  postJournalEntry: async (data: {
    date?: string;
    reference?: string;
    description: string;
    lines: Array<{
      accountCode: string;
      debit: number;
      credit: number;
      description?: string;
    }>;
  }) => {
    const res = await api.post('/erp/gl/journals', data);
    return res.data;
  },

  // Accounts Payable
  getVendorBills: async () => {
    const res = await api.get('/erp/ap/bills');
    return res.data;
  },

  createVendorBill: async (data: any) => {
    const res = await api.post('/erp/ap/bills', data);
    return res.data;
  },

  recordVendorPayment: async (data: {
    billId: string;
    amount: number;
    paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CHEQUE';
    reference?: string;
  }) => {
    const res = await api.post('/erp/ap/payments', data);
    return res.data;
  },

  getApAgingReport: async (): Promise<AgingBucket> => {
    const res = await api.get('/erp/ap/aging');
    return res.data;
  },

  // Accounts Receivable
  getSalesInvoices: async () => {
    const res = await api.get('/erp/ar/invoices');
    return res.data;
  },

  createSalesInvoice: async (data: any) => {
    const res = await api.post('/erp/ar/invoices', data);
    return res.data;
  },

  recordCustomerPayment: async (data: {
    invoiceId: string;
    amount: number;
    paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CARD';
    reference?: string;
  }) => {
    const res = await api.post('/erp/ar/payments', data);
    return res.data;
  },

  getArAgingReport: async (): Promise<AgingBucket> => {
    const res = await api.get('/erp/ar/aging');
    return res.data;
  },

  // Stocktaking
  getStocktakeSessions: async (): Promise<StocktakeSession[]> => {
    const res = await api.get('/erp/stocktaking');
    return res.data;
  },

  getStocktakeSession: async (id: string): Promise<StocktakeSession> => {
    const res = await api.get(`/erp/stocktaking/${id}`);
    return res.data;
  },

  startStocktake: async (data: {
    branchId: string;
    title: string;
    notes?: string;
  }): Promise<StocktakeSession> => {
    const res = await api.post('/erp/stocktaking/start', data);
    return res.data;
  },

  recordCounts: async (id: string, counts: Array<{ variantId: string; countedQty: number; notes?: string }>) => {
    const res = await api.post(`/erp/stocktaking/${id}/counts`, { counts });
    return res.data;
  },

  reconcileStocktake: async (id: string, managerNotes: string): Promise<StocktakeSession> => {
    const res = await api.post(`/erp/stocktaking/${id}/reconcile`, { managerNotes });
    return res.data;
  }
};

