import React, { useState } from 'react';
import { X, UserPlus, Shield, Lock, Mail, User } from 'lucide-react';

import { User as UserType } from '../types';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserType | null;
  onSubmit: (data: {
    fullName: string;
    email: string;
    password: string;
    roleId: number;
  }) => Promise<void>;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSubmit,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const isManager = currentUser?.role === 'manager';
  const [roleId, setRoleId] = useState<number>(3); // Default to Sales Person
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password || !roleId) return;

    setSubmitting(true);
    try {
      await onSubmit({
        fullName,
        email,
        password,
        roleId: Number(roleId),
      });
      setFullName('');
      setEmail('');
      setPassword('');
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="rounded-lg bg-indigo-600/20 p-2 text-indigo-400 border border-indigo-500/30">
              <UserPlus className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Provision Team Member Account</h3>
              <p className="text-xs text-slate-400">Add user credentials and assign a role-based access scope.</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Jordan Blake"
              className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">Work Email Address *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jordan.blake@nexusicp.io"
              className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">Initial Password *</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">Role Assignment & Security Level *</label>
            <select
              value={roleId}
              onChange={(e) => setRoleId(Number(e.target.value))}
              className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            >
              {!isManager && <option value={1}>Administrator (Full Access & User Management)</option>}
              <option value={2}>Manager (Operations, Deal Approvals & Project Workspace)</option>
              <option value={3}>Sales Person (ICP Pipeline, Outreach & Conversions)</option>
              <option value={4}>Senior Developer (Assigned Projects, Tech Scopes & Specs)</option>
              <option value={5}>Developer (Assigned Projects, Milestones & Deliverables)</option>
            </select>
            {isManager && (
              <p className="mt-1 text-[10px] text-amber-400">
                * Note: Administrator accounts can only be provisioned by an Administrator.
              </p>
            )}
          </div>

          <div className="rounded border border-indigo-900/40 bg-indigo-950/20 p-2.5 text-[11px] text-slate-400">
            Account will be created as <strong className="text-emerald-400">Active</strong> with immediate authentication and session token generation privileges.
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
              disabled={submitting}
              className="rounded bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/30"
            >
              {submitting ? 'Provisioning...' : 'Provision Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
