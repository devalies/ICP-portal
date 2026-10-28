import React, { useState } from 'react';
import { X, Send, FileText, CheckCircle, Mail, Sparkles } from 'lucide-react';
import { PipelineItem } from '../types';

interface SendIcpiModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: PipelineItem | null;
  onSend: (id: number, content: string) => Promise<void>;
}

export const SendIcpiModal: React.FC<SendIcpiModalProps> = ({
  isOpen,
  onClose,
  item,
  onSend,
}) => {
  if (!isOpen || !item) return null;

  const defaultPitch = item.icpi_content || `Dear ${item.client_name},

Based on our architectural review of ${item.company_name}'s high-growth operations in ${item.industry || 'the industry'}, we have tailored an enterprise ICP solution: "${item.title}".

Our engineering team specializes in low-latency infrastructure, distributed workflows, and high-availability systems with 99.99% uptime SLAs.

Key Value Deliverables:
1. End-to-end integration and turnkey service scaffold
2. Sub-millisecond data pipelines and hardened security audit trails
3. Full SLA compliance and technical documentation runbooks

Estimated Contract Scope: $${(item.deal_amount || 0).toLocaleString()}

We would welcome an initial 20-minute architecture alignment session to present the system blueprints.`;

  const [content, setContent] = useState(defaultPitch);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await onSend(item.id, content);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch ICPI');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="rounded-lg bg-indigo-600/20 p-2 text-indigo-400 border border-indigo-500/30">
              <Send className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Dispatch Formal ICPI Outreach</h3>
              <p className="text-xs text-slate-400">
                Send Ideal Customer Profile introduction to {item.company_name} ({item.client_email}).
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="rounded-lg border border-slate-800 bg-slate-800/40 p-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Recipient Contact:</span>
              <span className="font-semibold text-slate-200">{item.client_name} &lt;{item.client_email}&gt;</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Target Opportunity:</span>
              <span className="font-semibold text-white">{item.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Deal Value:</span>
              <span className="font-mono font-bold text-emerald-400">${(item.deal_amount || 0).toLocaleString()}</span>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
              Customized ICPI Proposal Letter
            </label>
            <textarea
              rows={8}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full font-mono text-xs rounded-lg border border-slate-700 bg-slate-950 p-3 text-slate-200 focus:border-indigo-500 focus:outline-none"
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
              disabled={sending}
              className="flex items-center space-x-1.5 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/30"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{sending ? 'Dispatching...' : 'Confirm & Dispatch ICPI'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
