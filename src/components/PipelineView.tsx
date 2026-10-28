import React, { useState } from 'react';
import {
  Plus,
  Send,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  Building,
  User,
  DollarSign,
  Calendar,
  Filter,
  Columns,
  List,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { PipelineItem, PipelineStatus } from '../types';

interface PipelineViewProps {
  items: PipelineItem[];
  onOpenNewLead: () => void;
  onSendIcpi: (item: PipelineItem) => void;
  onConvertToDeal: (item: PipelineItem) => void;
  onUpdateStatus: (id: number, status: PipelineStatus, notes?: string) => void;
  onSelectClient: (clientId: number) => void;
  onSelectPipeline: (id: number) => void;
  searchQuery: string;
}

export const PipelineView: React.FC<PipelineViewProps> = ({
  items,
  onOpenNewLead,
  onSendIcpi,
  onConvertToDeal,
  onUpdateStatus,
  onSelectClient,
  onSelectPipeline,
  searchQuery,
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [selectedRep, setSelectedRep] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');

  const stages: Array<{ id: PipelineStatus; label: string; color: string; border: string }> = [
    { id: 'draft', label: 'Draft ICPI', color: 'bg-slate-800/80 text-slate-300', border: 'border-slate-700' },
    { id: 'icpi_sent', label: 'ICPI Sent', color: 'bg-indigo-950/60 text-indigo-300', border: 'border-indigo-700/60' },
    { id: 'response_received', label: 'Response Received', color: 'bg-sky-950/60 text-sky-300', border: 'border-sky-700/60' },
    { id: 'negotiation', label: 'In Negotiation', color: 'bg-amber-950/60 text-amber-300', border: 'border-amber-700/60' },
    { id: 'won', label: 'Closed Won', color: 'bg-emerald-950/60 text-emerald-300', border: 'border-emerald-700/60' },
    { id: 'lost_dead', label: 'Dead / Cold', color: 'bg-rose-950/60 text-rose-300', border: 'border-rose-700/60' },
  ];

  // Filtering
  const filteredItems = items.filter((item) => {
    if (selectedStage !== 'all' && item.status !== selectedStage) return false;
    if (selectedRep !== 'all' && item.sales_person_name !== selectedRep) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchClient = item.client_name?.toLowerCase().includes(q);
      const matchCompany = item.company_name?.toLowerCase().includes(q);
      const matchIndustry = item.industry?.toLowerCase().includes(q);
      if (!matchTitle && !matchClient && !matchCompany && !matchIndustry) return false;
    }
    return true;
  });

  // Extract unique sales reps
  const salesReps = Array.from(new Set(items.map((i) => i.sales_person_name).filter(Boolean)));

  const getStageBadge = (status: PipelineStatus) => {
    const s = stages.find((x) => x.id === status);
    return s ? `${s.color} ${s.border}` : 'bg-slate-800 text-slate-300 border-slate-700';
  };

  return (
    <div className="space-y-5">
      {/* View Header & Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            ICP Pipeline & Lead Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Track Ideal Customer Profile outreach, dispatch proposals, log prospect responses, and convert won deals.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-slate-700 bg-slate-800 p-0.5">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center space-x-1 rounded-md px-2.5 py-1 text-xs font-medium ${
                viewMode === 'kanban' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Columns className="h-3.5 w-3.5" />
              <span>Board</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center space-x-1 rounded-md px-2.5 py-1 text-xs font-medium ${
                viewMode === 'table' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
          </div>

          <button
            onClick={onOpenNewLead}
            className="flex items-center space-x-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-medium text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Lead</span>
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <Filter className="h-3.5 w-3.5 text-indigo-400" />
          <span>Filters:</span>
        </div>

        {/* Filter by Stage */}
        <select
          value={selectedStage}
          onChange={(e) => setSelectedStage(e.target.value)}
          aria-label="Filter by Pipeline Stage"
          className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
        >
          <option value="all">All Pipeline Stages</option>
          {stages.map((st) => (
            <option key={st.id} value={st.id}>
              {st.label}
            </option>
          ))}
        </select>

        {/* Filter by Sales Rep */}
        <select
          value={selectedRep}
          onChange={(e) => setSelectedRep(e.target.value)}
          aria-label="Filter by Sales Representative"
          className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
        >
          <option value="all">All Sales Reps</option>
          {salesReps.map((rep) => (
            <option key={rep} value={rep}>
              {rep}
            </option>
          ))}
        </select>

        <span className="text-xs text-slate-400 ml-auto">
          Showing <span className="font-semibold text-white">{filteredItems.length}</span> of {items.length} opportunities
        </span>
      </div>

      {/* View Content: Kanban vs Table */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 items-start">
          {stages.map((st) => {
            const stageItems = filteredItems.filter((i) => i.status === st.id);
            const totalStageValue = stageItems.reduce((acc, curr) => acc + (curr.deal_amount || 0), 0);

            return (
              <div
                key={st.id}
                className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/40 min-h-[480px]"
              >
                {/* Column Header */}
                <div className={`rounded-t-xl border-b p-3 ${st.border} ${st.color}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider">{st.label}</span>
                    <span className="rounded-full bg-slate-900/60 px-2 py-0.5 text-[10px] font-bold">
                      {stageItems.length}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] font-mono font-medium opacity-80">
                    ${totalStageValue.toLocaleString()}
                  </div>
                </div>

                {/* Column Items */}
                <div className="flex-1 p-2 space-y-2.5 overflow-y-auto max-h-[700px]">
                  {stageItems.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 italic">
                      No leads in this stage
                    </div>
                  ) : (
                    stageItems.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-slate-800 bg-slate-800/90 p-3 shadow-md hover:border-slate-700 transition-all hover:translate-y-[-1px]"
                      >
                        <div className="flex items-start justify-between">
                          <button
                            onClick={() => onSelectPipeline(item.id)}
                            className="text-left text-xs font-semibold text-slate-100 hover:text-indigo-300 transition-colors line-clamp-2 underline decoration-transparent hover:decoration-indigo-400 underline-offset-2"
                            title="Click to view details, contact count, and conversation logs"
                          >
                            {item.title}
                          </button>
                        </div>

                        {/* Client details */}
                        <div className="mt-2 space-y-1 text-[11px] text-slate-400">
                          <button
                            onClick={() => onSelectClient(item.client_id)}
                            className="flex items-center space-x-1 text-indigo-400 hover:text-indigo-300 hover:underline"
                          >
                            <Building className="h-3 w-3" />
                            <span className="font-medium truncate">{item.company_name}</span>
                          </button>
                          <div className="flex items-center space-x-1 text-slate-400">
                            <User className="h-3 w-3" />
                            <span>{item.client_name}</span>
                          </div>
                        </div>

                        {/* Amount & Rep */}
                        <div className="mt-3 flex items-center justify-between border-t border-slate-700/60 pt-2 text-xs">
                          <span className="font-mono font-bold text-white">
                            ${(item.deal_amount || 0).toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {item.sales_person_name.split(' ')[0]}
                          </span>
                        </div>

                        {/* Details & Contact Log trigger */}
                        <div className="mt-2.5">
                          <button
                            onClick={() => onSelectPipeline(item.id)}
                            className="w-full flex items-center justify-center space-x-1 rounded bg-slate-700/50 hover:bg-slate-700 py-1 text-[11px] font-semibold text-indigo-300 border border-slate-600/40 transition-colors"
                            title="View details, touchpoint logs, and what they said"
                          >
                            <MessageSquare className="h-3 w-3 text-indigo-400" />
                            <span>Details & Contact Log</span>
                          </button>
                        </div>

                        {/* Quick Action Buttons */}
                        <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-slate-700/40 pt-2">
                          {item.status === 'draft' && (
                            <button
                              onClick={() => onSendIcpi(item)}
                              className="w-full flex items-center justify-center space-x-1 rounded bg-indigo-600/80 py-1 text-[11px] font-medium text-white hover:bg-indigo-600"
                            >
                              <Send className="h-3 w-3" />
                              <span>Send ICPI</span>
                            </button>
                          )}

                          {item.status === 'icpi_sent' && (
                            <button
                              onClick={() => onUpdateStatus(item.id, 'response_received', 'Prospect responded positively to sent ICPI')}
                              className="w-full flex items-center justify-center space-x-1 rounded bg-sky-600/80 py-1 text-[11px] font-medium text-white hover:bg-sky-600"
                            >
                              <MessageSquare className="h-3 w-3" />
                              <span>Log Response</span>
                            </button>
                          )}

                          {item.status === 'response_received' && (
                            <button
                              onClick={() => onUpdateStatus(item.id, 'negotiation', 'Moved into pricing negotiation & SLA terms')}
                              className="w-full flex items-center justify-center space-x-1 rounded bg-amber-600/80 py-1 text-[11px] font-medium text-white hover:bg-amber-600"
                            >
                              <ArrowRight className="h-3 w-3" />
                              <span>Enter Negotiation</span>
                            </button>
                          )}

                          {item.status === 'negotiation' && (
                            <button
                              onClick={() => onConvertToDeal(item)}
                              className="w-full flex items-center justify-center space-x-1 rounded bg-emerald-600/90 py-1 text-[11px] font-medium text-white hover:bg-emerald-600"
                            >
                              <CheckCircle className="h-3 w-3" />
                              <span>Convert to Won Deal</span>
                            </button>
                          )}

                          {item.status === 'won' && !item.closed_deal_id && (
                            <button
                              onClick={() => onConvertToDeal(item)}
                              className="w-full flex items-center justify-center space-x-1 rounded bg-emerald-700/80 py-1 text-[11px] font-medium text-white hover:bg-emerald-600"
                            >
                              <span>Setup Project</span>
                            </button>
                          )}

                          {item.status !== 'won' && item.status !== 'lost_dead' && (
                            <button
                              onClick={() => onUpdateStatus(item.id, 'lost_dead', 'Marked as disqualified or cold')}
                              className="w-full text-center text-[10px] text-slate-400 hover:text-rose-400 py-0.5"
                            >
                              Mark Cold / Dead
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-800/60 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">Opportunity Title</th>
                  <th className="px-4 py-3">Client & Company</th>
                  <th className="px-4 py-3">Industry</th>
                  <th className="px-4 py-3">Deal Value</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3">Sales Person</th>
                  <th className="px-4 py-3">Sent / Response</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/60 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-200">
                      <button
                        onClick={() => onSelectPipeline(item.id)}
                        className="text-left font-semibold hover:text-indigo-300 transition-colors underline decoration-transparent hover:decoration-indigo-400"
                        title="Click to view details, contact count, and conversation logs"
                      >
                        {item.title}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-300">{item.company_name}</div>
                      <div className="text-[11px] text-slate-400">{item.client_name}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{item.industry || 'Technology'}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-white">
                      ${(item.deal_amount || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${getStageBadge(item.status)}`}>
                        {stages.find((s) => s.id === item.status)?.label || item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{item.sales_person_name}</td>
                    <td className="px-4 py-3 text-[11px] text-slate-400">
                      <div>Sent: {item.sent_date ? item.sent_date.split(' ')[0] : 'Not yet'}</div>
                      <div>Replied: {item.response_date ? item.response_date.split(' ')[0] : 'Pending'}</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => onSelectPipeline(item.id)}
                          className="rounded border border-indigo-700/50 bg-indigo-950/40 px-2 py-1 text-[11px] font-semibold text-indigo-300 hover:bg-indigo-900/60 transition-colors"
                          title="View details and contact logs"
                        >
                          Details & Log
                        </button>
                        {item.status === 'draft' && (
                          <button
                            onClick={() => onSendIcpi(item)}
                            className="rounded bg-indigo-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-indigo-500"
                          >
                            Send ICPI
                          </button>
                        )}
                        {item.status === 'icpi_sent' && (
                          <button
                            onClick={() => onUpdateStatus(item.id, 'response_received')}
                            className="rounded bg-sky-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-sky-500"
                          >
                            Log Response
                          </button>
                        )}
                        {item.status === 'negotiation' && (
                          <button
                            onClick={() => onConvertToDeal(item)}
                            className="rounded bg-emerald-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-emerald-500"
                          >
                            Convert to Deal
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
