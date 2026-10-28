import React, { useState, useEffect } from 'react';
import {
  Layers,
  LayoutDashboard,
  Kanban,
  Briefcase,
  Users,
  ShieldCheck,
  History,
  Lock,
  Menu,
  X,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import {
  User,
  PipelineItem,
  PipelineMetrics,
  ClosedDeal,
  Milestone,
  ProjectDocument,
  Client,
  PipelineStatus,
} from './types';
import { apiClient } from './services/api';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { PipelineView } from './components/PipelineView';
import { ProjectsView } from './components/ProjectsView';
import { ClientsView } from './components/ClientsView';
import { TeamManagementView } from './components/TeamManagementView';
import { AuditTrailView } from './components/AuditTrailView';
import { ApiDocsModal } from './components/ApiDocsModal';
import { NewLeadModal } from './components/NewLeadModal';
import { SendIcpiModal } from './components/SendIcpiModal';
import { ConvertToDealModal } from './components/ConvertToDealModal';
import { MilestoneModal } from './components/MilestoneModal';
import { DocumentModal } from './components/DocumentModal';
import { AddUserModal } from './components/AddUserModal';
import { LoginModal } from './components/LoginModal';
import { MemberEditModal } from './components/MemberEditModal';
import { PipelineDetailModal } from './components/PipelineDetailModal';
import { LoginScreen } from './components/LoginScreen';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Data states
  const [metrics, setMetrics] = useState<PipelineMetrics | null>(null);
  const [industryStats, setIndustryStats] = useState<any[]>([]);
  const [salesRepStats, setSalesRepStats] = useState<any[]>([]);
  const [pipelineItems, setPipelineItems] = useState<PipelineItem[]>([]);
  const [projects, setProjects] = useState<ClosedDeal[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedProject, setSelectedProject] = useState<ClosedDeal | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);

  // Modals state
  const [showApiDocs, setShowApiDocs] = useState<boolean>(false);
  const [showNewLeadModal, setShowNewLeadModal] = useState<boolean>(false);
  const [showSendIcpiModal, setShowSendIcpiModal] = useState<boolean>(false);
  const [activeIcpiItem, setActiveIcpiItem] = useState<PipelineItem | null>(null);
  const [showConvertModal, setShowConvertModal] = useState<boolean>(false);
  const [activeConvertItem, setActiveConvertItem] = useState<PipelineItem | null>(null);
  const [showMilestoneModal, setShowMilestoneModal] = useState<boolean>(false);
  const [showDocModal, setShowDocModal] = useState<boolean>(false);
  const [showAddUserModal, setShowAddUserModal] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);

  // Dynamic Member Edit modal state
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [showMemberEditModal, setShowMemberEditModal] = useState<boolean>(false);

  // Dynamic Pipeline Detail & Contact Log modal state
  const [selectedPipelineId, setSelectedPipelineId] = useState<number | null>(null);
  const [showPipelineDetailModal, setShowPipelineDetailModal] = useState<boolean>(false);

  // Initial load
  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    try {
      const token = apiClient.getToken();
      if (token) {
        const meRes = await apiClient.getMe().catch(() => null);
        if (meRes?.user) {
          setCurrentUser(meRes.user);
          loadPortalData();
          return;
        }
      }
      // Initial seamless entrance with admin credentials
      const switchRes = await apiClient.switchRole(1);
      setCurrentUser(switchRes.user);
      loadPortalData();
    } catch (err) {
      console.error('Initialization error:', err);
    }
  };

  const loadPortalData = async () => {
    try {
      // Fetch users
      const uData = await apiClient.getUsers();
      setUsersList(uData.users || []);

      // Fetch clients
      const cData = await apiClient.getClients();
      setClients(cData.clients || []);
      if (cData.clients?.length && !selectedClientId) {
        setSelectedClientId(cData.clients[0].id);
      }

      // Fetch projects
      const pData = await apiClient.getProjects();
      setProjects(pData.projects || []);
      if (pData.projects?.length) {
        const firstId = pData.projects[0].id;
        setSelectedProjectId(firstId);
        loadProjectDetails(firstId);
      }

      // Fetch pipeline & metrics if user has permissions
      const role = currentUser?.role || 'admin';
      if (role !== 'developer' && role !== 'senior_dev') {
        const mData = await apiClient.getPipelineMetrics().catch(() => null);
        if (mData) {
          setMetrics(mData.metrics);
          setIndustryStats(mData.industryStats || []);
          setSalesRepStats(mData.salesRepStats || []);
        }

        const pipeData = await apiClient.getPipeline().catch(() => null);
        if (pipeData?.items) {
          setPipelineItems(pipeData.items);
        }
      }
    } catch (err) {
      console.error('Failed to load portal data:', err);
    }
  };

  const loadProjectDetails = async (dealId: number) => {
    try {
      const data = await apiClient.getProjectDetails(dealId);
      setSelectedProject(data.project);
      setMilestones(data.milestones || []);
      setDocuments(data.documents || []);
    } catch (err) {
      console.error('Failed to load project details:', err);
    }
  };

  // Sign out handler
  const handleSignOut = () => {
    apiClient.clearToken();
    setCurrentUser(null);
  };

  // Switch persona handler
  const handleSwitchUser = async (userId: number) => {
    try {
      const data = await apiClient.switchRole(userId);
      setCurrentUser(data.user);

      // If developer role, enforce redirect to 'projects' workspace
      if (data.user.role === 'developer' || data.user.role === 'senior_dev') {
        setCurrentTab('projects');
      }

      // Reload project list and scoped data
      const pData = await apiClient.getProjects();
      setProjects(pData.projects || []);
      if (pData.projects?.length) {
        setSelectedProjectId(pData.projects[0].id);
        loadProjectDetails(pData.projects[0].id);
      }

      if (data.user.role !== 'developer' && data.user.role !== 'senior_dev') {
        const mData = await apiClient.getPipelineMetrics().catch(() => null);
        if (mData) {
          setMetrics(mData.metrics);
          setIndustryStats(mData.industryStats || []);
          setSalesRepStats(mData.salesRepStats || []);
        }
        const pipeData = await apiClient.getPipeline().catch(() => null);
        if (pipeData?.items) {
          setPipelineItems(pipeData.items);
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to switch user');
    }
  };

  // Actions
  const handleCreateLead = async (data: any) => {
    await apiClient.createPipelineItem(data);
    loadPortalData();
  };

  const handleSendIcpi = async (id: number, content: string) => {
    await apiClient.sendIcpi(id, content);
    loadPortalData();
  };

  const handleUpdatePipelineStatus = async (id: number, status: PipelineStatus, notes?: string) => {
    await apiClient.updatePipelineStatus(id, status, notes);
    loadPortalData();
  };

  const handleConvertToDeal = async (id: number, data: any) => {
    const res = await apiClient.convertToDeal(id, data);
    loadPortalData();
    setCurrentTab('projects');
    if (res.dealId) {
      setSelectedProjectId(res.dealId);
      loadProjectDetails(res.dealId);
    }
  };

  const handleSelectProject = (id: number) => {
    setSelectedProjectId(id);
    loadProjectDetails(id);
  };

  const handleUpdateProjectStatus = async (id: number, status: ClosedDeal['status']) => {
    await apiClient.updateProject(id, { status });
    loadProjectDetails(id);
    const pData = await apiClient.getProjects();
    setProjects(pData.projects || []);
  };

  const handleAddMilestone = async (dealId: number, data: any) => {
    await apiClient.addMilestone(dealId, data);
    loadProjectDetails(dealId);
  };

  const handleUpdateMilestoneStatus = async (id: number, status: any) => {
    await apiClient.updateMilestone(id, { status });
    if (selectedProjectId) {
      loadProjectDetails(selectedProjectId);
    }
  };

  const handleAddDocument = async (dealId: number, data: any) => {
    await apiClient.addDocument(dealId, data);
    loadProjectDetails(dealId);
  };

  const handleDeleteDocument = async (docId: number) => {
    if (!confirm('Are you sure you want to remove this project document?')) return;
    await apiClient.deleteDocument(docId);
    if (selectedProjectId) {
      loadProjectDetails(selectedProjectId);
    }
  };

  const handleAddUser = async (data: any) => {
    await apiClient.createUser(data);
    const uData = await apiClient.getUsers();
    setUsersList(uData.users || []);
  };

  const handleUpdateMember = async (userId: number, data: any) => {
    const res = await apiClient.updateUser(userId, data);
    const uData = await apiClient.getUsers();
    setUsersList(uData.users || []);
    if (currentUser?.id === userId && res.user) {
      setCurrentUser(res.user);
    }
  };

  const handleSelectClient = (clientId: number) => {
    setSelectedClientId(clientId);
    setCurrentTab('clients');
  };

  const handleOpenPipelineDetail = (id: number) => {
    setSelectedPipelineId(id);
    setShowPipelineDetailModal(true);
  };

  // If signed out, render dedicated LoginScreen
  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          loadPortalData();
        }}
      />
    );
  }

  // Check role restriction
  const userRole = currentUser?.role || 'admin';
  const isDevRole = userRole === 'developer' || userRole === 'senior_dev';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        onOpenApiDocs={() => setShowApiDocs(true)}
        onOpenLogin={() => setShowLoginModal(true)}
        onSignOut={handleSignOut}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onNavigateTab={(tab) => setCurrentTab(tab)}
      />

      {/* Mobile nav bar toggle */}
      <div className="flex md:hidden items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 py-2">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-400">Current View:</span>
          <span className="text-xs font-bold text-indigo-400 capitalize">{currentTab}</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-300 hover:text-white"
        >
          {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-900 p-4 space-y-1.5 shadow-xl">
          {!isDevRole && (
            <>
              <button
                onClick={() => { setCurrentTab('dashboard'); setMobileMenuOpen(false); }}
                className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-colors ${currentTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                Pipeline Analytics
              </button>
              <button
                onClick={() => { setCurrentTab('pipeline'); setMobileMenuOpen(false); }}
                className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-colors ${currentTab === 'pipeline' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                ICP Pipeline
              </button>
            </>
          )}
          <button
            onClick={() => { setCurrentTab('projects'); setMobileMenuOpen(false); }}
            className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-colors ${currentTab === 'projects' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            Closed Deals & Projects
          </button>
          {!isDevRole && (
            <button
              onClick={() => { setCurrentTab('clients'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-colors ${currentTab === 'clients' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Client Records
            </button>
          )}
          {(userRole === 'admin' || userRole === 'manager') && (
            <>
              <button
                onClick={() => { setCurrentTab('team'); setMobileMenuOpen(false); }}
                className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-colors ${currentTab === 'team' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                Team & RBAC Users
              </button>
              <button
                onClick={() => { setCurrentTab('audit'); setMobileMenuOpen(false); }}
                className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-colors ${currentTab === 'audit' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                Audit Trail & Logs
              </button>
            </>
          )}
          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleSignOut();
              }}
              className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-950/30 rounded-lg"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
          currentUser={currentUser}
        />

        {/* Content Pane */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* RBAC restriction alert for developer view */}
          {isDevRole && currentTab !== 'projects' && (
            <div className="mb-6 rounded-xl border border-amber-900/50 bg-amber-950/30 p-4 text-xs text-amber-300 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Lock className="h-4 w-4" />
                <span>Developer Security Restriction: Navigating to your assigned operational project workspace.</span>
              </div>
              <button
                onClick={() => setCurrentTab('projects')}
                className="rounded bg-amber-600 px-2 py-1 text-white font-medium hover:bg-amber-500"
              >
                Go to Projects
              </button>
            </div>
          )}

          {/* Tab Views */}
          {currentTab === 'dashboard' && !isDevRole && (
            <DashboardView
              metrics={metrics}
              industryStats={industryStats}
              salesRepStats={salesRepStats}
              onOpenNewLead={() => setShowNewLeadModal(true)}
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'pipeline' && !isDevRole && (
            <PipelineView
              items={pipelineItems}
              onOpenNewLead={() => setShowNewLeadModal(true)}
              onSendIcpi={(item) => {
                setActiveIcpiItem(item);
                setShowSendIcpiModal(true);
              }}
              onConvertToDeal={(item) => {
                setActiveConvertItem(item);
                setShowConvertModal(true);
              }}
              onUpdateStatus={handleUpdatePipelineStatus}
              onSelectClient={handleSelectClient}
              onSelectPipeline={handleOpenPipelineDetail}
              searchQuery={searchQuery}
            />
          )}

          {currentTab === 'projects' && (
            <ProjectsView
              projects={projects}
              currentUser={currentUser}
              selectedProject={selectedProject}
              milestones={milestones}
              documents={documents}
              onSelectProject={handleSelectProject}
              onOpenNewMilestone={() => setShowMilestoneModal(true)}
              onOpenUploadDoc={() => setShowDocModal(true)}
              onUpdateMilestoneStatus={handleUpdateMilestoneStatus}
              onUpdateProjectStatus={handleUpdateProjectStatus}
              onDeleteDocument={handleDeleteDocument}
            />
          )}

          {currentTab === 'clients' && !isDevRole && (
            <ClientsView
              clients={clients}
              selectedClientId={selectedClientId}
              onSelectClient={(id) => setSelectedClientId(id)}
              onRefreshClients={loadPortalData}
              searchQuery={searchQuery}
            />
          )}

          {currentTab === 'team' && (
            <TeamManagementView
              users={usersList}
              currentUser={currentUser}
              onRefreshUsers={loadPortalData}
              onOpenAddUser={() => setShowAddUserModal(true)}
              onSelectMember={(u) => {
                setSelectedMember(u);
                setShowMemberEditModal(true);
              }}
            />
          )}

          {currentTab === 'audit' && (
            <AuditTrailView />
          )}
        </main>
      </div>

      {/* Modals & Dialogs */}
      <ApiDocsModal
        isOpen={showApiDocs}
        onClose={() => setShowApiDocs(false)}
      />

      <NewLeadModal
        isOpen={showNewLeadModal}
        onClose={() => setShowNewLeadModal(false)}
        clients={clients}
        onSubmit={handleCreateLead}
      />

      <SendIcpiModal
        isOpen={showSendIcpiModal}
        onClose={() => {
          setShowSendIcpiModal(false);
          setActiveIcpiItem(null);
        }}
        item={activeIcpiItem}
        onSend={handleSendIcpi}
      />

      <ConvertToDealModal
        isOpen={showConvertModal}
        onClose={() => {
          setShowConvertModal(false);
          setActiveConvertItem(null);
        }}
        item={activeConvertItem}
        users={usersList}
        onConvert={handleConvertToDeal}
      />

      {/* Dynamic Member Details & Role/Status Assignment Modal */}
      <MemberEditModal
        isOpen={showMemberEditModal}
        onClose={() => {
          setShowMemberEditModal(false);
          setSelectedMember(null);
        }}
        member={selectedMember}
        currentUser={currentUser}
        onSave={handleUpdateMember}
      />

      {/* Dynamic Pipeline Details & Contact Touchpoints Log Modal */}
      <PipelineDetailModal
        isOpen={showPipelineDetailModal}
        onClose={() => {
          setShowPipelineDetailModal(false);
          setSelectedPipelineId(null);
        }}
        pipelineId={selectedPipelineId}
        onRefreshPipeline={loadPortalData}
        onConvertToDeal={(item) => {
          setActiveConvertItem(item);
          setShowConvertModal(true);
        }}
      />

      {selectedProjectId && (
        <>
          <MilestoneModal
            isOpen={showMilestoneModal}
            onClose={() => setShowMilestoneModal(false)}
            dealId={selectedProjectId}
            onSubmit={handleAddMilestone}
          />

          <DocumentModal
            isOpen={showDocModal}
            onClose={() => setShowDocModal(false)}
            dealId={selectedProjectId}
            onSubmit={handleAddDocument}
          />
        </>
      )}

      <AddUserModal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onSubmit={handleAddUser}
      />

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        currentUser={currentUser}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          loadPortalData();
        }}
      />
    </div>
  );
}
