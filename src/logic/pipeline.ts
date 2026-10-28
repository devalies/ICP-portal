/**
 * Pure business logic for NexusICP calculations, metrics, and role-based permissions.
 * Decoupled from UI and database for testability and consistency.
 */

export type RoleName = 'admin' | 'manager' | 'sales' | 'senior_dev' | 'developer';

export interface UserSession {
  id: number;
  email: string;
  fullName: string;
  role: RoleName;
  isActive: boolean;
}

export type PipelineStatus =
  | 'draft'
  | 'icpi_sent'
  | 'response_received'
  | 'negotiation'
  | 'won'
  | 'lost_dead';

export interface PipelineItem {
  id: number;
  clientId: number;
  salesPersonId: number;
  status: PipelineStatus;
  dealAmount: number;
  sentDate: string | null;
  responseDate: string | null;
  createdAt: string;
}

export interface MilestoneItem {
  id: number;
  dealId?: number;
  deal_id?: number;
  milestoneName?: string;
  milestone_name?: string;
  dueDate?: string;
  due_date?: string;
  status: 'pending' | 'in_progress' | 'review' | 'completed';
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

/**
 * Check whether a user role has permission to access a specific module or action.
 */
export function hasPermission(
  role: RoleName,
  action: 'view_pipeline' | 'edit_pipeline' | 'manage_users' | 'view_projects' | 'edit_projects' | 'view_financials' | 'view_audit_logs'
): boolean {
  switch (action) {
    case 'manage_users':
    case 'view_financials':
    case 'view_audit_logs':
      return role === 'admin' || role === 'manager';

    case 'view_pipeline':
      return role === 'admin' || role === 'manager' || role === 'sales';

    case 'edit_pipeline':
      return role === 'admin' || role === 'manager' || role === 'sales';

    case 'view_projects':
      // All roles can view projects workspace, but developer roles see their assigned projects
      return true;

    case 'edit_projects':
      return role === 'admin' || role === 'manager' || role === 'senior_dev' || role === 'developer';

    default:
      return false;
  }
}

/**
 * Calculates all KPI dashboard metrics and funnel stages from a list of pipeline items.
 */
export function calculatePipelineMetrics(items: PipelineItem[]): PipelineMetrics {
  const stageCounts: Record<PipelineStatus, number> = {
    draft: 0,
    icpi_sent: 0,
    response_received: 0,
    negotiation: 0,
    won: 0,
    lost_dead: 0,
  };

  let totalIcpiSent = 0;
  let totalResponses = 0;
  let totalDeadCold = 0;
  let totalWonClosed = 0;
  let totalConvertedValue = 0;
  let totalPipelineValue = 0;

  for (const item of items) {
    stageCounts[item.status] = (stageCounts[item.status] || 0) + 1;

    // Sent ICPIs include any lead that has reached sent or downstream stages
    if (item.status !== 'draft' || item.sentDate) {
      totalIcpiSent++;
    }

    // Responses include response_received, negotiation, won, or any with responseDate
    if (
      item.responseDate ||
      item.status === 'response_received' ||
      item.status === 'negotiation' ||
      item.status === 'won'
    ) {
      totalResponses++;
    }

    if (item.status === 'lost_dead') {
      totalDeadCold++;
    }

    if (item.status === 'won') {
      totalWonClosed++;
      totalConvertedValue += item.dealAmount || 0;
    }

    totalPipelineValue += item.dealAmount || 0;
  }

  const responseRatePercent = totalIcpiSent > 0
    ? Math.round((totalResponses / totalIcpiSent) * 100 * 10) / 10
    : 0;

  const conversionRatePercent = totalIcpiSent > 0
    ? Math.round((totalWonClosed / totalIcpiSent) * 100 * 10) / 10
    : 0;

  return {
    totalIcpiSent,
    totalResponses,
    responseRatePercent,
    totalDeadCold,
    totalWonClosed,
    totalConvertedValue,
    totalPipelineValue,
    conversionRatePercent,
    stageCounts,
  };
}

/**
 * Determines milestone urgency: 'overdue', 'due_soon' (<= 5 days), or 'on_track'
 */
export function getMilestoneUrgency(
  milestone: MilestoneItem,
  referenceDate: Date = new Date()
): 'completed' | 'overdue' | 'due_soon' | 'on_track' {
  if (milestone.status === 'completed') return 'completed';

  const dateStr = milestone.due_date || milestone.dueDate;
  if (!dateStr) return 'on_track';

  const due = new Date(dateStr).getTime();
  const now = referenceDate.getTime();
  const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'overdue';
  if (diffDays <= 5) return 'due_soon';
  return 'on_track';
}
