import React, { useState, useEffect } from 'react';
import {
  History,
  Shield,
  Download,
  Filter,
  Search,
  User,
  Calendar,
  CheckCircle,
  Clock,
  ArrowUpDown,
} from 'lucide-react';
import { AuditLog } from '../types';
import { apiClient } from '../services/api';

export const AuditTrailView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterEntity, setFilterEntity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getAuditLogs({ limit: 150 });
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (filterAction !== 'all' && !log.action.includes(filterAction)) return false;
    if (filterEntity !== 'all' && log.entity_type !== filterEntity) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchActor = log.user_name?.toLowerCase().includes(q);
      const matchDetails = log.details?.toLowerCase().includes(q);
      const matchAction = log.action?.toLowerCase().includes(q);
      if (!matchActor && !matchDetails && !matchAction) return false;
    }
    return true;
  });

  const getActionBadge = (action: string) => {
    if (action.includes('CREATE') || action.includes('INIT')) {
      return 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60';
    }
    if (action.includes('UPDATE') || action.includes('STATUS')) {
      return 'bg-sky-950/60 text-sky-300 border-sky-700/60';
    }
    if (action.includes('CONVERT') || action.includes('WON')) {
      return 'bg-amber-950/60 text-amber-300 border-amber-700/60';
    }
    if (action.includes('DELETE')) {
      return 'bg-rose-950/60 text-rose-300 border-rose-700/60';
    }
    return 'bg-indigo-950/60 text-indigo-300 border-indigo-700/60';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Enterprise Audit Trail & Accountability
            </h1>
            <span className="rounded border border-indigo-500/40 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-300">
              IMMUTABLE LOGS
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Cryptographic and timestamped trail of pipeline movements, contract conversions, timeline adjustments, and user actions.
          </p>
        </div>

        <a
          href="/api/export/audit-logs.csv"
          download
          className="flex items-center space-x-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700"
        >
          <Download className="h-3.5 w-3.5 text-indigo-400" />
          <span>Export Logs (CSV)</span>
        </a>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <Filter className="h-3.5 w-3.5 text-indigo-400" />
          <span>Filter Trail:</span>
        </div>

        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
        >
          <option value="all">All Actions</option>
          <option value="PIPELINE">Pipeline Changes</option>
          <option value="DEAL">Closed Deals</option>
          <option value="MILESTONE">Milestone Updates</option>
          <option value="USER">User Management</option>
          <option value="DOCUMENT">Document Uploads</option>
        </select>

        <select
          value={filterEntity}
          onChange={(e) => setFilterEntity(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
        >
          <option value="all">All Target Entities</option>
          <option value="icp_pipeline">icp_pipeline</option>
          <option value="closed_deals">closed_deals</option>
          <option value="project_milestones">project_milestones</option>
          <option value="users">users</option>
          <option value="clients">clients</option>
        </select>

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search actor name, details..."
            className="w-full rounded-lg border border-slate-700 bg-slate-800/80 py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <span className="text-xs text-slate-400">
          {filteredLogs.length} entries
        </span>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-800/60 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Timestamp (UTC)</th>
                <th className="px-4 py-3">Actor & Persona</th>
                <th className="px-4 py-3">Action Type</th>
                <th className="px-4 py-3">Entity Scoped</th>
                <th className="px-4 py-3">Event Details & Changes</th>
                <th className="px-4 py-3">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                    Loading audit trail...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                    No audit records match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors font-sans">
                    <td className="px-4 py-3 text-[11px] text-slate-400 font-mono whitespace-nowrap">
                      {log.created_at}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-200">{log.user_name || 'System'}</div>
                      <span className="text-[10px] uppercase font-bold text-indigo-400">
                        {log.user_role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded border px-2 py-0.5 text-[10px] font-bold uppercase font-mono ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-300">
                      {log.entity_type} {log.entity_id ? `(#${log.entity_id})` : ''}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300 max-w-md">
                      {log.details}
                    </td>
                    <td className="px-4 py-3 font-mono text-[10px] text-slate-400">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
