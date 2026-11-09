import { api } from "./api";

export const customerService = {
  getCustomers: async (params?: any) => {
    const res = await api.get("/customers", { params });
    return res.data;
  },

  getCustomerById: async (id: string) => {
    const res = await api.get(`/customers/${id}`);
    return res.data;
  },

  sendWhatsAppStatement: async (customerId: string, phone?: string) => {
    const res = await api.post(`/customers/${customerId}/whatsapp-statement`, { phone });
    return res.data;
  },

  sendWhatsAppReorder: async (customerId: string, productId: string, phone?: string) => {
    const res = await api.post(`/customers/${customerId}/whatsapp-reorder`, { productId, phone });
    return res.data;
  },

  getInboxThreads: async () => {
    const res = await api.get("/customers/inbox/threads");
    return res.data;
  },

  getThreadMessages: async (phone: string) => {
    const res = await api.get(`/customers/inbox/threads/${encodeURIComponent(phone)}`);
    return res.data;
  },

  sendInboxReply: async (phone: string, text: string, actionType?: string) => {
    const res = await api.post(`/customers/inbox/threads/${encodeURIComponent(phone)}/reply`, { text, actionType });
    return res.data;
  },
};
