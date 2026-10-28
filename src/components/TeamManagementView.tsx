import React, { useState } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Lock,
  Mail,
  User,
  CheckCircle,
  XCircle,
  Key,
  ShieldAlert,
  Shield,
} from 'lucide-react';
import { User as UserType } from '../types';
import { apiClient } from '../services/api';

interface TeamManagementViewProps {
  users: UserType[];
  currentUser: UserType | null;
  onRefreshUsers: () => void;
  onOpenAddUser: () => void;
  onSelectMember: (user: UserType) => void;
}

export const TeamManagementView: React.FC<TeamManagementViewProps> = ({
  users,
  currentUser,
  onRefreshUsers,
  onOpenAddUser,
  onSelectMember,
}) => {
  const [toggleLoading, setToggleLoading] = useState<number | null>(null);

  const role = currentUser?.role || 'admin';
  const hasAccess = role === 'admin' || role === 'manager';
  const isManager = role === 'manager';

  const handleToggleStatus = async (user: UserType) => {
    if (user.id === currentUser?.id) {
      alert('You cannot deactivate your own active logged-in account.');
      return;
    }

    if (isManager && (user.role === 'admin' || user.roleId === 1)) {
      alert('Access Denied: Managers cannot deactivate or modify Administrator accounts.');
      return;
    }

    setToggleLoading(user.id);
    try {
      await apiClient.toggleUserStatus(user.id, !user.isActive);
      onRefreshUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update user status');
    } finally {
      setToggleLoading(null);
    }
  };

  const getRoleBadge = (r: string) => {
    switch (r) {
      case 'admin':
        return 'bg-purple-900/40 text-purple-300 border-purple-700/50';
      case 'manager':
        return 'bg-blue-900/40 text-blue-300 border-blue-700/50';
      case 'sales':
        return 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50';
      case 'senior_dev':
        return 'bg-amber-900/40 text-amber-300 border-amber-700/50';
      case 'developer':
        return 'bg-cyan-900/40 text-cyan-300 border-cyan-700/50';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  if (!hasAccess) {
    return (
      <div className="flex h-96 flex-col items-center justify-center rounded-xl border border-rose-900/40 bg-rose-950/20 p-8 text-center">
        <ShieldAlert className="h-12 w-12 text-rose-500 mb-3" />
        <h3 className="text-base font-bold text-white">Access Denied: Administrator & Manager Only</h3>
        <p className="text-xs text-slate-400 max-w-md mt-1">
          Your current persona ({currentUser?.roleDisplayName}) does not have permissions to manage team accounts and assign security roles.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Team Member Management & RBAC
            </h1>
            <span className="rounded border border-purple-500/40 bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-300">
              ADMIN CONTROL PANEL
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Provision team access, assign role-based security scopes, and toggle active status.
          </p>
        </div>

        <button
          onClick={onOpenAddUser}
          className="flex items-center space-x-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-medium text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 transition-colors"
        >
          <UserPlus className="h-3.5 w-3.5" />
          <span>Provision New Member</span>
        </button>
      </div>

      {/* Role Permissions Matrix Overview Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center mb-3">
          <Shield className="h-3.5 w-3.5 text-indigo-400 mr-1.5" />
          Configured Role Permissions Matrix
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 text-xs">
          <div className="rounded-lg border border-slate-800 bg-slate-800/40 p-3">
            <span className="font-semibold text-purple-300">Administrator & Manager</span>
            <p className="text-[11px] text-slate-400 mt-1">
              Unrestricted access to all dashboards, ICP pipelines, financial analytics, project workspaces, and team RBAC provisioning.
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-800/40 p-3">
            <span className="font-semibold text-emerald-300">Sales Person</span>
            <p className="text-[11px] text-slate-400 mt-1">
              Access to ICP Pipeline Dashboard, lead management, sending ICPIs, creating deals, client communications.
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-800/40 p-3">
            <span className="font-semibold text-amber-300">Senior Dev & Developer</span>
            <p className="text-[11px] text-slate-400 mt-1">
              Scoped exclusively to Closed Deals & Project Workspaces to view assigned projects, milestones, technical scopes, and deliverables.
            </p>
          </div>
        </div>
      </div>

      {/* Team Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-800/60 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Team Member</th>
                <th className="px-4 py-3">Email Address</th>
                <th className="px-4 py-3">Assigned Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {users.map((u) => {
                const isActive = u.isActive !== false;
                const isCurrent = u.id === currentUser?.id;

                return (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-800/60 transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <div
                        onClick={() => onSelectMember(u)}
                        className="flex items-center space-x-3 cursor-pointer group-hover:translate-x-0.5 transition-transform"
                        title="Click to view details, change role, or toggle active/deactive status"
                      >
                        <img
                          src={u.avatarUrl || 'https://api.dicebear.com/7.x/initials/svg?seed=User'}
                          alt={u.fullName}
                          className="h-8 w-8 rounded-full border border-slate-700 object-cover group-hover:border-indigo-500"
                        />
                        <div>
                          <div className="font-semibold text-slate-200 flex items-center group-hover:text-indigo-300 transition-colors">
                            <span className="underline decoration-slate-700 group-hover:decoration-indigo-400 underline-offset-2">{u.fullName}</span>
                            {isCurrent && (
                              <span className="ml-2 rounded bg-indigo-500/20 px-1 text-[9px] font-bold text-indigo-300">
                                YOU
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">ID #{u.id} • Click to edit role/status</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300">
                      {u.email}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onSelectMember(u)}
                        className={`inline-block rounded border px-2 py-0.5 text-[10px] font-bold uppercase transition-transform hover:scale-105 ${getRoleBadge(u.role)}`}
                        title="Click to change role assignment"
                      >
                        {u.roleDisplayName} ✎
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onSelectMember(u)}
                        className={`inline-flex items-center space-x-1 rounded-full px-2 py-0.5 text-[10px] font-semibold transition-transform hover:scale-105 ${
                          isActive
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-700/60'
                            : 'bg-rose-950/60 text-rose-400 border border-rose-700/60'
                        }`}
                        title="Click to toggle active or deactive status"
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                        <span>{isActive ? 'Active' : 'Deactivated'}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-slate-400">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'System Seed'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => onSelectMember(u)}
                          className="rounded border border-indigo-700/50 bg-indigo-950/40 px-2.5 py-1 text-[11px] font-semibold text-indigo-300 hover:bg-indigo-900/60 transition-colors"
                          title="Assign role or edit status"
                        >
                          Manage Role & Status
                        </button>
                        <button
                          disabled={isCurrent || toggleLoading === u.id}
                          onClick={() => handleToggleStatus(u)}
                          className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
                            isCurrent
                              ? 'opacity-30 cursor-not-allowed bg-slate-800 text-slate-400'
                              : isActive
                              ? 'border border-rose-700/50 bg-rose-950/30 text-rose-300 hover:bg-rose-900/60'
                              : 'border border-emerald-700/50 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/60'
                          }`}
                        >
                          {toggleLoading === u.id ? '...' : isActive ? 'Deactivate' : 'Reactivate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
