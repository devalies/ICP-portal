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
import { UnauthorizedAccess } from './components/UnauthorizedAccess';

// Granular Tab Permission Matrix per System Security Hierarchy
const TAB_PERMISSIONS: Record<string, string[]> = {
  dashboard: ['admin', 'manager'],
  pipeline: ['admin', 'manager', 'sales'],
  projects: ['admin', 'manager', 'senior_dev', 'developer'],
  clients: ['admin', 'manager', 'sales'],
  team: ['admin', 'manager'],
  audit: ['admin', 'manager'],
};

// Default Landing Tab based on Role
const getDefaultTabForRole = (role: string): string => {
  if (role === 'developer' || role === 'senior_dev') return 'projects';
  if (role === 'sales') return 'pipeline';
  return 'dashboard';
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [initialAuthChecked, setInitialAuthChecked] = useState<boolean>(false);

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

  // Initial authentication check & URL route synchronization
  useEffect(() => {
    initApp();
  }, []);

  // Synchronize hash changes (e.g. user pastes or navigates to #/pipeline, #/team, etc.)
  useEffect(() => {
    const handleHashChange = () => {
      const rawHash = window.location.hash.replace(/^#\/?/, '').trim();
      if (!apiClient.getToken()) {
        if (rawHash && rawHash !== 'login') {
          window.location.hash = '#/login';
        }
        return;
      }
      if (rawHash && TAB_PERMISSIONS[rawHash]) {
        setCurrentTab(rawHash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const initApp = async () => {
    try {
      const token = apiClient.getToken();
      if (token) {
        const meRes = await apiClient.getMe().catch(() => null);
        if (meRes?.user) {
          setCurrentUser(meRes.user);

          // Parse hash route or set role default
          const rawHash = window.location.hash.replace(/^#\/?/, '').trim();
          if (rawHash && TAB_PERMISSIONS[rawHash]) {
            setCurrentTab(rawHash);
          } else {
            const defaultTab = getDefaultTabForRole(meRes.user.role);
            setCurrentTab(defaultTab);
            window.location.hash = `#/${defaultTab}`;
          }

          loadPortalData(meRes.user);
          setInitialAuthChecked(true);
          return;
        } else {
          apiClient.clearToken();
        }
      }

      // No authenticated session: enforce login view at root /
      setCurrentUser(null);
      if (window.location.hash !== '' && window.location.hash !== '#/login') {
        window.location.hash = '#/login';
      }
    } catch (err) {
      console.error('Authentication verification error:', err);
      apiClient.clearToken();
      setCurrentUser(null);
    } finally {
      setInitialAuthChecked(true);
    }
  };

  const loadPortalData = async (activeUser?: User | null) => {
    const user = activeUser || currentUser;
    if (!user) return;
    const role = user.role;

    try {
      // 1. Projects workspace: available to all roles (devs get assigned, admins/managers see all)
      const pData = await apiClient.getProjects().catch(() => ({ projects: [] }));
      const projectList = pData.projects || [];
      setProjects(projectList);
      if (projectList.length && (!selectedProjectId || !projectList.some((p: any) => p.id === selectedProjectId))) {
        setSelectedProjectId(projectList[0].id);
        loadProjectDetails(projectList[0].id);
      }

      // 2. Team Directory: only for Admin & Manager
      if (role === 'admin' || role === 'manager') {
        const uData = await apiClient.getUsers().catch(() => ({ users: [] }));
        setUsersList(uData.users || []);
      }

      // 3. Clients Directory: Admin, Manager, Sales
      if (role === 'admin' || role === 'manager' || role === 'sales') {
        const cData = await apiClient.getClients().catch(() => ({ clients: [] }));
        const clientList = cData.clients || [];
        setClients(clientList);
        if (clientList.length && !selectedClientId) {
          setSelectedClientId(clientList[0].id);
        }
      }

      // 4. ICP Pipeline & Centralized Analytics: Admin, Manager, Sales
      if (role === 'admin' || role === 'manager' || role === 'sales') {
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
    window.location.hash = '#/login';
  };

  // Sign in handler
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    const defaultTab = getDefaultTabForRole(user.role);
    setCurrentTab(defaultTab);
    window.location.hash = `#/${defaultTab}`;
    loadPortalData(user);
  };

  // Navigation tab handler
  const handleNavigateTab = (tab: string) => {
    setCurrentTab(tab);
    window.location.hash = `#/${tab}`;
  };

  // Switch persona handler (Protected: Admin only)
  const handleSwitchUser = async (userId: number) => {
    try {
      const data = await apiClient.switchRole(userId);
      setCurrentUser(data.user);

      // Redirect to default tab for switched role
      const nextTab = getDefaultTabForRole(data.user.role);
      handleNavigateTab(nextTab);
      loadPortalData(data.user);
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

  const handleConvertToDeal = async (pipelineId: number, data: any) => {
    const res = await apiClient.convertToDeal(pipelineId, data);
    loadPortalData();
    if (res.dealId) {
      setSelectedProjectId(res.dealId);
      loadProjectDetails(res.dealId);
      handleNavigateTab('projects');
    }
  };

  const handleSelectProject = (id: number) => {
    setSelectedProjectId(id);
    loadProjectDetails(id);
  };

  const handleUpdateProjectStatus = async (id: number, status: any) => {
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
    handleNavigateTab('clients');
  };

  const handleOpenPipelineDetail = (id: number) => {
    setSelectedPipelineId(id);
    setShowPipelineDetailModal(true);
  };

  // If initial auth check not finished, show loader
  if (!initialAuthChecked) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <span className="text-xs font-mono">Verifying enterprise session...</span>
        </div>
      </div>
    );
  }

  // 1. Authentication Guard: Root home page serves as secure login page. Unauthenticated users are strictly blocked.
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // 2. Route Security Guards: check if current user role is authorized for currentTab
  const userRole = currentUser.role;
  const allowedRolesForTab = TAB_PERMISSIONS[currentTab] || [];
  const isTabAuthorized = allowedRolesForTab.includes(userRole);

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
        onNavigateTab={handleNavigateTab}
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
          {TAB_PERMISSIONS.dashboard.includes(userRole) && (
            <button
              onClick={() => { handleNavigateTab('dashboard'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-colors ${currentTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Pipeline Analytics
            </button>
          )}

          {TAB_PERMISSIONS.pipeline.includes(userRole) && (
            <button
              onClick={() => { handleNavigateTab('pipeline'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-colors ${currentTab === 'pipeline' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              ICP Pipeline
            </button>
          )}

          {TAB_PERMISSIONS.projects.includes(userRole) && (
            <button
              onClick={() => { handleNavigateTab('projects'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-colors ${currentTab === 'projects' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Closed Deals & Projects
            </button>
          )}

          {TAB_PERMISSIONS.clients.includes(userRole) && (
            <button
              onClick={() => { handleNavigateTab('clients'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-colors ${currentTab === 'clients' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Client Records
            </button>
          )}

          {TAB_PERMISSIONS.team.includes(userRole) && (
            <button
              onClick={() => { handleNavigateTab('team'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-colors ${currentTab === 'team' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Team & RBAC Users
            </button>
          )}

          {TAB_PERMISSIONS.audit.includes(userRole) && (
            <button
              onClick={() => { handleNavigateTab('audit'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-colors ${currentTab === 'audit' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Audit Trail & Logs
            </button>
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
          onSelectTab={handleNavigateTab}
          currentUser={currentUser}
        />

        {/* Content Pane with Protected Route Guard */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col">
          {!isTabAuthorized ? (
            <UnauthorizedAccess
              currentUser={currentUser}
              attemptedTab={currentTab}
              allowedRoles={allowedRolesForTab}
              onNavigateHome={() => handleNavigateTab(getDefaultTabForRole(userRole))}
              onSignOut={handleSignOut}
            />
          ) : (
            <>
              {currentTab === 'dashboard' && (
                <DashboardView
                  metrics={metrics}
                  industryStats={industryStats}
                  salesRepStats={salesRepStats}
                  onOpenNewLead={() => setShowNewLeadModal(true)}
                  onNavigateTab={handleNavigateTab}
                />
              )}

              {currentTab === 'pipeline' && (
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

              {currentTab === 'clients' && (
                <ClientsView
                  clients={clients}
                  selectedClientId={selectedClientId}
                  onSelectClient={(id) => setSelectedClientId(id)}
                  onRefreshClients={() => loadPortalData()}
                  searchQuery={searchQuery}
                />
              )}

              {currentTab === 'team' && (
                <TeamManagementView
                  users={usersList}
                  currentUser={currentUser}
                  onRefreshUsers={() => loadPortalData()}
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
            </>
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
        onRefreshPipeline={() => loadPortalData()}
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
        currentUser={currentUser}
        onSubmit={handleAddUser}
      />

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        currentUser={currentUser}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
