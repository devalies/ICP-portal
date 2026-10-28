export type RoleName = 'admin' | 'manager' | 'sales' | 'senior_dev' | 'developer';

export interface User {
  id: number;
  fullName: string;
  email: string;
  roleId: number;
  role: RoleName;
  roleDisplayName: string;
  avatarUrl?: string;
  isActive?: boolean;
  createdAt?: string;
}

export type PipelineStatus =
  | 'draft'
  | 'icpi_sent'
  | 'response_received'
  | 'negotiation'
  | 'won'
  | 'lost_dead';

export interface Client {
  id: number;
  client_name: string;
  company_name: string;
  email: string;
  phone?: string;
  industry?: string;
  website?: string;
  notes?: string;
  creator_name?: string;
  pipeline_count?: number;
  total_pipeline_value?: number;
  created_at: string;
}

export interface PipelineItem {
  id: number;
  client_id: number;
  sales_person_id: number;
  title: string;
  deal_amount: number;
  status: PipelineStatus;
  icpi_content?: string;
  notes?: string;
  sent_date?: string;
  response_date?: string;
  expected_close_date?: string;
  created_at: string;
  updated_at: string;
  client_name: string;
  company_name: string;
  client_email: string;
  client_phone?: string;
  industry?: string;
  sales_person_name: string;
  sales_person_avatar?: string;
  closed_deal_id?: number;
}

export interface PipelineMetrics {
  totalIcpiSent: number;
  totalResponses: number;
  responseRatePercent: number;
  totalDeadCold: number;
  totalWonClosed: number;
  totalConvertedValue: number;
  totalPipelineValue: number;
  conversionRatePercent: number;
  stageCounts: Record<PipelineStatus, number>;
}

export interface ClosedDeal {
  id: number;
  pipeline_id: number;
  project_name: string;
  final_amount: number;
  sales_person_id: number;
  manager_id: number;
  developer_id: number;
  technical_scope?: string;
  deliverables?: string;
  status: 'kickoff' | 'in_development' | 'qa_testing' | 'completed';
  closure_date: string;
  target_delivery_date?: string;
  created_at: string;
  updated_at: string;
  pipeline_title?: string;
  client_name?: string;
  company_name?: string;
  client_email?: string;
  industry?: string;
  sales_person_name?: string;
  manager_name?: string;
  developer_name?: string;
  developer_avatar?: string;
  total_milestones?: number;
  completed_milestones?: number;
  total_documents?: number;
}

export interface Milestone {
  id: number;
  deal_id: number;
  milestone_name: string;
  description?: string;
  due_date: string;
  status: 'pending' | 'in_progress' | 'review' | 'completed';
  completed_at?: string;
  created_at?: string;
}

export interface ProjectDocument {
  id: number;
  deal_id: number;
  file_name: string;
  file_type: string;
  file_size: number;
  category: 'contract' | 'design_asset' | 'sop' | 'technical_spec' | 'deliverable';
  content_preview?: string;
  uploaded_by: number;
  uploader_name?: string;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  user_name?: string;
  user_role?: string;
  action: string;
  entity_type: string;
  entity_id?: number;
  details?: string;
  ip_address?: string;
  created_at: string;
}

export interface NotificationItem {
  id: number;
  user_id?: number;
  title: string;
  message: string;
  type: 'icpi_response' | 'deal_closed' | 'deadline_approaching' | 'system_alert';
  is_read: number;
  link?: string;
  created_at: string;
}

export interface ClientCommunication {
  id: number;
  client_id: number;
  logged_by: number;
  logger_name?: string;
  channel: string;
  subject: string;
  summary: string;
  communicated_at: string;
}
