import { api } from "./api";

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponseSource {
  title: string;
  category: string;
  snippet?: string;
}

export interface ChatResponseData {
  answer: string;
  sources: ChatResponseSource[];
  suggestedQuestions: string[];
}

export interface SuggestedPromptsResponse {
  tenant: {
    name: string;
    currency: string;
    isGlBalanced: boolean;
    todaySales: number;
  } | null;
  prompts: string[];
}

export interface KnowledgeDocument {
  id: string;
  tenantId: string | null;
  title: string;
  category: string;
  content: string;
  tags: string[];
}

export const aiService = {
  chat: async (message: string, history: ChatMessage[] = [], tenantId?: string): Promise<ChatResponseData> => {
    const res = await api.post('/ai/chat', { message, history, tenantId });
    return res.data.data;
  },

  getSuggestedPrompts: async (tenantId?: string): Promise<SuggestedPromptsResponse> => {
    const res = await api.get('/ai/suggested-prompts', { params: tenantId ? { tenantId } : {} });
    return res.data;
  },

  getKnowledge: async (tenantId?: string): Promise<KnowledgeDocument[]> => {
    const res = await api.get('/ai/knowledge', { params: tenantId ? { tenantId } : {} });
    return res.data.data;
  },

  addKnowledge: async (doc: {
    title: string;
    category?: string;
    content: string;
    tags?: string[];
    tenantId?: string;
  }): Promise<KnowledgeDocument> => {
    const res = await api.post('/ai/knowledge', doc);
    return res.data.data;
  },

  deleteKnowledge: async (id: string, tenantId?: string): Promise<void> => {
    await api.delete(`/ai/knowledge/${id}`, { params: tenantId ? { tenantId } : {} });
  },

  getConfig: async (tenantId?: string): Promise<{ enabled: boolean; apiKey?: string; model?: string; isConfigured: boolean }> => {
    const res = await api.get('/ai/config', { params: tenantId ? { tenantId } : {} });
    return res.data.data;
  },

  updateConfig: async (config: { enabled: boolean; apiKey?: string; model?: string; tenantId?: string }): Promise<any> => {
    const res = await api.put('/ai/config', config);
    return res.data;
  },

  getModels: async (apiKey?: string, tenantId?: string): Promise<{ detectedModel: string; models: Array<{ id: string; displayName: string }> }> => {
    const res = await api.get('/ai/models', { params: { ...(apiKey ? { apiKey } : {}), ...(tenantId ? { tenantId } : {}) } });
    return res.data?.data;
  },

  testConnection: async (payload: { apiKey?: string; model?: string; tenantId?: string }): Promise<{
    success: boolean;
    latencyMs: number;
    detectedModel: string;
    availableModels: Array<{ id: string; displayName: string }>;
    message: string;
  }> => {
    const res = await api.post('/ai/test', payload);
    return res.data.data;
  }
};

