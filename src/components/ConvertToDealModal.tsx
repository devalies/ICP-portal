import React, { useState } from 'react';
import { X, CheckCircle, Briefcase, User, Calendar, DollarSign, Code } from 'lucide-react';
import { PipelineItem, User as UserType } from '../types';

interface ConvertToDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: PipelineItem | null;
  users: UserType[];
  onConvert: (id: number, data: {
    projectName: string;
    finalAmount: number;
    managerId?: number;
    developerId: number;
    technicalScope?: string;
    deliverables?: string;
    targetDeliveryDate?: string;
  }) => Promise<void>;
}

export const ConvertToDealModal: React.FC<ConvertToDealModalProps> = ({
  isOpen,
  onClose,
  item,
  users,
  onConvert,
}) => {
  if (!isOpen || !item) return null;

  // Find developers and managers
  const developers = users.filter((u) => u.role === 'developer' || u.role === 'senior_dev');
  const managers = users.filter((u) => u.role === 'manager' || u.role === 'admin');

  const [projectName, setProjectName] = useState(item.title);
  const [finalAmount, setFinalAmount] = useState(String(item.deal_amount || 75000));
  const [managerId, setManagerId] = useState<number>(managers[0]?.id || 2);
  const [developerId, setDeveloperId] = useState<number>(developers[0]?.id || 5);
  const [targetDeliveryDate, setTargetDeliveryDate] = useState(
    new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [technicalScope, setTechnicalScope] = useState(
    `Production engineering and turnkey deployment for ${item.company_name}.\n\nCore Architecture:\n1. Low-latency backend APIs with resilient queuing\n2. Real-time operations monitoring and automated alert dispatcher\n3. Micro-batch sync with client ERP/CRM\n4. SLA: 99.99% availability, <= 100ms P99 latency`
  );
  const [deliverables, setDeliverables] = useState(
    `1. High-availability Service Scaffolding & API Gateway\n2. Real-time Telemetry Dashboard for operations\n3. Automated regression test suite & deployment runbooks\n4. ISO 20022 / SOC-2 compliance handover documentation`
  );
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName || !finalAmount || !developerId) return;

    setSubmitting(true);
    try {
      await onConvert(item.id, {
        projectName,
        finalAmount: Number(finalAmount),
        managerId: Number(managerId),
        developerId: Number(developerId),
        technicalScope,
        deliverables,
        targetDeliveryDate,
      });
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to convert deal');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="rounded-lg bg-emerald-600/20 p-2 text-emerald-400 border border-emerald-500/30">
              <CheckCircle className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Convert Won Opportunity to Operational Project</h3>
              <p className="text-xs text-slate-400">
                Setup dedicated project workspace, assign developer and manager, and establish milestones.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">Project Workspace Name *</label>
            <input
              type="text"
              required
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Final Executed Contract Amount ($) *</label>
              <input
                type="number"
                min="0"
                step="1000"
                required
                value={finalAmount}
                onChange={(e) => setFinalAmount(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Target Handover / Delivery Date</label>
              <input
                type="date"
                required
                value={targetDeliveryDate}
                onChange={(e) => setTargetDeliveryDate(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Assigned Project Manager *</label>
              <select
                required
                value={managerId}
                onChange={(e) => setManagerId(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              >
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} ({m.roleDisplayName})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Assigned Lead Developer *</label>
              <select
                required
                value={developerId}
                onChange={(e) => setDeveloperId(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              >
                {developers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.fullName} ({d.roleDisplayName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">Technical Scope Description</label>
            <textarea
              rows={3}
              value={technicalScope}
              onChange={(e) => setTechnicalScope(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">Key Deliverables Checklist</label>
            <textarea
              rows={3}
              value={deliverables}
              onChange={(e) => setDeliverables(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
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
              className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/30"
            >
              {submitting ? 'Converting...' : 'Provision Project Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
