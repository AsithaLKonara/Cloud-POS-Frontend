import apiClient from './api';

export type TicketCategory =
  | 'HARDWARE_PERIPHERAL'
  | 'POS_REGISTER'
  | 'ERP_INVENTORY'
  | 'CRM_COMMERCE'
  | 'BILLING_SUBSCRIPTION'
  | 'FEATURE_REQUEST'
  | 'GENERAL_INQUIRY';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL_URGENT';

export type TicketStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'WAITING_ON_CUSTOMER'
  | 'RESOLVED'
  | 'CLOSED';

export type TicketSenderType = 'TENANT_USER' | 'SUPERADMIN_AGENT' | 'SYSTEM_BOT';

export interface TicketAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderType: TicketSenderType;
  sender?: {
    id: string;
    name?: string | null;
    email: string;
  };
  content: string;
  isInternal: boolean;
  attachments?: TicketAttachment[];
  createdAt: string;
}

export interface TicketActivityLog {
  id: string;
  action: string;
  fromValue?: string | null;
  toValue?: string | null;
  notes?: string | null;
  actor?: {
    id: string;
    name?: string | null;
  };
  createdAt: string;
}

export interface SupportTicketItem {
  id: string;
  ticketNumber: number;
  tenantId: string;
  tenant?: {
    id: string;
    name: string;
    slug: string;
    subscriptionTier: string;
    businessType?: string;
    _count?: {
      branches: number;
      users: number;
      orders: number;
      posSessions: number;
    };
  };
  createdById: string;
  createdBy?: {
    id: string;
    name?: string | null;
    email: string;
    phone?: string | null;
  };
  assignedToId?: string | null;
  assignedTo?: {
    id: string;
    name?: string | null;
    email: string;
  } | null;
  branchId?: string | null;
  branch?: {
    id: string;
    name: string;
    code: string;
  } | null;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  sourceRoute?: string | null;
  posMetadata?: any;
  firstResponseDueAt: string;
  resolutionDueAt: string;
  firstRespondedAt?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
  slaFirstResponseBreached: boolean;
  slaResolutionBreached: boolean;
  csatRating?: number | null;
  csatFeedback?: string | null;
  csatRatedAt?: string | null;
  messages?: TicketMessage[];
  attachments?: TicketAttachment[];
  activityLogs?: TicketActivityLog[];
  _count?: {
    messages: number;
    attachments: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CannedResponseItem {
  id: string;
  title: string;
  category: TicketCategory;
  shortcutCode: string;
  content: string;
  createdBy?: { id: string; name?: string | null };
  createdAt: string;
}

export interface HelpdeskMetrics {
  totalCount: number;
  openCount: number;
  inProgressCount: number;
  waitingCount: number;
  resolvedCount: number;
  criticalCount: number;
  breachedCount: number;
  adherenceRate: number;
  avgCsat: number;
  csatResponsesCount: number;
  categoryBreakdown: Array<{ category: TicketCategory; count: number }>;
}

export class SupportTicketService {
  // ==========================================
  // TENANT PORTAL API CALLS
  // ==========================================

  static async getTenantTickets(params: {
    status?: string;
    category?: string;
    priority?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    tickets: SupportTicketItem[];
    pagination: { page: number; limit: number; totalCount: number; totalPages: number };
  }> {
    const res = await apiClient.get('/support', { params });
    return res.data;
  }

  static async createTenantTicket(data: {
    subject: string;
    description: string;
    category?: TicketCategory;
    priority?: TicketPriority;
    branchId?: string;
    sourceRoute?: string;
    posMetadata?: any;
    attachments?: Array<{ fileName: string; fileUrl: string; fileType: string; fileSize: number }>;
  }): Promise<{ success: boolean; data: SupportTicketItem; message: string }> {
    const res = await apiClient.post('/support', data);
    return res.data;
  }

  static async getTenantTicketDetail(id: string): Promise<SupportTicketItem> {
    const res = await apiClient.get(`/support/${id}`);
    return res.data.data;
  }

  static async addTenantMessage(
    ticketId: string,
    content: string,
    attachments?: Array<{ fileName: string; fileUrl: string; fileType: string; fileSize: number }>
  ): Promise<TicketMessage> {
    const res = await apiClient.post(`/support/${ticketId}/messages`, { content, attachments });
    return res.data.data;
  }

  static async updateTenantStatus(ticketId: string, status: TicketStatus, notes?: string): Promise<SupportTicketItem> {
    const res = await apiClient.patch(`/support/${ticketId}/status`, { status, notes });
    return res.data.data;
  }

  static async submitCsat(ticketId: string, rating: number, feedback?: string): Promise<SupportTicketItem> {
    const res = await apiClient.post(`/support/${ticketId}/csat`, { rating, feedback });
    return res.data.data;
  }

  // ==========================================
  // SUPERADMIN HELPDESK API CALLS
  // ==========================================

  static async getSuperadminTickets(params: {
    tenantId?: string;
    status?: string;
    category?: string;
    priority?: string;
    assignedToId?: string;
    slaBreached?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    tickets: SupportTicketItem[];
    pagination: { page: number; limit: number; totalCount: number; totalPages: number };
  }> {
    const res = await apiClient.get('/superadmin/tickets', { params });
    return res.data;
  }

  static async getSuperadminTicketDetail(id: string): Promise<SupportTicketItem> {
    const res = await apiClient.get(`/superadmin/tickets/${id}`);
    return res.data.data;
  }

  static async addSuperadminMessage(
    ticketId: string,
    content: string,
    isInternal = false,
    attachments?: Array<{ fileName: string; fileUrl: string; fileType: string; fileSize: number }>
  ): Promise<TicketMessage> {
    const res = await apiClient.post(`/superadmin/tickets/${ticketId}/messages`, {
      content,
      isInternal,
      attachments,
    });
    return res.data.data;
  }

  static async updateSuperadminStatus(
    ticketId: string,
    status: TicketStatus,
    notes?: string
  ): Promise<SupportTicketItem> {
    const res = await apiClient.patch(`/superadmin/tickets/${ticketId}/status`, { status, notes });
    return res.data.data;
  }

  static async assignTicket(ticketId: string, assignedToId: string | null): Promise<SupportTicketItem> {
    const res = await apiClient.patch(`/superadmin/tickets/${ticketId}/assign`, { assignedToId });
    return res.data.data;
  }

  static async updatePriority(ticketId: string, priority: TicketPriority): Promise<SupportTicketItem> {
    const res = await apiClient.patch(`/superadmin/tickets/${ticketId}/priority`, { priority });
    return res.data.data;
  }

  static async getCannedResponses(category?: TicketCategory): Promise<CannedResponseItem[]> {
    const res = await apiClient.get('/superadmin/tickets/canned', { params: { category } });
    return res.data.data;
  }

  static async createCannedResponse(data: {
    title: string;
    category?: TicketCategory;
    shortcutCode: string;
    content: string;
  }): Promise<CannedResponseItem> {
    const res = await apiClient.post('/superadmin/tickets/canned', data);
    return res.data.data;
  }

  static async getHelpdeskMetrics(): Promise<HelpdeskMetrics> {
    const res = await apiClient.get('/superadmin/tickets/metrics');
    return res.data.data;
  }
}
