import React from 'react';
import { ShieldAlert, Lock, ArrowRight, LogOut, CheckCircle2, AlertTriangle } from 'lucide-react';
import { User } from '../types';

interface UnauthorizedAccessProps {
  currentUser: User;
  attemptedTab: string;
  allowedRoles: string[];
  onNavigateHome: () => void;
  onSignOut: () => void;
}

export const UnauthorizedAccess: React.FC<UnauthorizedAccessProps> = ({
  currentUser,
  attemptedTab,
  allowedRoles,
  onNavigateHome,
  onSignOut,
}) => {
  const getTabLabel = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        return 'Executive & Financial Analytics Dashboard';
      case 'pipeline':
        return 'ICP Pipeline & Lead Execution';
      case 'projects':
        return 'Closed Deals & Project Workspace';
      case 'clients':
        return 'Client Directory & Records';
      case 'team':
        return 'Team Management & RBAC User Directory';
      case 'audit':
        return 'Enterprise Audit Trail & Security Logs';
      default:
        return tab.toUpperCase();
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-slate-950">
      <div className="w-full max-w-2xl rounded-2xl border border-rose-900/60 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start space-x-4">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 shadow-lg shadow-rose-950">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="rounded bg-rose-950 border border-rose-800 px-2.5 py-0.5 text-[11px] font-bold text-rose-400 uppercase tracking-wider">
                HTTP 403 Forbidden
              </span>
              <span className="text-xs text-slate-400 font-mono">ROUTE_SECURITY_GUARD</span>
            </div>

            <h2 className="mt-2 text-xl font-bold text-white">
              Unauthorized Access Denied
            </h2>

            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              Your active authenticated account <strong className="text-white">{currentUser.fullName}</strong> ({currentUser.email}) with role <strong className="text-indigo-400">{currentUser.roleDisplayName}</strong> does not have authorization to access the <span className="font-semibold text-rose-300">{getTabLabel(attemptedTab)}</span> module.
            </p>
          </div>
        </div>

        {/* Security Rule Breakdown */}
        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
            <span className="font-semibold text-slate-300">Required Role Authorization:</span>
            <div className="flex flex-wrap gap-1">
              {allowedRoles.map((r) => (
                <span key={r} className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] font-semibold text-indigo-300 uppercase">
                  {r.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-slate-400 space-y-1.5">
            <div className="font-semibold text-slate-300 mb-1">NexusICP Access Control Matrix:</div>
            <div className="flex items-center space-x-2">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400"></span>
              <span><strong>Administrator:</strong> Unrestricted access to all dashboards, pipelines, users, RBAC, and financials.</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400"></span>
              <span><strong>Manager:</strong> Operational dashboards, deals, and managing Sales/Developer roles (cannot alter Admin accounts).</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
              <span><strong>Sales Person:</strong> Exclusively ICP Pipeline Dashboard, lead management, sending ICPIs, and creating deals.</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
              <span><strong>Senior Developer & Developer:</strong> Restricted exclusively to Closed Deals and Projects workspace.</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={onSignOut}
            className="flex items-center space-x-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign In with Different Role</span>
          </button>

          <button
            onClick={onNavigateHome}
            className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-indigo-400 transition-all"
          >
            <span>Return to Authorized Workspace</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
