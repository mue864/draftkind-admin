import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ShieldAlert, TimerReset, Waves } from "lucide-react";

import { getApiErrorMessage, getGuestUsage } from "../lib/api";
import { formatCompactNumber, formatDateTime } from "../lib/format";
import { Panel } from "../components/panel";
import { StatCard } from "../components/stat-card";

export function GuestUsagePage() {
  const guestQuery = useQuery({
    queryKey: ["admin", "guest-usage"],
    queryFn: () => getGuestUsage(14),
  });

  if (guestQuery.isLoading) {
    return <div className="flex items-center justify-center h-64 text-sm font-medium text-slate-500">Loading guest shield analytics...</div>;
  }

  if (guestQuery.error || !guestQuery.data) {
    return <div className="p-4 rounded-lg bg-red-50 text-red-600 border border-red-200">{getApiErrorMessage(guestQuery.error)}</div>;
  }

  const buckets = guestQuery.data.hottestBuckets.map((item) => ({
    name: `${item.bucketType}-${item.fingerprintPrefix.slice(0, 6)}`,
    count: item.requestCount,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          hint="Minute-scoped rate-limit buckets alive"
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
          hint="Summed from minute buckets over trailing 24h"
          icon={ShieldAlert}
          label="Guest requests in 24h"
          tone="rose"
          value={formatCompactNumber(guestQuery.data.requestsLast24Hours)}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Panel className="flex flex-col">
          <div className="mb-6">
            <div className="text-xs font-semibold text-indigo-600 tracking-wider uppercase mb-1">Hot fingerprints</div>
            <h3 className="text-lg font-bold text-slate-800">Buckets driving the most guest load</h3>
          </div>

          <div className="w-full flex-1 min-h-[300px] mb-2">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={buckets}>
                <CartesianGrid stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} fontSize={12} />
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
                <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel className="flex flex-col overflow-hidden p-0">
          <div className="p-6 border-b border-slate-200 shrink-0 bg-white">
            <div className="text-xs font-semibold text-indigo-600 tracking-wider uppercase mb-1">Bucket detail</div>
            <h3 className="text-lg font-bold text-slate-800">Most active recent guest signatures</h3>
          </div>

          <div className="flex-1 overflow-x-auto overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fingerprint</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Requests</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider pt-3 pb-3">Updated</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {guestQuery.data.hottestBuckets.map((bucket) => (
                  <tr key={`${bucket.bucketType}-${bucket.fingerprintPrefix}-${bucket.windowStart}`} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <strong className="block text-sm font-bold text-slate-900 mb-0.5">{bucket.fingerprintPrefix}</strong>
                      <span className="block text-xs text-slate-500">{formatDateTime(bucket.windowStart)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold border bg-slate-100 text-slate-600 border-slate-200">
                        {bucket.bucketType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-900">{formatCompactNumber(bucket.requestCount)}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                      {formatDateTime(bucket.updatedAt)}
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
