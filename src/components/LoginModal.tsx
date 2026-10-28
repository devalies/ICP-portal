import React, { useState } from 'react';
import { X, Lock, Mail, Key, ShieldCheck, Check } from 'lucide-react';
import { apiClient } from '../services/api';
import { User } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onLoginSuccess: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
}) => {
  const [tab, setTab] = useState<'login' | 'change_password'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const data = await apiClient.login(email, password);
      onLoginSuccess(data.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const res = await apiClient.changePassword(currentPassword, newPassword);
      setMessage(res.message || 'Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const fillQuick = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Lock className="h-4 w-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Security Authentication & Credentials</h3>
          </div>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="mt-3 flex border-b border-slate-800">
          <button
            onClick={() => { setTab('login'); setError(null); setMessage(null); }}
            className={`border-b-2 py-2 px-3 text-xs font-semibold ${
              tab === 'login' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400'
            }`}
          >
            Sign In with Email
          </button>
          {currentUser && (
            <button
              onClick={() => { setTab('change_password'); setError(null); setMessage(null); }}
              className={`border-b-2 py-2 px-3 text-xs font-semibold ${
                tab === 'change_password' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400'
              }`}
            >
              Change My Password
            </button>
          )}
        </div>

        {error && (
          <div className="mt-3 rounded border border-rose-800/60 bg-rose-950/40 p-2.5 text-xs text-rose-300">
            {error}
          </div>
        )}
        {message && (
          <div className="mt-3 rounded border border-emerald-800/60 bg-emerald-950/40 p-2.5 text-xs text-emerald-300">
            {message}
          </div>
        )}

        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="mt-4 space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. admin@nexusicp.io"
                className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="rounded border border-slate-800 bg-slate-800/40 p-2.5 text-[10px] text-slate-400 space-y-1">
              <span className="font-semibold text-slate-300 block">Quick Demo Credentials:</span>
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => fillQuick('admin@nexusicp.io', 'Admin123!')}
                  className="rounded bg-slate-700/80 px-1.5 py-0.5 hover:bg-slate-700 text-purple-300"
                >
                  Admin (Admin123!)
                </button>
                <button
                  type="button"
                  onClick={() => fillQuick('sarah.chen@nexusicp.io', 'Manager123!')}
                  className="rounded bg-slate-700/80 px-1.5 py-0.5 hover:bg-slate-700 text-blue-300"
                >
                  Manager (Manager123!)
                </button>
                <button
                  type="button"
                  onClick={() => fillQuick('marcus.vance@nexusicp.io', 'Sales123!')}
                  className="rounded bg-slate-700/80 px-1.5 py-0.5 hover:bg-slate-700 text-emerald-300"
                >
                  Sales (Sales123!)
                </button>
                <button
                  type="button"
                  onClick={() => fillQuick('alex.moran@nexusicp.io', 'Dev123!')}
                  className="rounded bg-slate-700/80 px-1.5 py-0.5 hover:bg-slate-700 text-amber-300"
                >
                  Sr Dev (Dev123!)
                </button>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="rounded border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleChangePassword} className="mt-4 space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Current Password *</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">New Password (min 6 chars) *</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="rounded border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
