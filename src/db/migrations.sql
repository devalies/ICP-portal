-- ====================================================================
-- NexusICP Enterprise Relational Database Schema & Migration v1.0
-- Database: SQLite (with PRAGMA foreign_keys = ON) / PostgreSQL Compatible
-- ====================================================================

PRAGMA foreign_keys = ON;

-- 1. ROLES TABLE
CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role_id INTEGER NOT NULL,
  is_active INTEGER DEFAULT 1,
  avatar_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE RESTRICT
);

-- 3. CLIENTS TABLE
CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  industry TEXT,
  website TEXT,
  notes TEXT,
  creator_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creator_id) REFERENCES users (id) ON DELETE RESTRICT
);

-- 4. ICP PIPELINE TABLE
-- Status enums: 'draft', 'icpi_sent', 'response_received', 'negotiation', 'won', 'lost_dead'
CREATE TABLE IF NOT EXISTS icp_pipeline (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  sales_person_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  deal_amount REAL NOT NULL DEFAULT 0.0,
  status TEXT CHECK(status IN ('draft', 'icpi_sent', 'response_received', 'negotiation', 'won', 'lost_dead')) NOT NULL DEFAULT 'draft',
  icpi_content TEXT,
  notes TEXT,
  sent_date DATETIME,
  response_date DATETIME,
  expected_close_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE CASCADE,
  FOREIGN KEY (sales_person_id) REFERENCES users (id) ON DELETE RESTRICT
);

-- 5. CLOSED DEALS / PROJECT WORKSPACE TABLE
-- Status enums: 'kickoff', 'in_development', 'qa_testing', 'completed'
CREATE TABLE IF NOT EXISTS closed_deals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pipeline_id INTEGER UNIQUE NOT NULL,
  project_name TEXT NOT NULL,
  final_amount REAL NOT NULL,
  sales_person_id INTEGER NOT NULL,
  manager_id INTEGER NOT NULL,
  developer_id INTEGER NOT NULL,
  technical_scope TEXT,
  deliverables TEXT,
  status TEXT CHECK(status IN ('kickoff', 'in_development', 'qa_testing', 'completed')) NOT NULL DEFAULT 'kickoff',
  closure_date DATE NOT NULL,
  target_delivery_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pipeline_id) REFERENCES icp_pipeline (id) ON DELETE RESTRICT,
  FOREIGN KEY (sales_person_id) REFERENCES users (id) ON DELETE RESTRICT,
  FOREIGN KEY (manager_id) REFERENCES users (id) ON DELETE RESTRICT,
  FOREIGN KEY (developer_id) REFERENCES users (id) ON DELETE RESTRICT
);

-- 6. PROJECT MILESTONES TABLE
-- Status enums: 'pending', 'in_progress', 'review', 'completed'
CREATE TABLE IF NOT EXISTS project_milestones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deal_id INTEGER NOT NULL,
  milestone_name TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  status TEXT CHECK(status IN ('pending', 'in_progress', 'review', 'completed')) NOT NULL DEFAULT 'pending',
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (deal_id) REFERENCES closed_deals (id) ON DELETE CASCADE
);

-- 7. PROJECT DOCUMENTS & CONTRACTS TABLE
CREATE TABLE IF NOT EXISTS project_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deal_id INTEGER NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  category TEXT CHECK(category IN ('contract', 'design_asset', 'sop', 'technical_spec', 'deliverable')) NOT NULL,
  content_preview TEXT,
  uploaded_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (deal_id) REFERENCES closed_deals (id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users (id) ON DELETE RESTRICT
);

-- 8. AUDIT LOGS & ACTIVITY TRAIL TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  user_name TEXT,
  user_role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id INTEGER,
  details TEXT,
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 9. NOTIFICATIONS AND ALERTS TABLE
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK(type IN ('icpi_response', 'deal_closed', 'deadline_approaching', 'system_alert')) NOT NULL,
  is_read INTEGER DEFAULT 0,
  link TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 10. CLIENT COMMUNICATIONS HISTORY TABLE
CREATE TABLE IF NOT EXISTS client_communications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  logged_by INTEGER NOT NULL,
  channel TEXT NOT NULL,
  subject TEXT NOT NULL,
  summary TEXT NOT NULL,
  communicated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE CASCADE,
  FOREIGN KEY (logged_by) REFERENCES users (id) ON DELETE RESTRICT
);

-- INDEXES FOR ENTERPRISE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_client ON icp_pipeline (client_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_sales ON icp_pipeline (sales_person_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_status ON icp_pipeline (status);
CREATE INDEX IF NOT EXISTS idx_closed_deals_dev ON closed_deals (developer_id);
CREATE INDEX IF NOT EXISTS idx_closed_deals_manager ON closed_deals (manager_id);
CREATE INDEX IF NOT EXISTS idx_milestones_deal ON project_milestones (deal_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON project_milestones (status);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs (created_at);
