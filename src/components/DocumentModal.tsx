import React, { useState } from 'react';
import { X, FileText, Upload, BookOpen, Code, Palette, Check } from 'lucide-react';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealId: number;
  onSubmit: (dealId: number, data: {
    fileName: string;
    category: string;
    contentPreview?: string;
    fileSize?: number;
    fileType?: string;
  }) => Promise<void>;
}

export const DocumentModal: React.FC<DocumentModalProps> = ({
  isOpen,
  onClose,
  dealId,
  onSubmit,
}) => {
  const [fileName, setFileName] = useState('');
  const [category, setCategory] = useState('sop');
  const [contentPreview, setContentPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName || !category) return;

    setSubmitting(true);
    try {
      await onSubmit(dealId, {
        fileName,
        category,
        contentPreview: contentPreview || undefined,
        fileSize: contentPreview ? contentPreview.length * 2 : 24000,
        fileType: category === 'contract' ? 'application/pdf' : category === 'sop' ? 'text/markdown' : 'text/plain',
      });
      setFileName('');
      setContentPreview('');
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to attach document');
    } finally {
      setSubmitting(false);
    }
  };

  const setPresetSop = () => {
    setFileName('SOP_Rollback_and_Disaster_Recovery.md');
    setCategory('sop');
    setContentPreview(`# Standard Operating Procedure: Fast Rollback & Recovery
1. Monitor latency and error rates on the live telemetry dashboard.
2. In case of >0.1% error rate on P99, initiate automated Blue-Green traffic shift.
3. Drain active connections to standby cluster.
4. Execute database point-in-time recovery via WAL logs.
5. Notify incident manager and lead developer.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Attach Project Document or Author Dynamic SOP</h3>
          </div>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-slate-300">Document Category *</label>
              <button
                type="button"
                onClick={setPresetSop}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 hover:underline"
              >
                + Insert SOP Template
              </button>
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            >
              <option value="sop">Dynamic SOP / Runbook (Markdown)</option>
              <option value="contract">Executed Contract / SLA (PDF)</option>
              <option value="technical_spec">Technical Architecture Spec</option>
              <option value="design_asset">Design Tokens & Assets</option>
              <option value="deliverable">Handover Deliverable</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">File Name *</label>
            <input
              type="text"
              required
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="e.g. SOP_Incident_Escalation_Runbook.md"
              className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
              Dynamic SOP Content / Document Notes (Markdown supported)
            </label>
            <textarea
              rows={6}
              value={contentPreview}
              onChange={(e) => setContentPreview(e.target.value)}
              placeholder="# Standard Operating Procedure&#10;1. Step one instructions...&#10;2. Step two verification..."
              className="w-full font-mono text-xs rounded border border-slate-700 bg-slate-950 p-3 text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
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
              className="rounded bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              {submitting ? 'Saving...' : 'Save Document to Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
