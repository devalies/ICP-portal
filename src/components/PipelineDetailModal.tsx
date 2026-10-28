import React, { useState, useEffect } from 'react';
import {
  X,
  Building,
  User,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Send,
  MessageSquare,
  Clock,
  CheckCircle,
  ArrowRight,
  PlusCircle,
  FileText,
  TrendingUp,
  Tag,
  Edit,
  Save,
} from 'lucide-react';
import { PipelineItem, PipelineStatus } from '../types';
import { apiClient } from '../services/api';

interface PipelineDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  pipelineId: number | null;
  onRefreshPipeline: () => void;
  onConvertToDeal: (item: PipelineItem) => void;
}

export const PipelineDetailModal: React.FC<PipelineDetailModalProps> = ({
  isOpen,
  onClose,
  pipelineId,
  onRefreshPipeline,
  onConvertToDeal,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<{
    item: PipelineItem;
    communications: any[];
    touchpointStats: {
      totalContacts: number;
      channelBreakdown: Record<string, number>;
      lastContacted: string;
    };
  } | null>(null);

  const [activeTab, setActiveTab] = useState<'log' | 'details' | 'proposal'>('log');

  // Input form state for logging new touchpoint
  const [newChannel, setNewChannel] = useState<'call' | 'meeting' | 'email' | 'demo' | 'icpi_sent'>('call');
  const [newSubject, setNewSubject] = useState('');
  const [newWhatTheySaid, setNewWhatTheySaid] = useState('');
  const [newNextFollowUp, setNewNextFollowUp] = useState('');
  const [advanceStage, setAdvanceStage] = useState<string>('');
  const [submittingTouchpoint, setSubmittingTouchpoint] = useState(false);

  // Editable deal details
  const [editTitle, setEditTitle] = useState('');
  const [editAmount, setEditAmount] = useState<string>('');
  const [editStatus, setEditStatus] = useState<PipelineStatus>('draft');
  const [editNotes, setEditNotes] = useState('');
  const [editExpectedDate, setEditExpectedDate] = useState('');
  const [savingDetails, setSavingDetails] = useState(false);

  useEffect(() => {
    if (isOpen && pipelineId) {
      loadDetail(pipelineId);
    }
  }, [isOpen, pipelineId]);

  const loadDetail = async (id: number) => {
    setLoading(true);
    try {
      const res = await apiClient.getPipelineDetails(id);
      setData(res);
      setEditTitle(res.item.title);
      setEditAmount(String(res.item.deal_amount || 0));
      setEditStatus(res.item.status);
      setEditNotes(res.item.notes || '');
      setEditExpectedDate(res.item.expected_close_date || '');
    } catch (err) {
      console.error('Failed to load pipeline details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !pipelineId) return null;

  const handleLogTouchpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject || !newWhatTheySaid) return;

    setSubmittingTouchpoint(true);
    try {
      await apiClient.logPipelineTouchpoint(pipelineId, {
        channel: newChannel,
        subject: newSubject,
        whatTheySaid: newWhatTheySaid,
        nextFollowUp: newNextFollowUp || undefined,
        advanceStage: advanceStage || undefined,
      });

      // Clear input form
      setNewSubject('');
      setNewWhatTheySaid('');
      setNewNextFollowUp('');
      setAdvanceStage('');

      // Reload
      await loadDetail(pipelineId);
      onRefreshPipeline();
    } catch (err: any) {
      alert(err.message || 'Failed to log touchpoint');
    } finally {
      setSubmittingTouchpoint(false);
    }
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDetails(true);
    try {
      await apiClient.updatePipelineItem(pipelineId, {
        title: editTitle,
        dealAmount: Number(editAmount),
        status: editStatus,
        notes: editNotes,
        expectedCloseDate: editExpectedDate || null,
      });
      await loadDetail(pipelineId);
      onRefreshPipeline();
      alert('Pipeline details updated successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to update pipeline details');
    } finally {
      setSavingDetails(false);
    }
  };

  const getStageBadge = (st: string) => {
    switch (st) {
      case 'draft':
        return 'bg-slate-800 text-slate-300 border-slate-700';
      case 'icpi_sent':
        return 'bg-indigo-950/60 text-indigo-300 border-indigo-700/60';
      case 'response_received':
        return 'bg-sky-950/60 text-sky-300 border-sky-700/60';
      case 'negotiation':
        return 'bg-amber-950/60 text-amber-300 border-amber-700/60';
      case 'won':
        return 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60';
      case 'lost_dead':
        return 'bg-rose-950/60 text-rose-300 border-rose-700/60';
      default:
        return 'bg-slate-800 text-slate-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-6 backdrop-blur-md">
      <div className="flex h-full max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/70 px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/40">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${getStageBadge(data?.item.status || 'draft')}`}>
                  {data?.item.status.replace('_', ' ')}
                </span>
                <span className="text-xs text-slate-400 font-mono">Opportunity #{pipelineId}</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
                {data?.item.title || 'Loading opportunity...'}
              </h2>
              <p className="text-xs text-slate-400">
                {data?.item.company_name} • Contact: {data?.item.client_name} ({data?.item.client_email})
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {data?.item.status === 'won' && !data?.item.closed_deal_id && (
              <button
                onClick={() => {
                  if (data?.item) onConvertToDeal(data.item);
                  onClose();
                }}
                className="hidden sm:flex items-center space-x-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/30"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                <span>Setup Project Workspace</span>
              </button>
            )}

            <button
              onClick={onClose}
              aria-label="Close modal"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Quick KPI Bar */}
        {data && (
          <div className="grid grid-cols-2 gap-2 border-b border-slate-800 bg-slate-900/90 px-6 py-3 sm:grid-cols-4 text-xs">
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Contact Count</span>
              <span className="font-mono text-sm font-bold text-indigo-300">
                {data.touchpointStats.totalContacts} touchpoint{data.touchpointStats.totalContacts === 1 ? '' : 's'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Deal Value</span>
              <span className="font-mono text-sm font-bold text-emerald-400">
                ${(data.item.deal_amount || 0).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Assigned Sales Rep</span>
              <span className="font-medium text-slate-200">
                {data.item.sales_person_name}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Last Touchpoint</span>
              <span className="font-mono text-slate-300 text-[11px]">
                {data.touchpointStats.lastContacted ? new Date(data.touchpointStats.lastContacted).toLocaleDateString() : 'None yet'}
              </span>
            </div>
          </div>
        )}

        {/* Nav Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/80 px-6">
          <button
            onClick={() => setActiveTab('log')}
            className={`border-b-2 py-3 px-4 text-xs font-semibold transition-colors flex items-center space-x-2 ${
              activeTab === 'log'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Contact Log & Client Feedback ({data?.communications.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('details')}
            className={`border-b-2 py-3 px-4 text-xs font-semibold transition-colors flex items-center space-x-2 ${
              activeTab === 'details'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Edit className="h-4 w-4" />
            <span>Edit Opportunity Details</span>
          </button>

          <button
            onClick={() => setActiveTab('proposal')}
            className={`border-b-2 py-3 px-4 text-xs font-semibold transition-colors flex items-center space-x-2 ${
              activeTab === 'proposal'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>ICPI Proposal Content</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex h-64 items-center justify-center text-xs text-slate-400">
              Loading opportunity details and touchpoint records...
            </div>
          ) : !data ? (
            <div className="text-center py-10 text-xs text-rose-400">Failed to load opportunity data.</div>
          ) : (
            <>
              {/* TAB 1: CONTACT LOGS & WHAT THEY SAID */}
              {activeTab === 'log' && (
                <div className="space-y-6">
                  {/* Form: Log New Contact & What They Said */}
                  <div className="rounded-xl border border-indigo-900/50 bg-indigo-950/20 p-4 shadow-lg">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center">
                      <PlusCircle className="mr-1.5 h-4 w-4" />
                      Record New Contact Touchpoint (How you contacted & what they said)
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Enter call notes, email replies, meeting feedback, and client responses to update the conversation trail.
                    </p>

                    <form onSubmit={handleLogTouchpoint} className="mt-3 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                            Contact Channel *
                          </label>
                          <select
                            value={newChannel}
                            onChange={(e) => setNewChannel(e.target.value as any)}
                            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                          >
                            <option value="call">Phone Call</option>
                            <option value="meeting">Video / Demo Meeting</option>
                            <option value="email">Email Exchange</option>
                            <option value="demo">Architecture Deep-Dive</option>
                            <option value="icpi_sent">Follow-Up Outreach</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                            Subject / Topic *
                          </label>
                          <input
                            type="text"
                            required
                            value={newSubject}
                            onChange={(e) => setNewSubject(e.target.value)}
                            placeholder="e.g. Discussed latency SLA & ISO compliance with CTO"
                            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-200 block mb-1">
                          What They Said (Client Feedback & Conversation Summary) *
                        </label>
                        <textarea
                          rows={3}
                          required
                          value={newWhatTheySaid}
                          onChange={(e) => setNewWhatTheySaid(e.target.value)}
                          placeholder="What did the client say? What were their concerns, questions, pricing feedback, or approval terms?"
                          className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                            Next Follow-Up / Action Item
                          </label>
                          <input
                            type="text"
                            value={newNextFollowUp}
                            onChange={(e) => setNewNextFollowUp(e.target.value)}
                            placeholder="e.g. Send revised contract draft by Thursday"
                            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                            Advance Pipeline Stage (Optional)
                          </label>
                          <select
                            value={advanceStage}
                            onChange={(e) => setAdvanceStage(e.target.value)}
                            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                          >
                            <option value="">Keep Current ({data.item.status})</option>
                            <option value="response_received">Advance to Response Received</option>
                            <option value="negotiation">Advance to In Negotiation</option>
                            <option value="won">Advance to Closed Won</option>
                            <option value="lost_dead">Mark Dead / Cold</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          disabled={submittingTouchpoint}
                          className="flex items-center space-x-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/30"
                        >
                          <Send className="h-3.5 w-3.5" />
                          <span>{submittingTouchpoint ? 'Recording...' : 'Record Contact & Response'}</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Contact Logs Timeline */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        Conversation History ({data.communications.length} Touchpoints Logged)
                      </h4>
                      <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                        <span>Channel Breakdown:</span>
                        {Object.entries(data.touchpointStats.channelBreakdown).map(([ch, cnt]) => (
                          <span key={ch} className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-300 uppercase font-mono text-[10px]">
                            {ch}: {cnt}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {data.communications.length === 0 ? (
                        <div className="rounded-xl border border-slate-800 bg-slate-800/20 p-6 text-center text-xs text-slate-400">
                          No communication logged yet for this account. Use the form above to record your first touchpoint.
                        </div>
                      ) : (
                        data.communications.map((comm) => (
                          <div
                            key={comm.id}
                            className="rounded-xl border border-slate-800 bg-slate-800/40 p-4 text-xs space-y-2 hover:border-slate-700 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="rounded bg-sky-950/60 border border-sky-700/60 px-2 py-0.5 text-[10px] font-bold uppercase text-sky-300">
                                  {comm.channel}
                                </span>
                                <h5 className="font-semibold text-slate-100">{comm.subject}</h5>
                              </div>
                              <span className="text-[11px] font-mono text-slate-400">
                                {comm.communicated_at ? new Date(comm.communicated_at).toLocaleString() : ''}
                              </span>
                            </div>

                            {/* What they said highlight */}
                            <div className="rounded-lg border border-slate-700/60 bg-slate-900/80 p-3">
                              <span className="text-[10px] font-bold uppercase text-indigo-400 block mb-1">
                                What They Said:
                              </span>
                              <p className="text-slate-200 text-xs leading-relaxed whitespace-pre-line font-sans">
                                {comm.summary}
                              </p>
                            </div>

                            <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                              <span>Logged by: <strong className="text-slate-300">{comm.logger_name || 'Team member'}</strong></span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: EDIT OPPORTUNITY DETAILS */}
              {activeTab === 'details' && (
                <form onSubmit={handleSaveDetails} className="space-y-4 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Deal Title</label>
                    <input
                      type="text"
                      required
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">Deal Amount ($)</label>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        required
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">Pipeline Stage</label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as any)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="draft">Draft ICPI</option>
                        <option value="icpi_sent">ICPI Sent</option>
                        <option value="response_received">Response Received</option>
                        <option value="negotiation">In Negotiation</option>
                        <option value="won">Closed Won</option>
                        <option value="lost_dead">Dead / Cold</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">Expected Close Date</label>
                      <input
                        type="date"
                        value={editExpectedDate}
                        onChange={(e) => setEditExpectedDate(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Internal Opportunity Notes</label>
                    <textarea
                      rows={4}
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Context on technical requirements, decision makers, budget cycle..."
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={savingDetails}
                      className="flex items-center space-x-1.5 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>{savingDetails ? 'Saving...' : 'Update Opportunity'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 3: ICPI PROPOSAL */}
              {activeTab === 'proposal' && (
                <div className="space-y-4 text-xs">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-slate-300">
                        Dispatched ICPI Content / Value Proposition
                      </label>
                      <span className="text-[10px] text-slate-400">
                        Sent on: {data.item.sent_date || 'Not yet dispatched'}
                      </span>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                      {data.item.icpi_content || 'No ICPI proposal drafted yet.'}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
