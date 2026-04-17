import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, BarChart3, RefreshCw, Repeat2, ShieldAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Panel } from "../components/panel";
import { StatCard } from "../components/stat-card";
import {
  getApiErrorMessage,
  getBillingDeadLetters,
  getRevenueCatBillingDeadLetters,
  replayBillingDeadLetter,
  replayRevenueCatBillingDeadLetter,
  syncRevenueCatCatalog,
} from "../lib/api";
import { formatCompactNumber, formatDateTime } from "../lib/format";

const filters = ["ALL", "PENDING", "DEAD_LETTER"] as const;

export function BillingOpsPage() {
  const [googleStatusFilter, setGoogleStatusFilter] = useState<(typeof filters)[number]>("ALL");
  const [revenueCatStatusFilter, setRevenueCatStatusFilter] =
    useState<(typeof filters)[number]>("ALL");
  const queryClient = useQueryClient();

  const googleBillingQuery = useQuery({
    queryKey: ["admin", "billing-dead-letters", "google", googleStatusFilter],
    queryFn: () =>
      getBillingDeadLetters(24, googleStatusFilter === "ALL" ? undefined : googleStatusFilter),
  });
  const revenueCatBillingQuery = useQuery({
    queryKey: ["admin", "billing-dead-letters", "revenuecat", revenueCatStatusFilter],
    queryFn: () =>
      getRevenueCatBillingDeadLetters(
        24,
        revenueCatStatusFilter === "ALL" ? undefined : revenueCatStatusFilter,
      ),
  });

  const googleReplayMutation = useMutation({
    mutationFn: replayBillingDeadLetter,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "billing-dead-letters", "google"] });
    },
  });
  const revenueCatReplayMutation = useMutation({
    mutationFn: replayRevenueCatBillingDeadLetter,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "billing-dead-letters", "revenuecat"] });
    },
  });
  const revenueCatCatalogSyncMutation = useMutation({
    mutationFn: syncRevenueCatCatalog,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "billing-dead-letters", "revenuecat"] });
    },
  });

  const googleDeadLetters = googleBillingQuery.data ?? [];
  const googlePendingCount = googleDeadLetters.filter((item) => item.status === "PENDING").length;
  const googleDeadCount = googleDeadLetters.filter((item) => item.status === "DEAD_LETTER").length;
  const googleHighestRetryCount = googleDeadLetters.reduce(
    (max, item) => Math.max(max, item.retryCount),
    0,
  );
  const googleChartData = useMemo(
    () =>
      googleDeadLetters.map((item) => ({
        label: item.eventId.slice(0, 6),
        retries: item.retryCount,
      })),
    [googleDeadLetters],
  );
  const revenueCatDeadLetters = revenueCatBillingQuery.data ?? [];
  const revenueCatPendingCount = revenueCatDeadLetters.filter((item) => item.status === "PENDING").length;
  const revenueCatDeadCount = revenueCatDeadLetters.filter((item) => item.status === "DEAD_LETTER").length;
  const revenueCatHighestRetryCount = revenueCatDeadLetters.reduce(
    (max, item) => Math.max(max, item.retryCount),
    0,
  );
  const revenueCatChartData = useMemo(
    () =>
      revenueCatDeadLetters.map((item) => ({
        label: item.eventId.slice(0, 6),
        retries: item.retryCount,
      })),
    [revenueCatDeadLetters],
  );

  if (googleBillingQuery.isLoading || revenueCatBillingQuery.isLoading) {
    return <div className="flex items-center justify-center h-64 text-sm font-medium text-slate-500">Loading billing operations...</div>;
  }

  if (googleBillingQuery.error || revenueCatBillingQuery.error) {
    return (
      <div className="p-4 rounded-lg bg-red-50 text-red-600 border border-red-200">
        {getApiErrorMessage(googleBillingQuery.error || revenueCatBillingQuery.error)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          hint="Google billing dead letters in view"
          icon={BarChart3}
          label="Google tracked"
          tone="default"
          value={formatCompactNumber(googleDeadLetters.length)}
        />
        <StatCard
          hint="Google events still eligible for auto-retry"
          icon={Repeat2}
          label="Google pending"
          tone="mint"
          value={formatCompactNumber(googlePendingCount)}
        />
        <StatCard
          hint="RevenueCat dead letters in view"
          icon={BarChart3}
          label="RevenueCat tracked"
          tone="default"
          value={formatCompactNumber(revenueCatDeadLetters.length)}
        />
        <StatCard
          hint="RevenueCat events still eligible for auto-retry"
          icon={Repeat2}
          label="RevenueCat pending"
          tone="mint"
          value={formatCompactNumber(revenueCatPendingCount)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          hint="Google events that exhausted recovery"
          icon={AlertTriangle}
          label="Google dead"
          tone="rose"
          value={formatCompactNumber(googleDeadCount)}
        />
        <StatCard
          hint="Highest Google retry count in view"
          icon={ShieldAlert}
          label="Google max retries"
          tone="amber"
          value={formatCompactNumber(googleHighestRetryCount)}
        />
        <StatCard
          hint="RevenueCat events that exhausted recovery"
          icon={AlertTriangle}
          label="RevenueCat dead"
          tone="rose"
          value={formatCompactNumber(revenueCatDeadCount)}
        />
        <StatCard
          hint="Highest RevenueCat retry count in view"
          icon={ShieldAlert}
          label="RevenueCat max retries"
          tone="amber"
          value={formatCompactNumber(revenueCatHighestRetryCount)}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <Panel className="xl:col-span-2 flex flex-col">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="text-xs font-semibold text-indigo-600 tracking-wider uppercase mb-1">Google billing</div>
              <h3 className="text-lg font-bold text-slate-800">Retry intensity across events</h3>
            </div>
          </div>
          
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 mb-6">
            {filters.map((filter) => (
              <button
                key={filter}
                className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-all ${
                  googleStatusFilter === filter
                    ? "bg-white text-indigo-700 shadow-sm border border-slate-200/50"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                }`}
                onClick={() => setGoogleStatusFilter(filter)}
                type="button"
              >
                {filter === "ALL" ? "All" : filter.replace("_", " ")}
              </button>
            ))}
          </div>

          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={googleChartData}>
                <CartesianGrid stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" stroke="#64748b" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis stroke="#64748b" tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    color: "#f8fafc",
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  }}
                  cursor={{fill: '#f8fafc'}}
                />
                <Bar dataKey="retries" fill="#f43f5e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel className="xl:col-span-3 flex flex-col overflow-hidden p-0">
          <div className="p-6 border-b border-slate-200 shrink-0 bg-white">
            <div>
              <div className="text-xs font-semibold text-indigo-600 tracking-wider uppercase mb-1">Google billing</div>
              <h3 className="text-lg font-bold text-slate-800">Dead-letter events ready for replay</h3>
            </div>
          </div>

          {googleReplayMutation.data ? (
            <div className={`mx-6 mt-6 p-4 rounded-lg text-sm border font-medium ${
              googleReplayMutation.data.recovered 
                ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}>
              {googleReplayMutation.data.message}
            </div>
          ) : null}

          <div className="flex-1 overflow-x-auto overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Event</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Retries</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Updated</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {googleDeadLetters.map((item) => (
                  <tr key={item.eventId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <strong className="block text-sm font-bold text-slate-900 mb-0.5">{item.productId}</strong>
                      <span className="block text-xs text-slate-500">{item.notificationType} · {item.eventId.slice(0, 10)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        item.status === "PENDING" 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 font-medium">
                      {item.retryCount}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formatDateTime(item.updatedAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-md transition-colors border border-slate-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={googleReplayMutation.isPending}
                        onClick={() => googleReplayMutation.mutate(item.eventId)}
                        type="button"
                      >
                        <RefreshCw size={14} className={googleReplayMutation.isPending && googleReplayMutation.variables === item.eventId ? "animate-spin text-indigo-600" : "text-slate-400"} />
                        <span>Replay</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <Panel className="xl:col-span-2 flex flex-col">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="text-xs font-semibold text-indigo-600 tracking-wider uppercase mb-1">RevenueCat billing</div>
              <h3 className="text-lg font-bold text-slate-800">Retry intensity across events</h3>
            </div>
            <button
              className="inline-flex items-center space-x-2 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-md transition-colors border border-slate-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={revenueCatCatalogSyncMutation.isPending}
              onClick={() => revenueCatCatalogSyncMutation.mutate()}
              type="button"
            >
              <RefreshCw size={14} className={revenueCatCatalogSyncMutation.isPending ? "animate-spin text-indigo-600" : "text-slate-400"} />
              <span>Sync catalog</span>
            </button>
          </div>

          {revenueCatCatalogSyncMutation.data ? (
            <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              Updated {revenueCatCatalogSyncMutation.data.plansUpdated} plans, missed {revenueCatCatalogSyncMutation.data.plansMissed}.
            </div>
          ) : null}

          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 mb-6">
            {filters.map((filter) => (
              <button
                key={`rc-${filter}`}
                className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-all ${
                  revenueCatStatusFilter === filter
                    ? "bg-white text-indigo-700 shadow-sm border border-slate-200/50"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                }`}
                onClick={() => setRevenueCatStatusFilter(filter)}
                type="button"
              >
                {filter === "ALL" ? "All" : filter.replace("_", " ")}
              </button>
            ))}
          </div>

          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueCatChartData}>
                <CartesianGrid stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" stroke="#64748b" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis stroke="#64748b" tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    color: "#f8fafc",
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                  }}
                  cursor={{ fill: "#f8fafc" }}
                />
                <Bar dataKey="retries" fill="#0f766e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel className="xl:col-span-3 flex flex-col overflow-hidden p-0">
          <div className="p-6 border-b border-slate-200 shrink-0 bg-white">
            <div>
              <div className="text-xs font-semibold text-indigo-600 tracking-wider uppercase mb-1">RevenueCat billing</div>
              <h3 className="text-lg font-bold text-slate-800">Dead-letter events and catalog actions</h3>
            </div>
          </div>

          {revenueCatReplayMutation.data ? (
            <div className={`mx-6 mt-6 p-4 rounded-lg text-sm border font-medium ${
              revenueCatReplayMutation.data.replayed
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}>
              {revenueCatReplayMutation.data.message}
            </div>
          ) : null}

          <div className="flex-1 overflow-x-auto overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Event</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Entitlement</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Retries</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Updated</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {revenueCatDeadLetters.map((item) => (
                  <tr key={item.eventId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <strong className="block text-sm font-bold text-slate-900 mb-0.5">
                        {item.productId || item.eventType}
                      </strong>
                      <span className="block text-xs text-slate-500">
                        {item.eventType} · {item.eventId.slice(0, 10)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {item.entitlementId || "Unmapped"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        item.status === "PENDING"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 font-medium">
                      {item.retryCount}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formatDateTime(item.updatedAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-md transition-colors border border-slate-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={revenueCatReplayMutation.isPending}
                        onClick={() => revenueCatReplayMutation.mutate(item.eventId)}
                        type="button"
                      >
                        <RefreshCw
                          size={14}
                          className={
                            revenueCatReplayMutation.isPending &&
                            revenueCatReplayMutation.variables === item.eventId
                              ? "animate-spin text-indigo-600"
                              : "text-slate-400"
                          }
                        />
                        <span>Replay</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}
