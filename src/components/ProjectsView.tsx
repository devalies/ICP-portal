import React, { useState } from 'react';
import {
  Briefcase,
  Calendar,
  CheckCircle,
  Clock,
  User,
  DollarSign,
  FileText,
  Plus,
  Layers,
  ArrowRight,
  ChevronRight,
  ShieldAlert,
  Download,
  Trash2,
  Edit,
  Code,
  FileCheck,
  Check,
} from 'lucide-react';
import { ClosedDeal, Milestone, ProjectDocument, User as UserType } from '../types';
import { getMilestoneUrgency } from '../logic/pipeline';

interface ProjectsViewProps {
  projects: ClosedDeal[];
  currentUser: UserType | null;
  selectedProject: ClosedDeal | null;
  milestones: Milestone[];
  documents: ProjectDocument[];
  onSelectProject: (id: number) => void;
  onOpenNewMilestone: () => void;
  onOpenUploadDoc: () => void;
  onUpdateMilestoneStatus: (id: number, status: 'pending' | 'in_progress' | 'review' | 'completed') => void;
  onUpdateProjectStatus: (id: number, status: ClosedDeal['status']) => void;
  onDeleteDocument: (docId: number) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  currentUser,
  selectedProject,
  milestones,
  documents,
  onSelectProject,
  onOpenNewMilestone,
  onOpenUploadDoc,
  onUpdateMilestoneStatus,
  onUpdateProjectStatus,
  onDeleteDocument,
}) => {
  const [docCategoryFilter, setDocCategoryFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'milestones' | 'documents' | 'scope'>('overview');

  const role = currentUser?.role || 'admin';
  const isDev = role === 'developer' || role === 'senior_dev';

  const getStatusBadge = (status: ClosedDeal['status']) => {
    switch (status) {
      case 'kickoff':
        return 'bg-blue-950/60 text-blue-300 border-blue-700/60';
      case 'in_development':
        return 'bg-amber-950/60 text-amber-300 border-amber-700/60';
      case 'qa_testing':
        return 'bg-purple-950/60 text-purple-300 border-purple-700/60';
      case 'completed':
        return 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'completed':
        return 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60';
      case 'overdue':
        return 'bg-rose-950/60 text-rose-300 border-rose-700/60 animate-pulse';
      case 'due_soon':
        return 'bg-amber-950/60 text-amber-300 border-amber-700/60';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const filteredDocs = documents.filter((d) => {
    if (docCategoryFilter !== 'all' && d.category !== docCategoryFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Closed Deals & Project Workspace
            </h1>
            {isDev && (
              <span className="rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                DEVELOPER VIEW
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Operational project management: contracts, technical scopes, sprint milestones, and deliverables.
          </p>
        </div>

        {isDev && (
          <div className="rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300 flex items-center space-x-2">
            <Code className="h-4 w-4 text-cyan-400" />
            <span>Assigned Developer: <strong className="text-white">{currentUser?.fullName}</strong></span>
          </div>
        )}
      </div>

      {/* Main Grid: Projects List on Left, Active Project Workspace on Right */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Project Cards */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
            <span>Active Projects ({projects.length})</span>
            <span>Total Value</span>
          </div>

          <div className="space-y-2.5">
            {projects.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-center text-xs text-slate-400">
                No closed project workspaces yet. Convert a won pipeline deal to initialize one.
              </div>
            ) : (
              projects.map((proj) => {
                const isSelected = selectedProject?.id === proj.id;
                const completedM = proj.completed_milestones || 0;
                const totalM = proj.total_milestones || 0;
                const progressPct = totalM > 0 ? Math.round((completedM / totalM) * 100) : 0;

                return (
                  <div
                    key={proj.id}
                    onClick={() => onSelectProject(proj.id)}
                    className={`cursor-pointer rounded-xl border p-4 transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-950/30 shadow-lg shadow-indigo-500/10'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${getStatusBadge(proj.status)}`}>
                        {proj.status.replace('_', ' ')}
                      </span>
                      <span className="font-mono text-sm font-bold text-white">
                        ${proj.final_amount.toLocaleString()}
                      </span>
                    </div>

                    <h2 className="mt-2 text-sm font-semibold text-slate-100 line-clamp-1">
                      {proj.project_name}
                    </h2>

                    <div className="mt-1 text-xs text-slate-400">
                      Client: <span className="text-slate-300 font-medium">{proj.company_name}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Milestones: {completedM}/{totalM}</span>
                        <span className="font-semibold text-indigo-300">{progressPct}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-indigo-500 transition-all"
                          style={{ width: `${progressPct}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Team assignments */}
                    <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2 text-[11px] text-slate-400">
                      <div className="flex items-center space-x-1.5">
                        <img
                          src={proj.developer_avatar || 'https://api.dicebear.com/7.x/initials/svg?seed=Dev'}
                          alt={proj.developer_name || 'Dev'}
                          className="h-4 w-4 rounded-full border border-slate-700 object-cover"
                        />
                        <span className="truncate max-w-[100px]">{proj.developer_name}</span>
                      </div>
                      <span>Target: {proj.target_delivery_date || 'TBD'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Operational Workspace for Selected Project */}
        <div className="lg:col-span-8">
          {selectedProject ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 shadow-xl overflow-hidden">
              {/* Workspace Header */}
              <div className="border-b border-slate-800 bg-slate-800/40 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${getStatusBadge(selectedProject.status)}`}>
                        {selectedProject.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        Deal #{selectedProject.id}
                      </span>
                    </div>
                    <h2 className="mt-1 text-lg font-bold text-white">
                      {selectedProject.project_name}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Client: <strong className="text-slate-200">{selectedProject.company_name}</strong> ({selectedProject.client_name}) • Won on {selectedProject.closure_date}
                    </p>
                  </div>

                  {/* Status Dropdown */}
                  <div className="flex items-center space-x-2">
                    <label htmlFor="project-status-select" className="text-xs text-slate-400">Project Status:</label>
                    <select
                      id="project-status-select"
                      aria-label="Project Status"
                      value={selectedProject.status}
                      onChange={(e) => onUpdateProjectStatus(selectedProject.id, e.target.value as any)}
                      className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="kickoff">Kickoff</option>
                      <option value="in_development">In Development</option>
                      <option value="qa_testing">QA & Testing</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                {/* Key Project Specs Bar */}
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-slate-800/80 pt-3 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Contract Amount</span>
                    <span className="font-mono text-sm font-bold text-emerald-400">
                      ${selectedProject.final_amount.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Project Manager</span>
                    <span className="text-slate-200 font-medium">
                      {selectedProject.manager_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Sales Executive</span>
                    <span className="text-slate-200 font-medium">
                      {selectedProject.sales_person_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Lead Developer</span>
                    <span className="text-cyan-300 font-medium flex items-center">
                      <Code className="h-3 w-3 mr-1 inline" />
                      {selectedProject.developer_name}
                    </span>
                  </div>
                </div>

                {/* Workspace Navigation Tabs */}
                <div className="mt-4 flex space-x-2 border-b border-slate-800 -mb-5 pb-0">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`border-b-2 px-3 py-2 text-xs font-medium transition-colors ${
                      activeTab === 'overview'
                        ? 'border-indigo-500 text-indigo-400 font-semibold'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Technical Scope & Specs
                  </button>
                  <button
                    onClick={() => setActiveTab('milestones')}
                    className={`border-b-2 px-3 py-2 text-xs font-medium transition-colors flex items-center space-x-1 ${
                      activeTab === 'milestones'
                        ? 'border-indigo-500 text-indigo-400 font-semibold'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>Delivery Milestones</span>
                    <span className="rounded-full bg-slate-800 px-1.5 text-[10px]">
                      {milestones.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('documents')}
                    className={`border-b-2 px-3 py-2 text-xs font-medium transition-colors flex items-center space-x-1 ${
                      activeTab === 'documents'
                        ? 'border-indigo-500 text-indigo-400 font-semibold'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>Files & SOPs</span>
                    <span className="rounded-full bg-slate-800 px-1.5 text-[10px]">
                      {documents.length}
                    </span>
                  </button>
                </div>
              </div>

              {/* Workspace Body */}
              <div className="p-5">
                {/* Tab 1: Scope & Deliverables */}
                {activeTab === 'overview' && (
                  <div className="space-y-5">
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center">
                        <Code className="mr-1.5 h-4 w-4 text-indigo-400" />
                        Technical Scope of Work
                      </h4>
                      <div className="mt-2 rounded-lg border border-slate-800 bg-slate-950/60 p-4 font-sans text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                        {selectedProject.technical_scope || 'Technical scope details documented in statement of work.'}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center">
                        <FileCheck className="mr-1.5 h-4 w-4 text-emerald-400" />
                        Key Contract Deliverables
                      </h4>
                      <div className="mt-2 rounded-lg border border-slate-800 bg-slate-950/60 p-4 font-sans text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                        {selectedProject.deliverables || 'Deliverables scheduled per project milestone plan.'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: Project Milestones */}
                {activeTab === 'milestones' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-semibold text-white">Sprint & Delivery Milestones</h4>
                        <p className="text-[11px] text-slate-400">Track execution phases, deadlines, and completion signoffs.</p>
                      </div>
                      <button
                        onClick={onOpenNewMilestone}
                        className="flex items-center space-x-1 rounded bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add Milestone</span>
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {milestones.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400">
                          No milestones recorded yet. Click "Add Milestone" to establish the timeline.
                        </div>
                      ) : (
                        milestones.map((m) => {
                          const urgency = getMilestoneUrgency(m);
                          return (
                            <div
                              key={m.id}
                              className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border border-slate-800 bg-slate-800/40 p-3 hover:border-slate-700 transition-colors gap-3"
                            >
                              <div className="flex items-start space-x-3">
                                <button
                                  onClick={() =>
                                    onUpdateMilestoneStatus(
                                      m.id,
                                      m.status === 'completed' ? 'in_progress' : 'completed'
                                    )
                                  }
                                  className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-colors ${
                                    m.status === 'completed'
                                      ? 'border-emerald-500 bg-emerald-500 text-white'
                                      : 'border-slate-600 bg-slate-900 text-transparent hover:border-slate-400'
                                  }`}
                                  title="Toggle Milestone Completion"
                                >
                                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                                </button>
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className={`text-xs font-semibold ${m.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                                      {m.milestone_name}
                                    </span>
                                    <span className={`rounded border px-1.5 py-0.2 text-[9px] font-bold uppercase ${getUrgencyBadge(urgency)}`}>
                                      {urgency.replace('_', ' ')}
                                    </span>
                                  </div>
                                  <p className="mt-0.5 text-[11px] text-slate-400">
                                    {m.description}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center space-x-3 text-xs self-end sm:self-center">
                                <div className="text-right">
                                  <span className="text-[10px] text-slate-400 block">Due Date</span>
                                  <span className="font-mono text-slate-300 font-medium">{m.due_date}</span>
                                </div>

                                <select
                                  value={m.status}
                                  onChange={(e) => onUpdateMilestoneStatus(m.id, e.target.value as any)}
                                  aria-label="Update milestone status"
                                  className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="in_progress">In Progress</option>
                                  <option value="review">Review</option>
                                  <option value="completed">Completed</option>
                                </select>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* Tab 3: Documents, Contracts & SOPs */}
                {activeTab === 'documents' && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-semibold text-white">Project Artifacts & SOPs</h4>
                        <p className="text-[11px] text-slate-400">
                          Upload contracts, design assets, and author dynamic SOP runbooks.
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <select
                          value={docCategoryFilter}
                          onChange={(e) => setDocCategoryFilter(e.target.value)}
                          aria-label="Filter documents by category"
                          className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200"
                        >
                          <option value="all">All Categories</option>
                          <option value="contract">Contracts</option>
                          <option value="sop">Dynamic SOPs</option>
                          <option value="technical_spec">Tech Specs</option>
                          <option value="design_asset">Design Assets</option>
                        </select>

                        <button
                          onClick={onOpenUploadDoc}
                          className="flex items-center space-x-1 rounded bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Add Document / SOP</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {filteredDocs.length === 0 ? (
                        <div className="col-span-2 py-8 text-center text-xs text-slate-400">
                          No documents found for this category. Click "Add Document / SOP" to attach files.
                        </div>
                      ) : (
                        filteredDocs.map((doc) => (
                          <div
                            key={doc.id}
                            className="rounded-lg border border-slate-800 bg-slate-800/40 p-3 hover:border-slate-700 transition-colors flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-start justify-between">
                                <span className="rounded border border-indigo-700/50 bg-indigo-950/40 px-1.5 py-0.5 text-[9px] font-bold uppercase text-indigo-300">
                                  {doc.category.replace('_', ' ')}
                                </span>
                                <button
                                  onClick={() => onDeleteDocument(doc.id)}
                                  className="text-slate-400 hover:text-rose-400"
                                  title="Remove Document"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>

                              <div className="mt-2 font-medium text-xs text-slate-200 truncate" title={doc.file_name}>
                                {doc.file_name}
                              </div>

                              {doc.content_preview && (
                                <p className="mt-1 text-[11px] text-slate-400 line-clamp-2 italic font-mono bg-slate-900/40 p-1.5 rounded">
                                  {doc.content_preview}
                                </p>
                              )}
                            </div>

                            <div className="mt-3 flex items-center justify-between border-t border-slate-700/60 pt-2 text-[10px] text-slate-400">
                              <span>Uploaded by: {doc.uploader_name || 'Team'}</span>
                              <span>{(doc.file_size / 1024).toFixed(0)} KB</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-96 flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-center text-slate-400">
              <Briefcase className="h-10 w-10 text-slate-400 mb-2" />
              <p className="text-sm font-semibold text-slate-300">Select a Closed Deal Workspace</p>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Choose a project from the left panel to inspect its technical scope, milestones, deliverables, and SOP documentation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
