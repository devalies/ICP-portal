import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Hash passwords using SHA-256 with salt
export function hashPassword(password: string): string {
  const salt = 'nexus_salt_2026';
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

// Database directory & path (use /tmp on Vercel/serverless environments where root is read-only)
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DB_DIR = isServerless ? path.join('/tmp', 'nexus_data') : path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'nexus_portal.db');

let dbInstance: DatabaseSync | null = null;

export function getDatabase(): DatabaseSync {
  if (dbInstance) return dbInstance;

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  const db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA journal_mode = WAL;');

  // Run migrations - support both relative to __dirname and process.cwd()
  const possiblePaths = [
    path.resolve(process.cwd(), 'src/db/migrations.sql'),
    path.resolve(__dirname, 'migrations.sql'),
    path.resolve(__dirname, '../db/migrations.sql')
  ];
  for (const migrationPath of possiblePaths) {
    if (fs.existsSync(migrationPath)) {
      const migrationSql = fs.readFileSync(migrationPath, 'utf8');
      db.exec(migrationSql);
      break;
    }
  }

  // Seed default data if roles table is empty
  seedInitialData(db);

  dbInstance = db;
  return db;
}

function seedInitialData(db: DatabaseSync) {
  const rolesCount = db.prepare('SELECT COUNT(*) as count FROM roles').get() as { count: number };
  if (rolesCount && rolesCount.count > 0) {
    return; // Already seeded
  }

  // 1. Seed Roles
  const insertRole = db.prepare(`
    INSERT INTO roles (id, name, display_name, description)
    VALUES (?, ?, ?, ?)
  `);
  insertRole.run(1, 'admin', 'Administrator', 'Full system access, user management, pipelines, deals, and audit logs');
  insertRole.run(2, 'manager', 'Manager', 'Oversees pipeline, manages closed deals, team assignments, and financials');
  insertRole.run(3, 'sales', 'Sales Person', 'ICP pipeline execution, lead engagement, sending ICPIs, creating deals');
  insertRole.run(4, 'senior_dev', 'Senior Developer', 'Technical architecture, milestone progress, specifications, and scope');
  insertRole.run(5, 'developer', 'Developer', 'Assigned closed projects, technical tasks, milestone execution, deliverables');

  // 2. Seed Users
  const insertUser = db.prepare(`
    INSERT INTO users (id, full_name, email, password_hash, role_id, is_active, avatar_url)
    VALUES (?, ?, ?, ?, ?, 1, ?)
  `);
  insertUser.run(1, 'Arthur Pendelton', 'admin@nexusicp.io', hashPassword('Admin123!'), 1, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80');
  insertUser.run(2, 'Sarah Chen', 'sarah.chen@nexusicp.io', hashPassword('Manager123!'), 2, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80');
  insertUser.run(3, 'Marcus Vance', 'marcus.vance@nexusicp.io', hashPassword('Sales123!'), 3, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80');
  insertUser.run(4, 'Elena Rostova', 'elena.rostova@nexusicp.io', hashPassword('Sales123!'), 3, 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80');
  insertUser.run(5, 'Alex Moran', 'alex.moran@nexusicp.io', hashPassword('Dev123!'), 4, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80');
  insertUser.run(6, 'Priya Patel', 'priya.patel@nexusicp.io', hashPassword('Dev123!'), 5, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80');

  // 3. Seed Clients
  const insertClient = db.prepare(`
    INSERT INTO clients (id, client_name, company_name, email, phone, industry, website, notes, creator_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertClient.run(1, 'John Sterling', 'Sterling Global Capital', 'j.sterling@sterlingcapital.com', '+1 (555) 234-5678', 'Financial Services', 'https://sterlingcapital.example.com', 'Tier 1 institutional trading client looking to revamp low-latency settlement', 3);
  insertClient.run(2, 'Dr. Amanda Vance', 'HealthPulse Diagnostics', 'a.vance@healthpulse.io', '+1 (555) 890-1234', 'Biotech & HealthCare', 'https://healthpulse.example.com', 'HIPAA-compliant telemetry and analytics platform integration', 3);
  insertClient.run(3, 'Kevin Durant', 'CloudScale Logistics Inc', 'kevin.d@cloudscalelog.com', '+1 (555) 345-6789', 'Supply Chain & Logistics', 'https://cloudscalelog.example.com', 'Enterprise fleet routing and dispatch automated tracking', 4);
  insertClient.run(4, 'Marcus Thorne', 'CyberShield Security', 'm.thorne@cybershield.net', '+1 (555) 901-2345', 'Cybersecurity', 'https://cybershield.example.com', 'SOC Level-3 real-time anomaly detection workspace', 4);
  insertClient.run(5, 'Lisa Ray', 'RetailNex Omni-Channel', 'lisa.ray@retailnex.com', '+1 (555) 678-9012', 'E-Commerce & Retail', 'https://retailnex.example.com', 'Inventory reconciliation engine across 450 warehouse hubs', 3);
  insertClient.run(6, 'Dmitri Volkov', 'Starlight Media Studios', 'dmitri@starlightmedia.tv', '+1 (555) 432-1098', 'Media & Entertainment', 'https://starlight.example.com', 'Digital asset management portal migration', 4);

  // 4. Seed ICP Pipeline entries
  const insertPipeline = db.prepare(`
    INSERT INTO icp_pipeline (id, client_id, sales_person_id, title, deal_amount, status, icpi_content, notes, sent_date, response_date, expected_close_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertPipeline.run(
    1,
    1,
    3,
    'Sterling High-Frequency Settlement Ledger',
    140000,
    'won',
    'Comprehensive ICP Proposal: Micro-batch settlement architecture with sub-millisecond audit trails and ISO 20022 compliance.',
    'Client executive committee approved initial prototype. Proceeded to contract execution.',
    '2026-09-12 10:00:00',
    '2026-09-18 14:30:00',
    '2026-10-15'
  );

  insertPipeline.run(
    2,
    3,
    4,
    'CloudScale Automated Dispatch Optimization Engine',
    85000,
    'won',
    'Enterprise ICPI: Real-time route optimization microservices with algorithmic traffic prediction and driver mobile SDK.',
    'Signed Master Services Agreement after technical POC presentation.',
    '2026-09-20 09:15:00',
    '2026-09-25 11:00:00',
    '2026-10-20'
  );

  insertPipeline.run(
    3,
    4,
    4,
    'CyberShield SOC Threat Intelligence Portal',
    65000,
    'negotiation',
    'Targeted ICP Package: Zero-trust telemetry aggregator with interactive investigation graph and webhook dispatchers.',
    'Final legal review of SLA terms and SOC2 Type II compliance covenants.',
    '2026-10-05 14:00:00',
    '2026-10-11 16:45:00',
    '2026-11-10'
  );

  insertPipeline.run(
    4,
    2,
    3,
    'HealthPulse HIPAA Telemetry Data Platform',
    95000,
    'response_received',
    'Standard ICPI: End-to-end encrypted medical sensor stream ingestion with automated FHIR protocol conversion.',
    'Dr. Vance responded favorably; scheduled technical architecture deep-dive for next Tuesday.',
    '2026-10-14 11:20:00',
    '2026-10-22 09:10:00',
    '2026-11-20'
  );

  insertPipeline.run(
    5,
    5,
    3,
    'RetailNex Global Inventory Synchronization Hub',
    48000,
    'icpi_sent',
    'Introductory ICPI: Distributed catalog replication with event-driven optimistic concurrency control.',
    'ICPI pitch deck and ROI benchmark report dispatched to procurement.',
    '2026-10-24 15:30:00',
    null,
    '2026-11-30'
  );

  insertPipeline.run(
    6,
    6,
    4,
    'Starlight Media CMS Cloud Migration',
    32000,
    'lost_dead',
    'Media transcode pipeline modernization and CDN edge acceleration package.',
    'Prospect postponed capital expenditures until Q2 next fiscal year due to corporate restructuring.',
    '2026-09-05 10:00:00',
    null,
    '2026-10-01'
  );

  // 5. Seed Closed Deals
  const insertDeal = db.prepare(`
    INSERT INTO closed_deals (id, pipeline_id, project_name, final_amount, sales_person_id, manager_id, developer_id, technical_scope, deliverables, status, closure_date, target_delivery_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertDeal.run(
    1,
    1,
    'Sterling Capital Settlement Engine v2.0',
    140000,
    3,
    2,
    5,
    'Design and build high-throughput transaction ledger utilizing Node 22, SQLite WAL mode, WebSockets streaming, and cryptographic hash verification.',
    '1. High-availability API service\n2. Real-time reconciliation dashboard\n3. Disaster recovery failover scripts\n4. ISO 20022 audit logs exporter',
    'in_development',
    '2026-10-15',
    '2026-12-20'
  );

  insertDeal.run(
    2,
    2,
    'CloudScale Autonomous Dispatch Service',
    85000,
    4,
    2,
    6,
    'Geospatial route optimization algorithms with dynamic fleet clustering and real-time dispatcher telemetry UI.',
    '1. Dispatch routing engine API\n2. Dispatcher control room React SPA\n3. Fleet mobile webhook integration\n4. Performance benchmark suite',
    'kickoff',
    '2026-10-20',
    '2026-12-05'
  );

  // 6. Seed Project Milestones
  const insertMilestone = db.prepare(`
    INSERT INTO project_milestones (deal_id, milestone_name, description, due_date, status, completed_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // Deal 1 Milestones
  insertMilestone.run(1, 'SRS & Architecture Blueprint Signoff', 'Detailed component specification and data model validation', '2026-10-22', 'completed', '2026-10-21 16:00:00');
  insertMilestone.run(1, 'Core Ledger Ingestion API', 'Sub-millisecond ingestion microservice with optimistic locking', '2026-10-31', 'in_progress', null);
  insertMilestone.run(1, 'Audit Trail & Webhook Engine', 'Tamper-evident cryptographically chained audit events', '2026-11-15', 'pending', null);
  insertMilestone.run(1, 'UAT & Compliance Penetration Testing', 'Security team verification and ISO 20022 certification', '2026-12-10', 'pending', null);

  // Deal 2 Milestones
  insertMilestone.run(2, 'Project Kickoff & Environment Setup', 'CI/CD pipeline, dev servers, and repository permissions', '2026-10-25', 'completed', '2026-10-24 17:30:00');
  insertMilestone.run(2, 'Fleet Routing Algorithm Core', 'Graph optimization module and distance matrix solver', '2026-11-05', 'in_progress', null);
  insertMilestone.run(2, 'Dispatcher Web Interface Demo', 'Interactive vehicle tracking map and schedule manager', '2026-11-20', 'pending', null);

  // 7. Seed Project Documents
  const insertDoc = db.prepare(`
    INSERT INTO project_documents (deal_id, file_name, file_type, file_size, category, content_preview, uploaded_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertDoc.run(1, 'MSA_SterlingCapital_Executed.pdf', 'application/pdf', 1240000, 'contract', 'Master Services Agreement executed on Oct 15, 2026 by Arthur Pendelton and John Sterling.', 2);
  insertDoc.run(1, 'Architecture_DataFlow_v1.png', 'image/png', 2450000, 'technical_spec', 'High-level component topology: WebSocket client -> Gateway -> Node Ingestion Engine -> SQLite WAL.', 5);
  insertDoc.run(1, 'SOP_Production_Deployment_Runbook.md', 'text/markdown', 38000, 'sop', '# Standard Operating Procedure: Zero-Downtime Deployment\n1. Verify canary tests\n2. Drain ingress traffic\n3. Apply schema migration scripts\n4. Smoke test endpoints.', 5);
  insertDoc.run(2, 'CloudScale_Routing_SLA.pdf', 'application/pdf', 890000, 'contract', 'Performance SLA guaranteeing <= 250ms route calculation at 10,000 concurrent fleet vehicles.', 2);
  insertDoc.run(2, 'UI_Design_Tokens_Kit.fig', 'application/octet-stream', 4500000, 'design_asset', 'Figma design tokens including dark/light mode palette, typography scale, and dispatch badges.', 6);

  // 8. Seed Audit Logs
  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (user_id, user_name, user_role, action, entity_type, entity_id, details, ip_address, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertAudit.run(1, 'Arthur Pendelton', 'admin', 'SYSTEM_INIT', 'system', 0, 'Database tables initialized and default roles established', '127.0.0.1', '2026-09-01 08:00:00');
  insertAudit.run(3, 'Marcus Vance', 'sales', 'PIPELINE_CREATE', 'icp_pipeline', 1, 'Created new ICP lead for Sterling Capital ($140,000)', '192.168.1.45', '2026-09-12 10:00:00');
  insertAudit.run(3, 'Marcus Vance', 'sales', 'ICPI_SENT', 'icp_pipeline', 1, 'Dispatched ICP Introduction and Technical capability deck', '192.168.1.45', '2026-09-12 10:15:00');
  insertAudit.run(2, 'Sarah Chen', 'manager', 'DEAL_CLOSED', 'closed_deals', 1, 'Marked Sterling High-Frequency Settlement Ledger as WON ($140,000) and initialized project workspace', '192.168.1.12', '2026-10-15 14:20:00');
  insertAudit.run(5, 'Alex Moran', 'senior_dev', 'MILESTONE_COMPLETE', 'project_milestones', 1, 'Marked milestone "SRS & Architecture Blueprint Signoff" as completed', '192.168.1.88', '2026-10-21 16:05:00');

  // 9. Seed Notifications
  const insertNotification = db.prepare(`
    INSERT INTO notifications (user_id, title, message, type, is_read, link)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertNotification.run(3, 'ICPI Response Received', 'Dr. Amanda Vance from HealthPulse responded to the telemetry platform proposal.', 'icpi_response', 0, '/pipeline');
  insertNotification.run(2, 'Deal Successfully Closed', 'CloudScale Autonomous Dispatch Service ($85,000) was approved and moved to Closed Deals.', 'deal_closed', 0, '/projects');
  insertNotification.run(5, 'Milestone Due Soon', 'Milestone "Core Ledger Ingestion API" is due in 4 days (October 31, 2026).', 'deadline_approaching', 0, '/projects');
  insertNotification.run(6, 'New Project Assigned', 'You have been assigned as lead developer on CloudScale Dispatch Optimization.', 'system_alert', 1, '/projects');

  // 10. Seed Communications
  const insertComm = db.prepare(`
    INSERT INTO client_communications (client_id, logged_by, channel, subject, summary, communicated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertComm.run(1, 3, 'meeting', 'Executive Demo & Scope Alignment', 'Presented high-throughput architecture to CTO and VP of Engineering. Received positive feedback.', '2026-09-18 15:00:00');
  insertComm.run(2, 3, 'email', 'Security Compliance Questionnaire', 'Sent completed SOC2 and HIPAA compliance matrix back to Chief Compliance Officer.', '2026-10-20 11:30:00');
  insertComm.run(4, 4, 'call', 'SOC Telemetry Requirements Call', 'Discussed raw event ingestion rates (up to 45k eps) and custom alert routing rules.', '2026-10-22 14:15:00');
}
