import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  Crown,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Panel } from "../components/panel";
import { StatCard } from "../components/stat-card";
import { getApiErrorMessage, getOverview, getTrends } from "../lib/api";
import { formatCompactNumber, formatPercent, formatShortDate } from "../lib/format";

export function OverviewPage() {
  const overviewQuery = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: getOverview,
  });

  const trendsQuery = useQuery({
    queryKey: ["admin", "trends", 14],
    queryFn: () => getTrends(14),
  });

  if (overviewQuery.isLoading || trendsQuery.isLoading) {
    return (
      <div className="flex min-h-[20rem] items-center justify-center rounded-3xl border border-slate-200 bg-white text-sm font-medium text-slate-500 shadow-sm">
        Loading your operations overview...
      </div>
    );
  }

  if (overviewQuery.error || trendsQuery.error || !overviewQuery.data || !trendsQuery.data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-600">
        {getApiErrorMessage(overviewQuery.error ?? trendsQuery.error)}
      </div>
    );
  }

  const overview = overviewQuery.data;
  const trends = trendsQuery.data;

  const conversionRate =
    overview.totalUsers > 0 ? (overview.paidActiveSubscriptions / overview.totalUsers) * 100 : 0;
  const trialShare =
    overview.currentSubscriptionsTotal > 0
      ? (overview.activeTrials / overview.currentSubscriptionsTotal) * 100
      : 0;
  const failureRate =
    overview.rewritesLast24Hours > 0
      ? (overview.failedRewritesLast24Hours / overview.rewritesLast24Hours) * 100
      : 0;

  const trendSeries = trends.map((item) => ({
    label: formatShortDate(item.day),
    rewrites: item.rewrites,
    guestRequests: item.guestRequests,
    newUsers: item.newUsers,
    failedRewrites: item.failedRewrites,
  }));

  const planSeries = overview.subscriptionsByPlan.map((item) => ({
    name: item.planName,
    paidSubscribers: item.paidSubscriberCount,
    activeTrials: item.trialSubscriberCount,
    currentSubscribers: item.currentSubscriberCount,
  }));

  const trendTotals = trends.reduce(
    (accumulator, item) => ({
      rewrites: accumulator.rewrites + item.rewrites,
      guestRequests: accumulator.guestRequests + item.guestRequests,
      newUsers: accumulator.newUsers + item.newUsers,
      failedRewrites: accumulator.failedRewrites + item.failedRewrites,
    }),
    { rewrites: 0, guestRequests: 0, newUsers: 0, failedRewrites: 0 },
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Total users"
          value={formatCompactNumber(overview.totalUsers)}
          hint={`${formatCompactNumber(overview.usersCreatedLast24Hours)} new in the last 24 hours`}
          icon={Users}
          tone="mint"
        />
        <StatCard
          label="Paid subscribers"
          value={formatCompactNumber(overview.paidActiveSubscriptions)}
          hint={`${formatPercent(conversionRate)} of total users have converted to paid`}
          icon={Crown}
          tone="default"
        />
        <StatCard
          label="Active trials"
          value={formatCompactNumber(overview.activeTrials)}
          hint={`${formatPercent(trialShare)} of current subscriptions are still in preview`}
          icon={Sparkles}
          tone="amber"
        />
        <StatCard
          label="Current subscriptions"
          value={formatCompactNumber(overview.currentSubscriptionsTotal)}
          hint="Paid and trial subscriptions combined"
          icon={TrendingUp}
          tone="mint"
        />
        <StatCard
          label="Rewrites in 24h"
          value={formatCompactNumber(overview.rewritesLast24Hours)}
          hint={`${formatCompactNumber(overview.failedRewritesLast24Hours)} failures in the same window`}
          icon={Sparkles}
          tone="mint"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <Panel className="relative overflow-hidden border-slate-200 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.08),_transparent_28%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-600">
                <Activity size={14} />
                Operational Balance
              </div>
              <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900">
                Draftkind activity across the last 14 days
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                This combines authenticated rewrite volume, guest traffic, and fresh user growth so you can see whether
                demand and reliability are moving together.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:min-w-[18rem]">
              <div className="rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 shadow-sm">
                <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Failure rate</div>
                <div className="mt-2 font-heading text-2xl font-bold text-slate-900">{formatPercent(failureRate)}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 shadow-sm">
                <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">14-day rewrites</div>
                <div className="mt-2 font-heading text-2xl font-bold text-slate-900">
                  {formatCompactNumber(trendTotals.rewrites)}
                </div>
              </div>
            </div>
          </div>

          <div className="h-[22rem] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendSeries}>
                <defs>
                  <linearGradient id="overviewRewritesGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="overviewGuestGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e2e8f0" vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 16px 40px -24px rgba(15, 23, 42, 0.45)",
                    background: "#ffffff",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="guestRequests"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#overviewGuestGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="rewrites"
                  stroke="#6366f1"
                  strokeWidth={3}
                  fill="url(#overviewRewritesGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-4 shadow-sm">
              <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">New users</div>
              <div className="mt-2 font-heading text-2xl font-bold text-slate-900">
                {formatCompactNumber(trendTotals.newUsers)}
              </div>
              <div className="mt-1 text-sm text-slate-500">Across the current 14-day trend window</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-4 shadow-sm">
              <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Guest pressure</div>
              <div className="mt-2 font-heading text-2xl font-bold text-slate-900">
                {formatCompactNumber(trendTotals.guestRequests)}
              </div>
              <div className="mt-1 text-sm text-slate-500">
                {formatCompactNumber(overview.activeMinuteBuckets)} live minute buckets right now
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-4 shadow-sm">
              <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Failed rewrites</div>
              <div className="mt-2 font-heading text-2xl font-bold text-slate-900">
                {formatCompactNumber(trendTotals.failedRewrites)}
              </div>
              <div className="mt-1 text-sm text-slate-500">Measured over the same 14-day activity curve</div>
            </div>
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel className="border-slate-200 bg-white">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-600">
                  <TrendingUp size={14} />
                  Growth Mix
                </div>
                <h3 className="font-heading text-xl font-bold text-slate-900">Current plan distribution</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Trial occupancy is separated from paid subscribers so commercial mix is easier to read.
                </p>
              </div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
                {planSeries.length} plans
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={planSeries} layout="vertical" margin={{ left: 8, right: 8 }}>
                  <CartesianGrid stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    width={92}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 16px 40px -24px rgba(15, 23, 42, 0.45)",
                      background: "#ffffff",
                    }}
                  />
                  <Bar dataKey="paidSubscribers" name="Paid" stackId="subscriptions" fill="#0f172a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="activeTrials" name="Trials" stackId="subscriptions" fill="#f59e0b" radius={[0, 10, 10, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel className="border-slate-200 bg-white">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-600">
                  <AlertTriangle size={14} />
                  Watchlist
                </div>
                <h3 className="font-heading text-xl font-bold text-slate-900">Health signals from live backend data</h3>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div>
                  <div className="text-sm font-semibold text-slate-800">Rewrite failures in 24h</div>
                  <div className="mt-1 text-sm text-slate-500">
                    Track provider instability and parsing issues before they turn into support tickets.
                  </div>
                </div>
                <div className="font-heading text-2xl font-bold text-slate-900">
                  {formatCompactNumber(overview.failedRewritesLast24Hours)}
                </div>
              </div>

              <div className="flex items-start justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div>
                  <div className="text-sm font-semibold text-slate-800">Guest requests in 24h</div>
                  <div className="mt-1 text-sm text-slate-500">
                    Free-user and anonymous demand still matters because it often precedes conversion or abuse pressure.
                  </div>
                </div>
                <div className="font-heading text-2xl font-bold text-slate-900">
                  {formatCompactNumber(overview.guestRequestsLast24Hours)}
                </div>
              </div>

              <div className="flex items-start justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div>
                  <div className="text-sm font-semibold text-slate-800">Minute limiter buckets</div>
                  <div className="mt-1 text-sm text-slate-500">
                    Live guest throttling signatures currently active across the API edge.
                  </div>
                </div>
                <div className="font-heading text-2xl font-bold text-slate-900">
                  {formatCompactNumber(overview.activeMinuteBuckets)}
                </div>
              </div>

              <div className="flex items-start justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div>
                  <div className="text-sm font-semibold text-slate-800">Day limiter buckets</div>
                  <div className="mt-1 text-sm text-slate-500">
                    Ongoing guest pressure that is still active in the daily abuse-protection window.
                  </div>
                </div>
                <div className="font-heading text-2xl font-bold text-slate-900">
                  {formatCompactNumber(overview.activeDayBuckets)}
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
