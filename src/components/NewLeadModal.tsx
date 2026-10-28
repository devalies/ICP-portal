import React, { useState } from 'react';
import { X, Send, DollarSign, Calendar, Building, FileText } from 'lucide-react';
import { Client } from '../types';

interface NewLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  onSubmit: (data: {
    clientId: number;
    title: string;
    dealAmount: number;
    icpiContent?: string;
    notes?: string;
    expectedCloseDate?: string;
    initialStatus?: string;
  }) => Promise<void>;
}

export const NewLeadModal: React.FC<NewLeadModalProps> = ({
  isOpen,
  onClose,
  clients,
  onSubmit,
}) => {
  const [clientId, setClientId] = useState<number>(clients[0]?.id || 1);
  const [title, setTitle] = useState('');
  const [dealAmount, setDealAmount] = useState<string>('50000');
  const [expectedDate, setExpectedDate] = useState('');
  const [initialStatus, setInitialStatus] = useState('draft');
  const [icpiContent, setIcpiContent] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !clientId) return;

    setSubmitting(true);
    try {
      await onSubmit({
        clientId: Number(clientId),
        title,
        dealAmount: Number(dealAmount) || 0,
        expectedCloseDate: expectedDate || undefined,
        initialStatus,
        icpiContent,
        notes,
      });
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to create lead');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white">Create New ICP Pipeline Lead</h3>
            <p className="text-xs text-slate-400">Initialize a prospective opportunity and draft an Ideal Customer Profile pitch.</p>
          </div>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">Target Client Account *</label>
            <select
              required
              value={clientId}
              onChange={(e) => setClientId(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name} ({c.client_name}) - {c.industry}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">Opportunity / Deal Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Apex High-Volume Message Broker Integration"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Estimated Deal Amount ($) *</label>
              <input
                type="number"
                min="0"
                step="500"
                required
                value={dealAmount}
                onChange={(e) => setDealAmount(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Target Close Date</label>
              <input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">Initial Pipeline Stage</label>
            <select
              value={initialStatus}
              onChange={(e) => setInitialStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            >
              <option value="draft">Draft ICPI (Internal Review)</option>
              <option value="icpi_sent">ICPI Dispatched (Outreach Active)</option>
              <option value="response_received">Response Received (Agreed to Pitch)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">Draft ICPI Value Proposition</label>
            <textarea
              rows={3}
              value={icpiContent}
              onChange={(e) => setIcpiContent(e.target.value)}
              placeholder="Outline the Ideal Customer Profile fit, pain points resolved, and tailored architecture solution..."
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
              className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/30"
            >
              {submitting ? 'Creating...' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
