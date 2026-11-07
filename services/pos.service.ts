import api from './api';

export const posService = {
  async openSession(data: { branchId: string; terminalId: string; userId: string; openingFloat: number }) {
    const res = await api.post('/pos/sessions/open', data);
    return res.data;
  },

  async closeSession(data: { sessionId: string; actualClosing: number; closingNotes?: string; denominations?: Record<string, number> }) {
    const res = await api.post('/pos/sessions/close', data);
    return res.data;
  },

  async cashIn(data: { sessionId: string; amount: number; reason?: string }) {
    const res = await api.post('/pos/sessions/cash-in', data);
    return res.data;
  },

  async cashDrop(data: { sessionId: string; amount: number; reason?: string }) {
    const res = await api.post('/pos/sessions/cash-drop', data);
    return res.data;
  },

  async verifyManagerPin(pin: string) {
    const res = await api.post('/pos/manager-pin/verify', { pin });
    return res.data;
  },

  async getCustomerCredit(customerId: string) {
    const res = await api.get(`/pos/customers/${customerId}/credit`);
    return res.data;
  },

  async settleCustomerCredit(customerId: string, data: { amount: number; paymentMethod: string; reference?: string; notes?: string; sessionId?: string }) {
    const res = await api.post(`/pos/customers/${customerId}/settle-credit`, data);
    return res.data;
  },

  async getCurrentSession(terminalId?: string, branchId?: string) {
    const params = new URLSearchParams();
    if (terminalId) params.append('terminalId', terminalId);
    if (branchId) params.append('branchId', branchId);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await api.get(`/pos/sessions/current${query}`);
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
    sessionId?: string;
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    shippingAddress?: any;
    items: any[];
    paymentMethod: string;
    appliedVouchers: string[];
    subtotal: number;
    discount?: number;
    total: number;
    tax: number;
    idempotencyKey?: string;
  }) {
    const headers = data.idempotencyKey ? { 'idempotency-key': data.idempotencyKey } : undefined;
    const res = await api.post('/pos/orders', data, { headers });
    return res.data;
  },

  async holdCart(data: {
    sessionId: string;
    branchId: string;
    reference?: string;
    customerName?: string;
    customerId?: string;
    items: any[];
    subtotal?: number;
    discount?: any;
    notes?: string;
  }) {
    const res = await api.post('/pos/carts/hold', data);
    return res.data;
  },

  async getHeldCarts(sessionId: string) {
    const res = await api.get(`/pos/carts/held?sessionId=${sessionId}`);
    return res.data;
  },

  async recallHeldCart(id: string) {
    const res = await api.post(`/pos/carts/recall/${id}`);
    return res.data;
  },

  async discardHeldCart(id: string) {
    const res = await api.delete(`/pos/carts/held/${id}`);
    return res.data;
  }
};
