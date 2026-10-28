import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  Database,
  Layers,
  Code,
  Copy,
  Check,
  Play,
  Shield,
  FileCode,
  Server,
  ArrowRight,
} from 'lucide-react';
import { apiClient } from '../services/api';

interface ApiDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiDocsModal: React.FC<ApiDocsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'schema' | 'api'>('architecture');
  const [apiDocs, setApiDocs] = useState<any>(null);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testingEndpoint, setTestingEndpoint] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadDocs();
    }
  }, [isOpen]);

  const loadDocs = async () => {
    try {
      const data = await apiClient.getApiDocs();
      setApiDocs(data);
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  const rawSqlSchema = `-- ====================================================================
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
);`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(rawSqlSchema);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleTestEndpoint = async (path: string, method: string) => {
    setTestingEndpoint(path);
    setTestResult('Invoking live API endpoint...');
    try {
      const res = await apiClient.request<any>(path, { method });
      setTestResult(JSON.stringify(res, null, 2));
    } catch (err: any) {
      setTestResult(`Error: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-6 backdrop-blur-md">
      <div className="flex h-full max-h-[92vh] w-full max-w-5xl flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600/30 text-indigo-400 border border-indigo-500/40">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>System Architecture, ERD & RESTful API Documentation</span>
              </h2>
              <p className="text-xs text-slate-400">
                Architectural blueprint, relational database DDL migrations, and live API endpoints.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-800 bg-slate-900/90 px-6">
          <button
            onClick={() => setActiveTab('architecture')}
            className={`border-b-2 py-3 px-4 text-xs font-semibold transition-colors flex items-center space-x-2 ${
              activeTab === 'architecture'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Architecture & RBAC Plan</span>
          </button>

          <button
            onClick={() => setActiveTab('schema')}
            className={`border-b-2 py-3 px-4 text-xs font-semibold transition-colors flex items-center space-x-2 ${
              activeTab === 'schema'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="h-4 w-4" />
            <span>Relational Schema & SQL Migration</span>
          </button>

          <button
            onClick={() => setActiveTab('api')}
            className={`border-b-2 py-3 px-4 text-xs font-semibold transition-colors flex items-center space-x-2 ${
              activeTab === 'api'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="h-4 w-4" />
            <span>RESTful API Reference & Live Tester</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: ARCHITECTURE */}
          {activeTab === 'architecture' && (
            <div className="space-y-6 text-xs text-slate-300">
              <div className="rounded-xl border border-indigo-900/50 bg-indigo-950/20 p-4">
                <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                  <Server className="h-4 w-4 text-indigo-400" />
                  <span>NexusICP High-Level System Architecture</span>
                </h3>
                <p className="mt-1 text-slate-300 leading-relaxed">
                  NexusICP is architected as an enterprise full-stack web application designed for high availability, relational data consistency, and strict multi-tier role-based access control (RBAC). The backend runs Node.js 22 with Express and SQLite in Write-Ahead-Logging (WAL) mode with foreign key enforcement. The frontend is built with React 19, TypeScript, and Tailwind CSS.
                </p>
              </div>

              {/* Architecture Topology */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-4">
                  <span className="font-semibold text-indigo-300 uppercase tracking-wider text-[11px] block">
                    1. Client Layer (React 19 SPA)
                  </span>
                  <ul className="mt-2 space-y-1.5 text-slate-400">
                    <li>• Role-aware responsive navigation & layout</li>
                    <li>• Real-time KPI dashboards & conversion funnel</li>
                    <li>• Interactive Kanban board & Table views</li>
                    <li>• Dynamic SOP document authoring</li>
                    <li>• Fast token-based session handling</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-4">
                  <span className="font-semibold text-emerald-300 uppercase tracking-wider text-[11px] block">
                    2. Service Layer (Express 4 API)
                  </span>
                  <ul className="mt-2 space-y-1.5 text-slate-400">
                    <li>• RBAC guards (`requireRoles`)</li>
                    <li>• Automated notification triggers</li>
                    <li>• Immutable audit logging (`recordAudit`)</li>
                    <li>• CSV streaming exports</li>
                    <li>• Pure business calculation engine</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-4">
                  <span className="font-semibold text-amber-300 uppercase tracking-wider text-[11px] block">
                    3. Relational Persistence
                  </span>
                  <ul className="mt-2 space-y-1.5 text-slate-400">
                    <li>• Native `node:sqlite` DatabaseSync</li>
                    <li>• Foreign key integrity (`PRAGMA foreign_keys = ON`)</li>
                    <li>• Check constraints on enum states</li>
                    <li>• Indexed queries on critical columns</li>
                    <li>• Automated SQL migration runner</li>
                  </ul>
                </div>
              </div>

              {/* RBAC Matrix */}
              <div className="rounded-xl border border-slate-800 bg-slate-800/50 p-4">
                <h4 className="font-bold text-slate-200 uppercase tracking-wider text-xs mb-3 flex items-center">
                  <Shield className="h-3.5 w-3.5 text-purple-400 mr-1.5" />
                  Role-Based Access Control (RBAC) Security Matrix
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-700 bg-slate-800/80 text-slate-400 font-semibold">
                      <tr>
                        <th className="p-2">Role Persona</th>
                        <th className="p-2">Pipeline & Metrics</th>
                        <th className="p-2">Send ICPI & Convert</th>
                        <th className="p-2">Closed Projects Workspace</th>
                        <th className="p-2">User Provisioning</th>
                        <th className="p-2">Audit Logs & Financials</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                      <tr>
                        <td className="p-2 font-bold text-purple-300 font-sans">Administrator</td>
                        <td className="p-2 text-emerald-400">FULL ACCESS</td>
                        <td className="p-2 text-emerald-400">FULL ACCESS</td>
                        <td className="p-2 text-emerald-400">FULL ACCESS</td>
                        <td className="p-2 text-emerald-400">FULL ACCESS</td>
                        <td className="p-2 text-emerald-400">FULL ACCESS</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold text-blue-300 font-sans">Manager</td>
                        <td className="p-2 text-emerald-400">FULL ACCESS</td>
                        <td className="p-2 text-emerald-400">FULL ACCESS</td>
                        <td className="p-2 text-emerald-400">FULL ACCESS</td>
                        <td className="p-2 text-emerald-400">FULL ACCESS</td>
                        <td className="p-2 text-emerald-400">FULL ACCESS</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold text-emerald-300 font-sans">Sales Person</td>
                        <td className="p-2 text-emerald-400">FULL ACCESS</td>
                        <td className="p-2 text-emerald-400">FULL ACCESS</td>
                        <td className="p-2 text-slate-300">READ-ONLY</td>
                        <td className="p-2 text-rose-400">RESTRICTED</td>
                        <td className="p-2 text-rose-400">RESTRICTED</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold text-amber-300 font-sans">Senior Developer</td>
                        <td className="p-2 text-rose-400">RESTRICTED</td>
                        <td className="p-2 text-rose-400">RESTRICTED</td>
                        <td className="p-2 text-emerald-400">ASSIGNED SCOPE</td>
                        <td className="p-2 text-rose-400">RESTRICTED</td>
                        <td className="p-2 text-rose-400">RESTRICTED</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold text-cyan-300 font-sans">Developer</td>
                        <td className="p-2 text-rose-400">RESTRICTED</td>
                        <td className="p-2 text-rose-400">RESTRICTED</td>
                        <td className="p-2 text-emerald-400">ASSIGNED SCOPE</td>
                        <td className="p-2 text-rose-400">RESTRICTED</td>
                        <td className="p-2 text-rose-400">RESTRICTED</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SCHEMA & SQL MIGRATION */}
          {activeTab === 'schema' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Relational Database Migration Script (DDL)</h3>
                  <p className="text-xs text-slate-400">
                    Tables: roles, users, clients, icp_pipeline, closed_deals, project_milestones, project_documents, audit_logs.
                  </p>
                </div>
                <button
                  onClick={handleCopySql}
                  className="flex items-center space-x-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
                >
                  {copiedSql ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedSql ? 'Copied SQL!' : 'Copy SQL Script'}</span>
                </button>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-[500px]">
                <pre>{rawSqlSchema}</pre>
              </div>
            </div>
          )}

          {/* TAB 3: RESTful API REFERENCE */}
          {activeTab === 'api' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-4 text-xs text-slate-300">
                <span className="font-semibold text-white block">Base API Route: <code className="text-indigo-400 font-mono">/api</code></span>
                <p className="mt-1 text-slate-400">
                  Authentication requires <code className="text-slate-300 font-mono">Authorization: Bearer &lt;token&gt;</code> header on protected routes.
                </p>
              </div>

              {/* Endpoints List */}
              <div className="space-y-3">
                {apiDocs?.endpoints?.map((ep: any, idx: number) => (
                  <div key={idx} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2 font-mono">
                        <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                          ep.method === 'GET'
                            ? 'bg-blue-950/80 text-blue-300 border border-blue-700/60'
                            : ep.method === 'POST'
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                            : 'bg-amber-950/80 text-amber-300 border border-amber-700/60'
                        }`}>
                          {ep.method}
                        </span>
                        <span className="font-semibold text-slate-200">{ep.path}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400 border border-slate-700">
                          {ep.auth}
                        </span>

                        {ep.method === 'GET' && !ep.path.includes(':') && (
                          <button
                            onClick={() => handleTestEndpoint(ep.path, ep.method)}
                            className="flex items-center space-x-1 rounded bg-indigo-600/80 px-2 py-1 text-[10px] font-medium text-white hover:bg-indigo-600"
                          >
                            <Play className="h-3 w-3" />
                            <span>Test Live</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-slate-400">{ep.summary}</p>

                    {ep.requestBody && (
                      <div className="rounded bg-slate-950/60 p-2 font-mono text-[10px] text-slate-400 border border-slate-800">
                        <strong className="text-slate-300 block mb-0.5 font-sans">Request Body Schema:</strong>
                        <pre>{JSON.stringify(ep.requestBody, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Live Test Response Panel */}
              {testResult && (
                <div className="rounded-xl border border-indigo-800/60 bg-slate-950 p-4 text-xs space-y-2">
                  <div className="flex items-center justify-between text-indigo-400 font-semibold">
                    <span>Live Response for {testingEndpoint}:</span>
                    <button onClick={() => setTestResult(null)} className="text-slate-400 hover:text-white">
                      Clear
                    </button>
                  </div>
                  <pre className="max-h-60 overflow-y-auto font-mono text-[11px] text-emerald-400">
                    {testResult}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
