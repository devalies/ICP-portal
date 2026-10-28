import React, { useState, useEffect } from 'react';
import {
  Shield,
  Bell,
  Search,
  BookOpen,
  Download,
  CheckCircle,
  Clock,
  Layers,
  ChevronDown,
  UserCheck,
  LogOut,
  Key,
  Sparkles,
} from 'lucide-react';
import { User, NotificationItem } from '../types';
import { apiClient } from '../services/api';

interface HeaderProps {
  currentUser: User | null;
  onSwitchUser: (userId: number) => void;
  onOpenApiDocs: () => void;
  onOpenLogin: () => void;
  onSignOut: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onSwitchUser,
  onOpenApiDocs,
  onOpenLogin,
  onSignOut,
  searchQuery,
  setSearchQuery,
  onNavigateTab,
}) => {
  const [usersList, setUsersList] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifMenu, setShowNotifMenu] = useState<boolean>(false);
  const [showPersonaMenu, setShowPersonaMenu] = useState<boolean>(false);
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);

  useEffect(() => {
    loadHeaderData();
  }, [currentUser]);

  const loadHeaderData = async () => {
    try {
      const usersData = await apiClient.getUsers();
      setUsersList(usersData.users || []);

      const notifData = await apiClient.getNotifications();
      setNotifications(notifData.notifications || []);
      setUnreadCount(notifData.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load header data:', err);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await apiClient.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  // Role badge color helper
  const getRoleBadge = (role: string) => {
    switch (role) {
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

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-3 backdrop-blur-md">
      {/* Left: Branding & Portal Badge */}
      <div className="flex items-center space-x-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-800 text-white shadow-md shadow-indigo-500/20">
          <Layers className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold tracking-tight text-white">NexusICP</span>
            <span className="rounded border border-indigo-500/30 bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-300">
              ENTERPRISE RBAC
            </span>
          </div>
          <p className="text-xs text-slate-400">Order & ICP Pipeline Tracking Portal</p>
        </div>
      </div>

      {/* Middle: Global Search */}
      <div className="hidden md:flex flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <label htmlFor="global-search" className="sr-only">Search</label>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="global-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search deals, clients, companies, or tech scopes..."
            className="w-full rounded-lg border border-slate-700 bg-slate-800/80 py-1.5 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Right Controls: Architecture/API Docs, Export, Notifications, Persona Switcher */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* System Architecture & API Docs Button */}
        <button
          onClick={onOpenApiDocs}
          className="flex items-center space-x-1.5 rounded-lg border border-indigo-700/50 bg-indigo-950/40 px-2.5 py-1.5 text-xs font-medium text-indigo-300 transition-colors hover:bg-indigo-900/60"
          title="Architecture, ERD & REST API Documentation"
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Arch & API Docs</span>
        </button>

        {/* CSV Export Button / Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center space-x-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white"
            title="Export CSV Reports"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Export</span>
            <ChevronDown className="h-3 w-3" />
          </button>

          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-52 rounded-lg border border-slate-700 bg-slate-800 py-1 shadow-xl z-50">
              <a
                href="/api/export/pipeline.csv"
                download
                onClick={() => setShowExportMenu(false)}
                className="flex items-center px-3 py-2 text-xs text-slate-200 hover:bg-slate-700"
              >
                <Download className="mr-2 h-3.5 w-3.5 text-indigo-400" />
                Export ICP Pipeline (CSV)
              </a>
              <a
                href="/api/export/deals.csv"
                download
                onClick={() => setShowExportMenu(false)}
                className="flex items-center px-3 py-2 text-xs text-slate-200 hover:bg-slate-700"
              >
                <Download className="mr-2 h-3.5 w-3.5 text-emerald-400" />
                Export Closed Deals (CSV)
              </a>
              <a
                href="/api/export/audit-logs.csv"
                download
                onClick={() => setShowExportMenu(false)}
                className="flex items-center px-3 py-2 text-xs text-slate-200 hover:bg-slate-700"
              >
                <Download className="mr-2 h-3.5 w-3.5 text-amber-400" />
                Export Audit Trail (CSV)
              </a>
            </div>
          )}
        </div>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-700 bg-slate-900 py-2 shadow-2xl z-50">
              <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Automated Alerts & Activity
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No notifications at this time
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        handleMarkAsRead(n.id);
                        if (n.link) {
                          onNavigateTab(n.link.replace('/', ''));
                          setShowNotifMenu(false);
                        }
                      }}
                      className={`cursor-pointer px-4 py-2.5 transition-colors hover:bg-slate-800/80 ${
                        n.is_read ? 'opacity-70' : 'bg-indigo-950/20'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-xs font-medium text-slate-200">{n.title}</span>
                        {!n.is_read && (
                          <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-400 line-clamp-2">{n.message}</p>
                      <span className="mt-1 block text-[10px] text-slate-400">
                        {n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Persona & RBAC Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowPersonaMenu(!showPersonaMenu)}
            className="flex items-center space-x-2 rounded-lg border border-slate-700 bg-slate-800/90 py-1 pl-1.5 pr-2 hover:bg-slate-700/80 transition-colors"
            title="Switch Persona / Role Evaluation"
          >
            <img
              src={currentUser?.avatarUrl || 'https://api.dicebear.com/7.x/initials/svg?seed=User'}
              alt={currentUser?.fullName || 'User'}
              className="h-6 w-6 rounded-full border border-slate-600 object-cover"
            />
            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold text-slate-200 leading-tight">
                {currentUser?.fullName?.split(' ')[0]}
              </div>
              <span className={`inline-block rounded border px-1 text-[9px] font-bold uppercase ${getRoleBadge(currentUser?.role || '')}`}>
                {currentUser?.roleDisplayName}
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {showPersonaMenu && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-700 bg-slate-900 py-2 shadow-2xl z-50">
              <div className="border-b border-slate-800 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400 flex items-center">
                  <UserCheck className="mr-1.5 h-3.5 w-3.5" />
                  Test RBAC Role Personas
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Click any role to test system security & view permissions live:
                </p>
              </div>

              <div className="max-h-72 overflow-y-auto py-1">
                {usersList.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      onSwitchUser(u.id);
                      setShowPersonaMenu(false);
                    }}
                    className={`w-full flex items-center px-3 py-2 text-left text-xs transition-colors hover:bg-slate-800 ${
                      currentUser?.id === u.id ? 'bg-indigo-950/40 text-indigo-300' : 'text-slate-300'
                    }`}
                  >
                    <img
                      src={u.avatarUrl || 'https://api.dicebear.com/7.x/initials/svg?seed=User'}
                      alt={u.fullName}
                      className="h-7 w-7 rounded-full border border-slate-700 mr-2.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-200 truncate">{u.fullName}</span>
                        {currentUser?.id === u.id && (
                          <span className="text-[10px] text-indigo-400 font-bold ml-1">ACTIVE</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        <span className={`rounded border px-1 py-0.2 text-[9px] font-semibold ${getRoleBadge(u.role)}`}>
                          {u.roleDisplayName}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate">{u.email}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="border-t border-slate-800 pt-1 mt-1 px-2 space-y-1">
                <button
                  onClick={() => {
                    setShowPersonaMenu(false);
                    onOpenLogin();
                  }}
                  className="w-full flex items-center justify-center space-x-1.5 py-1.5 text-xs text-slate-400 hover:text-white rounded hover:bg-slate-800"
                >
                  <Key className="h-3 w-3" />
                  <span>Manage Credentials & Password</span>
                </button>
                <button
                  onClick={() => {
                    setShowPersonaMenu(false);
                    onSignOut();
                  }}
                  className="w-full flex items-center justify-center space-x-1.5 py-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 rounded hover:bg-rose-950/40 border border-rose-900/30"
                >
                  <LogOut className="h-3 w-3" />
                  <span>Sign Out of NexusICP</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
