import React, { useState } from 'react';
import {
  Users,
  Building,
  Mail,
  Phone,
  Globe,
  Plus,
  MessageSquare,
  Clock,
  Briefcase,
  ChevronRight,
  Send,
  Calendar,
} from 'lucide-react';
import { Client, ClientCommunication } from '../types';
import { apiClient } from '../services/api';

interface ClientsViewProps {
  clients: Client[];
  selectedClientId: number | null;
  onSelectClient: (id: number) => void;
  onRefreshClients: () => void;
  searchQuery: string;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  clients,
  selectedClientId,
  onSelectClient,
  onRefreshClients,
  searchQuery,
}) => {
  const [selectedClientDetails, setSelectedClientDetails] = useState<{
    client: Client;
    pipelines: any[];
    communications: ClientCommunication[];
  } | null>(null);

  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  const [showAddClientModal, setShowAddClientModal] = useState<boolean>(false);
  const [showLogCommModal, setShowLogCommModal] = useState<boolean>(false);

  // New Client Form state
  const [newClientName, setNewClientName] = useState('');
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newIndustry, setNewIndustry] = useState('Technology');
  const [newWebsite, setNewWebsite] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Log Comm form state
  const [commChannel, setCommChannel] = useState('email');
  const [commSubject, setCommSubject] = useState('');
  const [commSummary, setCommSummary] = useState('');

  // Load client details whenever selectedClientId changes
  React.useEffect(() => {
    if (selectedClientId) {
      loadDetails(selectedClientId);
    } else if (clients.length > 0) {
      loadDetails(clients[0].id);
    }
  }, [selectedClientId, clients]);

  const loadDetails = async (id: number) => {
    setLoadingDetails(true);
    try {
      const data = await apiClient.getClientDetails(id);
      setSelectedClientDetails(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newCompanyName || !newEmail) return;

    try {
      const res = await apiClient.createClient({
        client_name: newClientName,
        company_name: newCompanyName,
        email: newEmail,
        phone: newPhone,
        industry: newIndustry,
        website: newWebsite,
        notes: newNotes,
      });
      setShowAddClientModal(false);
      // Reset form
      setNewClientName('');
      setNewCompanyName('');
      setNewEmail('');
      setNewPhone('');
      setNewNotes('');
      onRefreshClients();
      if (res.id) onSelectClient(res.id);
    } catch (err: any) {
      alert(err.message || 'Failed to create client');
    }
  };

  const handleLogCommunication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientDetails?.client.id || !commSubject || !commSummary) return;

    try {
      await apiClient.logClientCommunication(selectedClientDetails.client.id, {
        channel: commChannel,
        subject: commSubject,
        summary: commSummary,
      });
      setShowLogCommModal(false);
      setCommSubject('');
      setCommSummary('');
      loadDetails(selectedClientDetails.client.id);
    } catch (err: any) {
      alert(err.message || 'Failed to log communication');
    }
  };

  const filteredClients = clients.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.client_name.toLowerCase().includes(q) ||
      c.company_name.toLowerCase().includes(q) ||
      (c.industry && c.industry.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Client Directory & Relationship History
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Dedicated client records, company profiles, communication logs, and associated pipeline deals.
          </p>
        </div>

        <button
          onClick={() => setShowAddClientModal(true)}
          className="flex items-center space-x-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-medium text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Client Record</span>
        </button>
      </div>

      {/* Main Grid: Client List on Left, Detailed Client Profile on Right */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Client directory cards */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
            <span>Client Accounts ({filteredClients.length})</span>
            <span>Pipeline Value</span>
          </div>

          <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
            {filteredClients.map((c) => {
              const isSelected = selectedClientDetails?.client.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => onSelectClient(c.id)}
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-950/30 shadow-lg shadow-indigo-500/10'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-sm font-semibold text-white">{c.company_name}</h2>
                      <div className="text-xs text-slate-400 mt-0.5">{c.client_name}</div>
                    </div>
                    <span className="font-mono text-xs font-bold text-emerald-400">
                      ${(c.total_pipeline_value || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2 text-[11px] text-slate-400">
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">
                      {c.industry || 'Technology'}
                    </span>
                    <span>{c.pipeline_count || 0} Opportunities</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Client Details & Communication History */}
        <div className="lg:col-span-8">
          {selectedClientDetails ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 shadow-xl overflow-hidden">
              {/* Profile Card Header */}
              <div className="border-b border-slate-800 bg-slate-800/40 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="rounded bg-indigo-500/20 border border-indigo-500/40 px-2 py-0.5 text-[10px] font-bold text-indigo-300">
                        {selectedClientDetails.client.industry || 'Enterprise'}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        Client #{selectedClientDetails.client.id}
                      </span>
                    </div>
                    <h2 className="mt-1 text-xl font-bold text-white">
                      {selectedClientDetails.client.company_name}
                    </h2>
                    <p className="text-xs text-slate-300 font-medium mt-0.5">
                      Primary Contact: {selectedClientDetails.client.client_name}
                    </p>
                  </div>

                  <button
                    onClick={() => setShowLogCommModal(true)}
                    className="flex items-center space-x-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Log Communication</span>
                  </button>
                </div>

                {/* Contact Attributes */}
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 border-t border-slate-800/80 pt-3 text-xs">
                  <div className="flex items-center space-x-2 text-slate-300">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span>{selectedClientDetails.client.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-300">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>{selectedClientDetails.client.phone || 'No phone recorded'}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-300">
                    <Globe className="h-3.5 w-3.5 text-slate-400" />
                    <span className="truncate">{selectedClientDetails.client.website || 'No website'}</span>
                  </div>
                </div>

                {selectedClientDetails.client.notes && (
                  <div className="mt-3 rounded bg-slate-900/60 p-2.5 text-xs text-slate-300 border border-slate-800/80">
                    <strong className="text-slate-400 block text-[10px] uppercase">Account Notes:</strong>
                    {selectedClientDetails.client.notes}
                  </div>
                )}
              </div>

              {/* Sections: Pipeline Deals & Communication Logs */}
              <div className="p-5 space-y-6">
                {/* Associated Pipeline Deals */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3 flex items-center">
                    <Briefcase className="mr-1.5 h-3.5 w-3.5 text-indigo-400" />
                    Associated Pipeline Deals ({selectedClientDetails.pipelines.length})
                  </h4>

                  <div className="space-y-2">
                    {selectedClientDetails.pipelines.length === 0 ? (
                      <div className="text-xs text-slate-400 italic">No pipeline opportunities logged for this client.</div>
                    ) : (
                      selectedClientDetails.pipelines.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-800/40 p-3 text-xs"
                        >
                          <div>
                            <div className="font-semibold text-slate-200">{p.title}</div>
                            <div className="text-[11px] text-slate-400">
                              Sales Rep: {p.sales_person_name} • Stage: <span className="uppercase font-semibold text-indigo-300">{p.status}</span>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-white">
                            ${(p.deal_amount || 0).toLocaleString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Communication History Timeline */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3 flex items-center">
                    <MessageSquare className="mr-1.5 h-3.5 w-3.5 text-sky-400" />
                    Communication & Touchpoint History
                  </h4>

                  <div className="space-y-3">
                    {selectedClientDetails.communications.length === 0 ? (
                      <div className="rounded-lg border border-slate-800/80 bg-slate-800/20 p-4 text-center text-xs text-slate-400">
                        No communication logged yet. Use "Log Communication" to record emails, calls, and meetings.
                      </div>
                    ) : (
                      selectedClientDetails.communications.map((comm) => (
                        <div
                          key={comm.id}
                          className="rounded-lg border border-slate-800 bg-slate-800/50 p-3 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="rounded bg-sky-950/60 border border-sky-700/60 px-1.5 py-0.2 text-[9px] font-bold uppercase text-sky-300">
                                {comm.channel}
                              </span>
                              <span className="font-semibold text-slate-200">{comm.subject}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {comm.communicated_at ? new Date(comm.communicated_at).toLocaleDateString() : ''}
                            </span>
                          </div>
                          <p className="text-slate-300 text-[11px] leading-relaxed pt-1">
                            {comm.summary}
                          </p>
                          <div className="text-[10px] text-slate-400 pt-1">
                            Logged by: {comm.logger_name || 'Team member'}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-96 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/40 text-xs text-slate-400">
              Select a client to view full details
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add New Client */}
      {showAddClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-white">Add New Client Account</h3>
            <p className="text-xs text-slate-400 mt-1">
              Create a client contact profile for tracking in pipeline deals.
            </p>

            <form onSubmit={handleCreateClient} className="mt-4 space-y-3">
              <div>
                <label className="text-[11px] text-slate-300 block mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  placeholder="e.g. Apex Quantum Systems"
                  className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-300 block mb-1">Primary Contact Full Name *</label>
                <input
                  type="text"
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="e.g. Victoria Reed"
                  className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">Contact Email *</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="v.reed@apexquantum.com"
                    className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+1 (555) 019-2831"
                    className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-300 block mb-1">Industry Sector</label>
                <select
                  value={newIndustry}
                  onChange={(e) => setNewIndustry(e.target.value)}
                  className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="Technology">Technology & SaaS</option>
                  <option value="Financial Services">Financial Services & Fintech</option>
                  <option value="Biotech & HealthCare">Biotech & Healthcare</option>
                  <option value="Supply Chain & Logistics">Supply Chain & Logistics</option>
                  <option value="Cybersecurity">Cybersecurity</option>
                  <option value="E-Commerce & Retail">E-Commerce & Retail</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-300 block mb-1">Account Notes / Context</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Key requirements, executive sponsors, budget cycle..."
                  className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddClientModal(false)}
                  className="rounded border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
                >
                  Create Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Log Communication */}
      {showLogCommModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-white">Log Client Touchpoint</h3>
            <p className="text-xs text-slate-400 mt-1">
              Record a call, meeting, email, or proposal discussion with {selectedClientDetails?.client.company_name}.
            </p>

            <form onSubmit={handleLogCommunication} className="mt-4 space-y-3">
              <div>
                <label className="text-[11px] text-slate-300 block mb-1">Channel / Medium *</label>
                <select
                  value={commChannel}
                  onChange={(e) => setCommChannel(e.target.value)}
                  className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="email">Email</option>
                  <option value="call">Phone Call</option>
                  <option value="meeting">Video / In-Person Meeting</option>
                  <option value="icpi_sent">ICPI Dispatch</option>
                  <option value="proposal">Contract Review</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-300 block mb-1">Subject / Agenda *</label>
                <input
                  type="text"
                  required
                  value={commSubject}
                  onChange={(e) => setCommSubject(e.target.value)}
                  placeholder="e.g. Architecture review & SLA covenants"
                  className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-300 block mb-1">Summary & Action Items *</label>
                <textarea
                  rows={3}
                  required
                  value={commSummary}
                  onChange={(e) => setCommSummary(e.target.value)}
                  placeholder="Key decisions, questions asked by CTO, next follow-up milestone..."
                  className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowLogCommModal(false)}
                  className="rounded border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
                >
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
