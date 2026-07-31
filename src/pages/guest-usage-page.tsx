import { useQuery } from "@tanstack/react-query";
import {
  Fingerprint,
  Globe2,
  ShieldAlert,
  TimerReset,
  Waves,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Panel } from "../components/panel";
import { StatCard } from "../components/stat-card";
import {
  EmptyShell,
  ErrorShell,
  LoadingShell,
  Pill,
  SectionHead,
  chartTheme,
} from "../components/ui";
import { getApiErrorMessage, getGuestUsage } from "../lib/api";
import { formatCompactNumber, formatDateTime } from "../lib/format";

const palette = [
  chartTheme.palette.indigo,
  chartTheme.palette.violet,
  chartTheme.palette.emerald,
  chartTheme.palette.amber,
  chartTheme.palette.rose,
  chartTheme.palette.sky,
];

export function GuestUsagePage() {
  const guestQuery = useQuery({
    queryKey: ["admin", "guest-usage"],
    queryFn: () => getGuestUsage(14),
    refetchInterval: 30_000,
  });

  if (guestQuery.isLoading) {
    return <LoadingShell label="Loading guest shield analytics…" />;
  }
  if (guestQuery.error || !guestQuery.data) {
    return <ErrorShell message={getApiErrorMessage(guestQuery.error)} />;
  }

  const buckets = guestQuery.data.hottestBuckets.map((item, index) => ({
    name: `${item.bucketType.slice(0, 1)}·${item.fingerprintPrefix.slice(0, 6)}`,
    count: item.requestCount,
    color: palette[index % palette.length],
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <StatCard
          hint="Minute-scoped rate-limit buckets currently alive"
          icon={Waves}
          label="Active minute buckets"
          tone="default"
          value={formatCompactNumber(guestQuery.data.activeMinuteBuckets)}
        />
        <StatCard
          hint="Day-scoped guest fingerprints currently active"
          icon={TimerReset}
          label="Active day buckets"
          tone="mint"
          value={formatCompactNumber(guestQuery.data.activeDayBuckets)}
        />
        <StatCard
          hint="Summed across minute buckets over trailing 24h"
          icon={ShieldAlert}
          label="Guest requests 24h"
          tone="rose"
          value={formatCompactNumber(guestQuery.data.requestsLast24Hours)}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel>
          <SectionHead
            eyebrow="Edge load"
            eyebrowIcon={Fingerprint}
            eyebrowTone="amber"
            title="Hottest guest fingerprints"
            description="Tall bars indicate either a viral surge or an abuse signal worth investigating."
          />
          <div className="mt-6 h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={buckets} margin={{ left: 4, right: 4, top: 8 }}>
                <CartesianGrid
                  stroke={chartTheme.grid}
                  vertical={false}
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="name"
                  stroke={chartTheme.axis}
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  interval={0}
                  angle={-20}
                  dy={8}
                />
                <YAxis
                  stroke={chartTheme.axis}
                  tickLine={false}
                  axisLine={false}
                  fontSize={chartTheme.axisFont}
                />
                <Tooltip
                  contentStyle={chartTheme.darkTooltip}
                  cursor={{ fill: "rgba(99,102,241,0.08)" }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {buckets.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel className="p-0">
          <div className="border-b border-slate-200/70 p-6">
            <SectionHead
              eyebrow="Bucket detail"
              eyebrowIcon={Globe2}
              title="Most active recent signatures"
              description="Use the fingerprint and window start to triage repeat offenders."
            />
          </div>

          {guestQuery.data.hottestBuckets.length === 0 ? (
            <div className="p-6">
              <EmptyShell
                title="No buckets active"
                description="Nothing is currently hitting guest endpoints hard."
              />
            </div>
          ) : (
            <div className="max-h-[26rem] overflow-y-auto">
              <table className="w-full border-collapse text-left">
                <thead className="sticky top-0 z-10 bg-slate-900 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-300">
                  <tr>
                    <th className="px-6 py-3">Fingerprint</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Requests</th>
                    <th className="px-6 py-3">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {guestQuery.data.hottestBuckets.map((bucket) => (
                    <tr
                      key={`${bucket.bucketType}-${bucket.fingerprintPrefix}-${bucket.windowStart}`}
                      className="transition-colors hover:bg-slate-50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Fingerprint size={14} className="text-sky-700" />
                          <div>
                            <div className="font-mono text-xs font-semibold text-slate-900">
                              {bucket.fingerprintPrefix}
                            </div>
                            <div className="mt-0.5 text-[11px] text-slate-500">
                              window {formatDateTime(bucket.windowStart)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Pill
                          variant={
                            bucket.bucketType === "MINUTE" ? "sky" : "violet"
                          }
                        >
                          {bucket.bucketType}
                        </Pill>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-heading text-sm font-bold text-slate-900">
                          {formatCompactNumber(bucket.requestCount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-500">
                        {formatDateTime(bucket.updatedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
