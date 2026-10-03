import api from './api';

export const posService = {
  async openSession(data: { branchId: string; terminalId: string; userId: string; openingFloat: number }) {
    const res = await api.post('/pos/sessions/open', data);
    return res.data;
  },

  async closeSession(data: { sessionId: string; actualClosing: number }) {
    const res = await api.post('/pos/sessions/close', data);
    return res.data;
  },

  async getCurrentSession(terminalId: string) {
    const res = await api.get(`/pos/sessions/current?terminalId=${terminalId}`);
    return res.data;
  },

  async getExpectedClosing(sessionId: string) {
    const res = await api.get(`/pos/sessions/current/expected-closing?sessionId=${sessionId}`);
    return res.data;
  },

  async getSessionSummary(sessionId: string) {
    const res = await api.get(`/pos/sessions/summary?sessionId=${sessionId}`);
    return res.data;
  },

  async generateVoucher(data: { branchId: string; returnedItems: any[]; value: number; orderId?: string }) {
    const response = await api.post('/pos/vouchers/generate', data);
    return response.data;
  },

  async validateVoucher(code: string) {
    const res = await api.get(`/pos/vouchers/${code}`);
    return res.data;
  },

  async processPosOrder(data: {
    branchId: string;
    sessionId: string;
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    shippingAddress?: any;
    items: any[];
    paymentMethod: string;
    appliedVouchers: string[];
    subtotal: number;
    total: number;
    tax: number;
  }) {
    const res = await api.post('/pos/orders', data);
    return res.data;
  }
};
