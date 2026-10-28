import React from 'react';
import {
  LayoutDashboard,
  Kanban,
  Briefcase,
  Users,
  ShieldCheck,
  History,
  Lock,
  ChevronRight,
  FolderGit2,
} from 'lucide-react';
import { User, RoleName } from '../types';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  currentUser: User | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, currentUser }) => {
  const role: RoleName = currentUser?.role || 'admin';

  // Navigation definition with permissions
  const navItems = [
    {
      id: 'dashboard',
      label: 'Pipeline Analytics',
      icon: LayoutDashboard,
      roles: ['admin', 'manager'],
      badge: 'Executive',
    },
    {
      id: 'pipeline',
      label: 'ICP Pipeline',
      icon: Kanban,
      roles: ['admin', 'manager', 'sales'],
      badge: null,
    },
    {
      id: 'projects',
      label: 'Closed Deals & Projects',
      icon: Briefcase,
      roles: ['admin', 'manager', 'senior_dev', 'developer'],
      badge: role === 'developer' || role === 'senior_dev' ? 'Assigned' : null,
    },
    {
      id: 'clients',
      label: 'Client Records',
      icon: Users,
      roles: ['admin', 'manager', 'sales'],
      badge: null,
    },
    {
      id: 'team',
      label: 'Team & RBAC Users',
      icon: ShieldCheck,
      roles: ['admin', 'manager'],
      badge: 'Admin',
    },
    {
      id: 'audit',
      label: 'Audit Trail & Logs',
      icon: History,
      roles: ['admin', 'manager'],
      badge: 'Security',
    },
  ];

  const isDevRole = role === 'developer' || role === 'senior_dev';

  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between hidden md:flex">
      <div className="space-y-6">
        {/* Role Scoping Notice */}
        <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-3">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>ACTIVE ROLE</span>
            <span className="font-mono text-indigo-400 font-bold uppercase">{role}</span>
          </div>
          <div className="mt-1 text-xs font-semibold text-slate-200">
            {currentUser?.fullName}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 leading-relaxed">
            {isDevRole ? (
              <span className="flex items-start text-amber-300/90">
                <Lock className="mr-1 h-3 w-3 mt-0.5 flex-shrink-0" />
                Dev-Restricted Workspace: Access to assigned deliverables and technical scopes.
              </span>
            ) : role === 'sales' ? (
              <span>Full Pipeline access: Leads, ICPIs, conversions & clients.</span>
            ) : (
              <span>Full Executive privileges: Dashboards, Users, RBAC & Financials.</span>
            )}
          </div>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1">
          <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Navigation Modules
          </div>

          {navItems.map((item) => {
            const hasAccess = item.roles.includes(role);
            const isActive = currentTab === item.id;
            const Icon = item.icon;

            if (!hasAccess) {
              return (
                <div
                  key={item.id}
                  className="group flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-slate-400 opacity-60 cursor-not-allowed"
                  title={`Restricted for ${currentUser?.roleDisplayName}`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                  <Lock className="h-3 w-3 text-slate-400" />
                </div>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                      isActive
                        ? 'bg-indigo-700 text-white'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-2">
        <div className="flex items-center justify-between">
          <span className="flex items-center">
            <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block mr-1.5 animate-pulse"></span>
            Relational DB Active
          </span>
          <span className="font-mono text-slate-400">Node 22 WAL</span>
        </div>
        <p className="text-[10px] text-slate-400">
          NexusICP v1.0.4 Enterprise
        </p>
      </div>
    </aside>
  );
};
