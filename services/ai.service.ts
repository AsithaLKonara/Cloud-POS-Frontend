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
  chat: async (message: string, history: ChatMessage[] = []): Promise<ChatResponseData> => {
    const res = await api.post('/ai/chat', { message, history });
    return res.data.data;
  },

  getSuggestedPrompts: async (): Promise<SuggestedPromptsResponse> => {
    const res = await api.get('/ai/suggested-prompts');
    return res.data;
  },

  getKnowledge: async (): Promise<KnowledgeDocument[]> => {
    const res = await api.get('/ai/knowledge');
    return res.data.data;
  },

  addKnowledge: async (doc: {
    title: string;
    category?: string;
    content: string;
    tags?: string[];
  }): Promise<KnowledgeDocument> => {
    const res = await api.post('/ai/knowledge', doc);
    return res.data.data;
  },

  deleteKnowledge: async (id: string): Promise<void> => {
    await api.delete(`/ai/knowledge/${id}`);
  },

  getConfig: async (): Promise<{ enabled: boolean; apiKey?: string; model?: string; isConfigured: boolean }> => {
    const res = await api.get('/ai/config');
    return res.data.data;
  },

  updateConfig: async (config: { enabled: boolean; apiKey?: string; model?: string }): Promise<any> => {
    const res = await api.put('/ai/config', config);
    return res.data;
  },

  testConnection: async (payload: { apiKey?: string; model?: string }): Promise<{ success: boolean; latencyMs: number; message: string }> => {
    const res = await api.post('/ai/test', payload);
    return res.data.data;
  }
};

