import {
  User,
  PipelineItem,
  PipelineMetrics,
  ClosedDeal,
  Milestone,
  ProjectDocument,
  Client,
  AuditLog,
  NotificationItem,
} from '../types';

const TOKEN_KEY = 'nexus_session_token';

export const apiClient = {
  getToken(): string {
    return localStorage.getItem(TOKEN_KEY) || '';
  },

  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  },

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers = new Headers(options.headers || {});

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  // Auth
  async login(email: string, password: string) {
    const data = await this.request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  },

  async switchRole(userId: number) {
    const data = await this.request<{ token: string; user: User }>('/api/auth/switch', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
    this.setToken(data.token);
    return data;
  },

  async getMe() {
    return this.request<{ user: User }>('/api/auth/me');
  },

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request<{ message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  // Users & Roles
  async getUsers() {
    return this.request<{ users: User[] }>('/api/users');
  },

  async getRoles() {
    return this.request<{ roles: Array<{ id: number; name: string; display_name: string; description: string }> }>('/api/roles');
  },

  async createUser(data: { fullName: string; email: string; password: string; roleId: number }) {
    return this.request<{ user: User; message: string }>('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async toggleUserStatus(userId: number, isActive: boolean) {
    return this.request<{ message: string }>(`/api/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  },

  async updateUser(userId: number, data: {
    fullName?: string;
    email?: string;
    roleId?: number;
    isActive?: boolean;
    password?: string;
  }) {
    return this.request<{ user: User; message: string }>(`/api/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Clients
  async getClients(search?: string) {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request<{ clients: Client[] }>(`/api/clients${query}`);
  },

  async getClientDetails(id: number) {
    return this.request<{ client: Client; pipelines: any[]; communications: any[] }>(`/api/clients/${id}`);
  },

  async createClient(data: Partial<Client>) {
    return this.request<{ id: number; message: string }>('/api/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async logClientCommunication(clientId: number, data: { channel: string; subject: string; summary: string }) {
    return this.request<{ message: string }>(`/api/clients/${clientId}/communications`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Pipeline
  async getPipeline(params?: { status?: string; salesId?: number; search?: string }) {
    const url = new URL('/api/pipeline', window.location.origin);
    if (params?.status) url.searchParams.set('status', params.status);
    if (params?.salesId) url.searchParams.set('salesId', String(params.salesId));
    if (params?.search) url.searchParams.set('search', params.search);
    return this.request<{ items: PipelineItem[] }>(url.pathname + url.search);
  },

  async getPipelineMetrics() {
    return this.request<{
      metrics: PipelineMetrics;
      industryStats: Array<{ industry: string; count: number; total_value: number }>;
      salesRepStats: Array<{ id: number; full_name: string; avatar_url: string; total_leads: number; won_leads: number; closed_revenue: number }>;
    }>('/api/pipeline/metrics');
  },

  async createPipelineItem(data: {
    clientId: number;
    title: string;
    dealAmount: number;
    icpiContent?: string;
    notes?: string;
    expectedCloseDate?: string;
    initialStatus?: string;
  }) {
    return this.request<{ id: number; message: string }>('/api/pipeline', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updatePipelineStatus(id: number, status: string, notes?: string) {
    return this.request<{ message: string }>(`/api/pipeline/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  },

  async getPipelineDetails(id: number) {
    return this.request<{
      item: PipelineItem;
      communications: any[];
      touchpointStats: {
        totalContacts: number;
        channelBreakdown: Record<string, number>;
        lastContacted: string;
      };
    }>(`/api/pipeline/${id}`);
  },

  async updatePipelineItem(id: number, data: any) {
    return this.request<{ message: string }>(`/api/pipeline/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async logPipelineTouchpoint(id: number, data: {
    channel: string;
    subject: string;
    whatTheySaid: string;
    nextFollowUp?: string;
    advanceStage?: string;
  }) {
    return this.request<{ message: string; newStatus?: string }>(`/api/pipeline/${id}/touchpoint`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async sendIcpi(id: number, icpiContent?: string) {
    return this.request<{ message: string }>(`/api/pipeline/${id}/send-icpi`, {
      method: 'POST',
      body: JSON.stringify({ icpiContent }),
    });
  },

  async convertToDeal(id: number, data: {
    projectName: string;
    finalAmount: number;
    managerId?: number;
    developerId: number;
    technicalScope?: string;
    deliverables?: string;
    targetDeliveryDate?: string;
  }) {
    return this.request<{ dealId: number; message: string }>(`/api/pipeline/${id}/convert-to-deal`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Projects
  async getProjects() {
    return this.request<{ projects: ClosedDeal[] }>('/api/projects');
  },

  async getProjectDetails(id: number) {
    return this.request<{ project: ClosedDeal; milestones: Milestone[]; documents: ProjectDocument[] }>(`/api/projects/${id}`);
  },

  async updateProject(id: number, data: Partial<ClosedDeal>) {
    return this.request<{ message: string }>(`/api/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Milestones
  async addMilestone(dealId: number, data: { milestoneName: string; description?: string; dueDate: string; status?: string }) {
    return this.request<{ id: number; message: string }>(`/api/projects/${dealId}/milestones`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateMilestone(milestoneId: number, data: Partial<Milestone>) {
    return this.request<{ message: string }>(`/api/milestones/${milestoneId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Documents
  async addDocument(dealId: number, data: {
    fileName: string;
    category: string;
    contentPreview?: string;
    fileSize?: number;
    fileType?: string;
  }) {
    return this.request<{ id: number; message: string }>(`/api/projects/${dealId}/documents`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteDocument(docId: number) {
    return this.request<{ message: string }>(`/api/documents/${docId}`, {
      method: 'DELETE',
    });
  },

  // Audit Logs
  async getAuditLogs(params?: { action?: string; entityType?: string; limit?: number }) {
    const url = new URL('/api/audit-logs', window.location.origin);
    if (params?.action) url.searchParams.set('action', params.action);
    if (params?.entityType) url.searchParams.set('entityType', params.entityType);
    if (params?.limit) url.searchParams.set('limit', String(params.limit));
    return this.request<{ logs: AuditLog[] }>(url.pathname + url.search);
  },

  // Notifications
  async getNotifications() {
    return this.request<{ notifications: NotificationItem[]; unreadCount: number }>('/api/notifications');
  },

  async markNotificationRead(id: number) {
    return this.request<{ message: string }>(`/api/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  async markAllNotificationsRead() {
    return this.request<{ message: string }>('/api/notifications/mark-all-read', {
      method: 'POST',
    });
  },

  // API docs
  async getApiDocs() {
    return this.request<any>('/api/docs');
  },
};
