import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePipelineMetrics,
  hasPermission,
  getMilestoneUrgency,
  PipelineItem,
  MilestoneItem,
} from './pipeline';

test('hasPermission validates RBAC rules correctly', () => {
  // Admin & Manager have full access
  assert.equal(hasPermission('admin', 'manage_users'), true);
  assert.equal(hasPermission('admin', 'view_financials'), true);
  assert.equal(hasPermission('manager', 'manage_users'), true);
  assert.equal(hasPermission('manager', 'view_financials'), true);

  // Sales person access
  assert.equal(hasPermission('sales', 'view_pipeline'), true);
  assert.equal(hasPermission('sales', 'edit_pipeline'), true);
  assert.equal(hasPermission('sales', 'manage_users'), false);
  assert.equal(hasPermission('sales', 'view_financials'), false);

  // Developers restricted access
  assert.equal(hasPermission('developer', 'view_pipeline'), false);
  assert.equal(hasPermission('developer', 'edit_pipeline'), false);
  assert.equal(hasPermission('developer', 'manage_users'), false);
  assert.equal(hasPermission('developer', 'view_projects'), true);
  assert.equal(hasPermission('developer', 'edit_projects'), true);

  assert.equal(hasPermission('senior_dev', 'view_pipeline'), false);
  assert.equal(hasPermission('senior_dev', 'view_projects'), true);
});

test('calculatePipelineMetrics computes KPIs and conversion rates correctly', () => {
  const dummyItems: PipelineItem[] = [
    {
      id: 1,
      clientId: 1,
      salesPersonId: 2,
      status: 'icpi_sent',
      dealAmount: 10000,
      sentDate: '2026-10-01',
      responseDate: null,
      createdAt: '2026-10-01',
    },
    {
      id: 2,
      clientId: 2,
      salesPersonId: 2,
      status: 'response_received',
      dealAmount: 25000,
      sentDate: '2026-10-02',
      responseDate: '2026-10-04',
      createdAt: '2026-10-02',
    },
    {
      id: 3,
      clientId: 3,
      salesPersonId: 2,
      status: 'won',
      dealAmount: 50000,
      sentDate: '2026-09-15',
      responseDate: '2026-09-18',
      createdAt: '2026-09-15',
    },
    {
      id: 4,
      clientId: 4,
      salesPersonId: 2,
      status: 'lost_dead',
      dealAmount: 15000,
      sentDate: '2026-09-01',
      responseDate: null,
      createdAt: '2026-09-01',
    },
    {
      id: 5,
      clientId: 5,
      salesPersonId: 2,
      status: 'draft',
      dealAmount: 8000,
      sentDate: null,
      responseDate: null,
      createdAt: '2026-10-20',
    },
  ];

  const metrics = calculatePipelineMetrics(dummyItems);

  // 4 items sent (1, 2, 3, 4); item 5 is draft
  assert.equal(metrics.totalIcpiSent, 4);
  // 2 responses received (items 2 and 3)
  assert.equal(metrics.totalResponses, 2);
  // Response rate: 2 / 4 = 50%
  assert.equal(metrics.responseRatePercent, 50);
  // 1 dead/cold lead
  assert.equal(metrics.totalDeadCold, 1);
  // 1 won deal
  assert.equal(metrics.totalWonClosed, 1);
  // Converted value: 50,000
  assert.equal(metrics.totalConvertedValue, 50000);
  // Total pipeline value: 10000 + 25000 + 50000 + 15000 + 8000 = 108,000
  assert.equal(metrics.totalPipelineValue, 108000);
  // Conversion rate: 1 won / 4 sent = 25%
  assert.equal(metrics.conversionRatePercent, 25);
});

test('getMilestoneUrgency identifies overdue and upcoming milestones', () => {
  const refDate = new Date('2026-10-27T00:00:00Z');

  const completedMilestone: MilestoneItem = {
    id: 1,
    dealId: 1,
    milestoneName: 'Scope Approval',
    dueDate: '2026-10-15',
    status: 'completed',
  };
  assert.equal(getMilestoneUrgency(completedMilestone, refDate), 'completed');

  const overdueMilestone: MilestoneItem = {
    id: 2,
    dealId: 1,
    milestoneName: 'Architecture Signoff',
    dueDate: '2026-10-20',
    status: 'in_progress',
  };
  assert.equal(getMilestoneUrgency(overdueMilestone, refDate), 'overdue');

  const dueSoonMilestone: MilestoneItem = {
    id: 3,
    dealId: 1,
    milestoneName: 'Sprint 1 Demo',
    dueDate: '2026-10-30',
    status: 'in_progress',
  };
  assert.equal(getMilestoneUrgency(dueSoonMilestone, refDate), 'due_soon');

  const onTrackMilestone: MilestoneItem = {
    id: 4,
    dealId: 1,
    milestoneName: 'Final Launch',
    dueDate: '2026-11-25',
    status: 'pending',
  };
  assert.equal(getMilestoneUrgency(onTrackMilestone, refDate), 'on_track');
});
