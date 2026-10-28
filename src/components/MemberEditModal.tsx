import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Shield,
  Mail,
  Lock,
  CheckCircle,
  XCircle,
  Key,
  ShieldAlert,
  Save,
  Trash2,
} from 'lucide-react';
import { User as UserType } from '../types';

interface MemberEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: UserType | null;
  currentUser: UserType | null;
  onSave: (userId: number, data: {
    fullName: string;
    email: string;
    roleId: number;
    isActive: boolean;
    password?: string;
  }) => Promise<void>;
}

export const MemberEditModal: React.FC<MemberEditModalProps> = ({
  isOpen,
  onClose,
  member,
  currentUser,
  onSave,
}) => {
  if (!isOpen || !member) return null;

  const [fullName, setFullName] = useState(member.fullName);
  const [email, setEmail] = useState(member.email);
  const [roleId, setRoleId] = useState<number>(member.roleId);
  const [isActive, setIsActive] = useState<boolean>(member.isActive !== false);
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (member) {
      setFullName(member.fullName);
      setEmail(member.email);
      setRoleId(member.roleId);
      setIsActive(member.isActive !== false);
      setNewPassword('');
    }
  }, [member]);

  const isSelf = member.id === currentUser?.id;

  const roles = [
    { id: 1, name: 'admin', label: 'Administrator', desc: 'Full access to pipelines, projects, users & financials' },
    { id: 2, name: 'manager', label: 'Manager', desc: 'Team overview, deal approvals, project management' },
    { id: 3, name: 'sales', label: 'Sales Person', desc: 'ICP outreach, leads, sending ICPIs, creating deals' },
    { id: 4, name: 'senior_dev', label: 'Senior Developer', desc: 'Architecture, technical specs, assigned projects' },
    { id: 5, name: 'developer', label: 'Developer', desc: 'Assigned project workspaces, milestones, deliverables' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) return;

    if (isSelf && !isActive) {
      alert('You cannot deactivate your own logged-in account.');
      return;
    }

    setSubmitting(true);
    try {
      await onSave(member.id, {
        fullName,
        email,
        roleId: Number(roleId),
        isActive,
        password: newPassword.trim() ? newPassword.trim() : undefined,
      });
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to update member');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <img
              src={member.avatarUrl || 'https://api.dicebear.com/7.x/initials/svg?seed=User'}
              alt={member.fullName}
              className="h-10 w-10 rounded-full border border-slate-700 object-cover"
            />
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">{member.fullName}</h3>
                {isSelf && (
                  <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-bold text-indigo-300">
                    CURRENT USER
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Member ID #{member.id} • Assigned Role: <span className="text-indigo-400 font-semibold">{member.roleDisplayName}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close modal" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Active or Deactive Toggle */}
          <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-3">
            <label className="text-xs font-semibold text-slate-200 block mb-1">
              Account Status (Active / Deactive)
            </label>
            <div className="flex items-center space-x-3 mt-2">
              <button
                type="button"
                onClick={() => setIsActive(true)}
                className={`flex-1 flex items-center justify-center space-x-2 rounded-lg border py-2 text-xs font-semibold transition-all ${
                  isActive
                    ? 'border-emerald-600 bg-emerald-950/60 text-emerald-300 shadow-md shadow-emerald-950/40'
                    : 'border-slate-700 bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <span>Active Account</span>
              </button>

              <button
                type="button"
                disabled={isSelf}
                onClick={() => setIsActive(false)}
                className={`flex-1 flex items-center justify-center space-x-2 rounded-lg border py-2 text-xs font-semibold transition-all ${
                  !isActive
                    ? 'border-rose-600 bg-rose-950/60 text-rose-300 shadow-md shadow-rose-950/40'
                    : 'border-slate-700 bg-slate-800 text-slate-400 hover:text-white'
                } ${isSelf ? 'opacity-40 cursor-not-allowed' : ''}`}
                title={isSelf ? 'Cannot deactivate self' : 'Deactivate account'}
              >
                <XCircle className="h-4 w-4 text-rose-400" />
                <span>Deactivated</span>
              </button>
            </div>
            {isSelf && (
              <p className="mt-1.5 text-[10px] text-amber-400">
                * You are currently signed in as this member; account must stay active.
              </p>
            )}
          </div>

          {/* Role Assignment */}
          <div>
            <label className="text-xs font-semibold text-slate-200 block mb-1.5 flex items-center">
              <Shield className="h-3.5 w-3.5 text-indigo-400 mr-1.5" />
              <span>Change / Assign Security Role *</span>
            </label>
            <div className="space-y-1.5">
              {roles.map((r) => (
                <label
                  key={r.id}
                  className={`flex items-start space-x-2.5 rounded-lg border p-2.5 cursor-pointer transition-colors ${
                    roleId === r.id
                      ? 'border-indigo-500 bg-indigo-950/40 text-white'
                      : 'border-slate-800 bg-slate-800/40 text-slate-300 hover:bg-slate-800/80'
                  }`}
                >
                  <input
                    type="radio"
                    name="roleId"
                    value={r.id}
                    checked={roleId === r.id}
                    onChange={() => setRoleId(r.id)}
                    className="mt-1 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{r.label}</span>
                      {roleId === r.id && (
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide">
                          Assigned
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{r.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Full Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Password Reset */}
          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
              Reset Password (leave blank to keep unchanged)
            </label>
            <input
              type="password"
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (optional)"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-700 px-4 py-2 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center space-x-1.5 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/30"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{submitting ? 'Updating...' : 'Save Member Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
