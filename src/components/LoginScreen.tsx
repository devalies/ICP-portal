import React, { useState } from 'react';
import {
  Layers,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  User,
  Sparkles,
} from 'lucide-react';
import { apiClient } from '../services/api';
import { User as UserType } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (user: UserType) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setError(null);
    setLoading(true);
    try {
      const data = await apiClient.login(email.trim(), password);
      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  const demoAccounts = [
    { role: 'Administrator', email: 'admin@nexusicp.io', pass: 'Admin123!', color: 'border-purple-700/50 text-purple-300 bg-purple-950/30' },
    { role: 'Manager', email: 'sarah.chen@nexusicp.io', pass: 'Manager123!', color: 'border-blue-700/50 text-blue-300 bg-blue-950/30' },
    { role: 'Sales Person', email: 'marcus.vance@nexusicp.io', pass: 'Sales123!', color: 'border-emerald-700/50 text-emerald-300 bg-emerald-950/30' },
    { role: 'Senior Developer', email: 'alex.moran@nexusicp.io', pass: 'Dev123!', color: 'border-amber-700/50 text-amber-300 bg-amber-950/30' },
    { role: 'Developer', email: 'priya.patel@nexusicp.io', pass: 'Dev123!', color: 'border-cyan-700/50 text-cyan-300 bg-cyan-950/30' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Background radial glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-800 text-white shadow-xl shadow-indigo-600/30 border border-indigo-400/30">
            <Layers className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            NexusICP Portal
          </h2>
          <div className="mt-1 flex items-center space-x-1.5">
            <span className="rounded border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
              Role-Based Pipeline & Project Space
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-400 max-w-sm">
            Sign in with your enterprise credentials to access your role-authorized workspace.
          </p>
        </div>

        {/* Login Card */}
        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-4 rounded-xl border border-rose-800/60 bg-rose-950/40 p-3 text-xs text-rose-300 flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@nexusicp.io"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 py-2.5 pl-9 pr-3 text-xs text-slate-100 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Account Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 py-2.5 pl-9 pr-3 text-xs text-slate-100 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-indigo-400 transition-all"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 border-t border-slate-800 pt-5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2 text-center">
              One-Click Role Login Quick Fill:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {demoAccounts.map((acc, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickLogin(acc.email, acc.pass)}
                  className={`flex flex-col text-left p-2.5 rounded-xl border transition-all hover:scale-[1.02] ${acc.color}`}
                >
                  <span className="font-bold text-[11px]">{acc.role}</span>
                  <span className="text-[10px] text-slate-400 truncate">{acc.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="mt-6 flex items-center justify-center space-x-2 text-xs text-slate-400">
          <ShieldCheck className="h-4 w-4 text-indigo-400" />
          <span>Protected with cryptographic SHA-256 session tokens & Node 22 WAL engine</span>
        </div>
      </div>
    </div>
  );
};
