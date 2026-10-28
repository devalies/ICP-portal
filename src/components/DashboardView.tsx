import React from 'react';
import {
  Send,
  MessageSquare,
  Percent,
  Flame,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  ArrowRight,
  Building2,
  Award,
  PlusCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { PipelineMetrics } from '../types';

interface DashboardViewProps {
  metrics: PipelineMetrics | null;
  industryStats: Array<{ industry: string; count: number; total_value: number }>;
  salesRepStats: Array<{ id: number; full_name: string; avatar_url: string; total_leads: number; won_leads: number; closed_revenue: number }>;
  onOpenNewLead: () => void;
  onNavigateTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  industryStats,
  salesRepStats,
  onOpenNewLead,
  onNavigateTab,
}) => {
  if (!metrics) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center space-x-2 text-slate-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
          <span>Loading analytics metrics...</span>
        </div>
      </div>
    );
  }

  const kpis = [
    {
      title: 'Total ICPIs Sent',
      value: metrics.totalIcpiSent,
      change: 'Active outreach initiated',
      icon: Send,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-950/40 border-indigo-800/40',
    },
    {
      title: 'Responses & Rate',
      value: `${metrics.totalResponses} (${metrics.responseRatePercent}%)`,
      change: `${metrics.totalResponses} prospects engaged`,
      icon: MessageSquare,
      color: 'text-sky-400',
      bgColor: 'bg-sky-950/40 border-sky-800/40',
    },
    {
      title: 'Dead / Cold Leads',
      value: metrics.totalDeadCold,
      change: 'Disqualified or frozen',
      icon: Flame,
      color: 'text-rose-400',
      bgColor: 'bg-rose-950/40 border-rose-800/40',
    },
    {
      title: 'Total Closed Deals',
      value: metrics.totalWonClosed,
      change: `${metrics.conversionRatePercent}% overall conversion`,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-950/40 border-emerald-800/40',
    },
    {
      title: 'Total Converted Revenue',
      value: `$${(metrics.totalConvertedValue || 0).toLocaleString()}`,
      change: 'Won closed contracts',
      icon: DollarSign,
      color: 'text-amber-400',
      bgColor: 'bg-amber-950/40 border-amber-800/40',
    },
    {
      title: 'Total Pipeline Value',
      value: `$${(metrics.totalPipelineValue || 0).toLocaleString()}`,
      change: 'All active & closed opportunities',
      icon: TrendingUp,
      color: 'text-purple-400',
      bgColor: 'bg-purple-950/40 border-purple-800/40',
    },
  ];

  // Stage funnel items
  const funnelStages = [
    {
      id: 'draft',
      label: '1. Initial Contact & ICPI Draft',
      count: metrics.stageCounts.draft || 0,
      description: 'Account identified and pitch prepared',
      color: 'from-slate-600 to-slate-700',
      textColor: 'text-slate-300',
    },
    {
      id: 'icpi_sent',
      label: '2. ICPI Dispatched',
      count: metrics.stageCounts.icpi_sent || 0,
      description: 'Sent custom ICP value proposition',
      color: 'from-indigo-600 to-indigo-700',
      textColor: 'text-indigo-300',
    },
    {
      id: 'response_received',
      label: '3. Response Received & Pitch',
      count: metrics.stageCounts.response_received || 0,
      description: 'Prospect replied and agreed to demo',
      color: 'from-sky-600 to-sky-700',
      textColor: 'text-sky-300',
    },
    {
      id: 'negotiation',
      label: '4. Proposal & Negotiation',
      count: metrics.stageCounts.negotiation || 0,
      description: 'Terms, SLAs & architecture review',
      color: 'from-amber-600 to-amber-700',
      textColor: 'text-amber-300',
    },
    {
      id: 'won',
      label: '5. Won Closed Deal',
      count: metrics.stageCounts.won || 0,
      description: 'Contract signed & workspace initialized',
      color: 'from-emerald-600 to-emerald-700',
      textColor: 'text-emerald-300',
    },
  ];

  const maxFunnelCount = Math.max(...funnelStages.map((s) => s.count), 1);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            ICP Pipeline & Conversion Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time telemetry tracking lead movement, outreach conversion rates, and revenue impact.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigateTab('pipeline')}
            className="flex items-center space-x-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700"
          >
            <span>View Board</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onOpenNewLead}
            className="flex items-center space-x-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-medium text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 transition-colors"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Create ICP Lead</span>
          </button>
        </div>
      </div>

      {/* 6 Key Performance Indicators (KPIs) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className={`rounded-xl border p-4 transition-all hover:scale-[1.01] ${kpi.bgColor}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {kpi.title}
                </span>
                <Icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
              <div className="mt-2 text-xl font-bold text-white">{kpi.value}</div>
              <p className="mt-1 text-[11px] text-slate-400">{kpi.change}</p>
            </div>
          );
        })}
      </div>

      {/* Stage-by-Stage Conversion Funnel */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div>
            <h2 className="text-sm font-semibold text-white">Stage-by-Stage Conversion Funnel</h2>
            <p className="text-xs text-slate-400">
              Flow of prospective client accounts from initial identification to deal closure.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span>Overall Conversion:</span>
            <span className="rounded bg-emerald-950/60 border border-emerald-700/60 px-2 py-0.5 text-xs font-bold text-emerald-400">
              {metrics.conversionRatePercent}%
            </span>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {funnelStages.map((stage, i) => {
            const widthPercent = Math.max((stage.count / maxFunnelCount) * 100, 8);
            return (
              <div key={stage.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className={`font-semibold ${stage.textColor}`}>{stage.label}</span>
                    <span className="text-slate-400 text-[11px]">({stage.description})</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm font-bold text-white">{stage.count}</span>
                    <span className="text-[11px] text-slate-400">leads</span>
                  </div>
                </div>

                <div className="h-3 w-full rounded-full bg-slate-800/80 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${stage.color} transition-all duration-500`}
                    style={{ width: `${widthPercent}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Secondary Analytics: Industry Distribution & Sales Rep Leaderboard */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Industry Breakdown */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center space-x-2">
              <Building2 className="h-4 w-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-white">Pipeline by Target Industry</h3>
            </div>
            <span className="text-xs text-slate-400">{industryStats.length} sectors</span>
          </div>

          <div className="mt-4 divide-y divide-slate-800/60">
            {industryStats.map((ind, idx) => (
              <div key={idx} className="flex items-center justify-between py-2.5 text-xs">
                <div>
                  <div className="font-medium text-slate-200">{ind.industry}</div>
                  <div className="text-[11px] text-slate-400">{ind.count} active pipeline deals</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-semibold text-white">
                    ${(ind.total_value || 0).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-indigo-400">Pipeline allocation</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Sales Reps Performance */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center space-x-2">
              <Award className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-white">Sales Team Performance Leaderboard</h3>
            </div>
            <span className="text-xs text-slate-400">Won Revenue</span>
          </div>

          <div className="mt-4 divide-y divide-slate-800/60">
            {salesRepStats.map((rep) => (
              <div key={rep.id} className="flex items-center justify-between py-2.5 text-xs">
                <div className="flex items-center space-x-3">
                  <img
                    src={rep.avatar_url || 'https://api.dicebear.com/7.x/initials/svg?seed=Rep'}
                    alt={rep.full_name}
                    className="h-8 w-8 rounded-full border border-slate-700 object-cover"
                  />
                  <div>
                    <div className="font-medium text-slate-200">{rep.full_name}</div>
                    <div className="text-[11px] text-slate-400">
                      {rep.won_leads} won out of {rep.total_leads} assigned
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-emerald-400">
                    ${(rep.closed_revenue || 0).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400">Closed Deal Value</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
