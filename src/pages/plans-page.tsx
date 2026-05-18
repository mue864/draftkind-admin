import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Crown,
  Gauge,
  Layers,
  PauseCircle,
  Sparkles,
  Tag,
} from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Panel } from "../components/panel";
import { StatCard } from "../components/stat-card";
import {
  ErrorShell,
  LoadingShell,
  Pill,
  SectionHead,
  chartTheme,
} from "../components/ui";
import { deactivatePlan, getApiErrorMessage, getPlanCatalog } from "../lib/api";
import { formatCompactNumber, formatCurrency } from "../lib/format";
import type { AdminPlanCatalog } from "../types/api";

export function PlansPage() {
  const queryClient = useQueryClient();
  const plansQuery = useQuery({
    queryKey: ["admin", "plans"],
    queryFn: getPlanCatalog,
    refetchInterval: 60_000,
  });

  const [pendingId, setPendingId] = useState<number | null>(null);
  const deactivateMutation = useMutation({
    mutationFn: deactivatePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "plans"] });
    },
    onSettled: () => setPendingId(null),
  });

  if (plansQuery.isLoading)
    return <LoadingShell label="Loading plan catalog…" />;
  if (plansQuery.error || !plansQuery.data)
    return <ErrorShell message={getApiErrorMessage(plansQuery.error)} />;

  const plans = plansQuery.data;
  const activePlans = plans.filter((p) => p.active).length;
  const totalSubscribers = plans.reduce(
    (sum, p) => sum + p.currentClaimedSubscriptions,
    0,
  );
  const totalPaid = plans.reduce(
    (sum, p) => sum + p.paidClaimedSubscriptions,
    0,
  );
  const totalTrial = plans.reduce(
    (sum, p) => sum + p.trialClaimedSubscriptions,
    0,
  );

  const chartData = plans.map((p) => ({
    name: p.name.length > 14 ? `${p.name.slice(0, 12)}…` : p.name,
    paid: p.paidClaimedSubscriptions,
    trial: p.trialClaimedSubscriptions,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
        <StatCard
          label="Plans"
          value={formatCompactNumber(plans.length)}
          hint={`${activePlans} active`}
          icon={Layers}
          tone="default"
        />
        <StatCard
          label="Subscribers"
          value={formatCompactNumber(totalSubscribers)}
          hint="All paid + trial"
          icon={Crown}
          tone="mint"
        />
        <StatCard
          label="Paid"
          value={formatCompactNumber(totalPaid)}
          hint="Currently billed"
          icon={CheckCircle2}
          tone="mint"
        />
        <StatCard
          label="Trialing"
          value={formatCompactNumber(totalTrial)}
          hint="In free trial"
          icon={Sparkles}
          tone="amber"
        />
      </div>

      <Panel>
        <SectionHead
          eyebrow="Mix"
          eyebrowIcon={Gauge}
          eyebrowTone="indigo"
          title="Subscribers by plan"
          description="Stacked view of paid vs. trial members per plan tier."
        />
        <div className="mt-6 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ left: 4, right: 4, top: 8 }}>
              <CartesianGrid
                stroke={chartTheme.grid}
                vertical={false}
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="name"
                stroke={chartTheme.axis}
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke={chartTheme.axis}
                fontSize={chartTheme.axisFont}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={chartTheme.tooltip}
                cursor={{ fill: "rgba(99,102,241,0.06)" }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, color: chartTheme.axis }}
                iconType="circle"
              />
              <Bar
                dataKey="paid"
                stackId="x"
                name="Paid"
                fill={chartTheme.palette.indigo}
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="trial"
                stackId="x"
                name="Trial"
                fill={chartTheme.palette.amber}
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            pending={pendingId === plan.id && deactivateMutation.isPending}
            onDeactivate={() => {
              setPendingId(plan.id);
              deactivateMutation.mutate(plan.id);
            }}
          />
        ))}
      </div>
    </div>
  );
}

function PlanCard({
  plan,
  pending,
  onDeactivate,
}: {
  plan: AdminPlanCatalog;
  pending: boolean;
  onDeactivate: () => void;
}) {
  const fillPercent = plan.subscriberCap
    ? Math.min(100, (plan.claimedSubscriptions / plan.subscriberCap) * 100)
    : null;

  return (
    <motion.article
      whileHover={{ y: -4 }}
      className="relative overflow-hidden rounded-2xl border border-white/70 bg-white/80 p-6 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_30px_60px_-40px_rgba(15,23,42,0.35)] backdrop-blur-xl"
    >
      <span
        aria-hidden
        className={`absolute inset-x-6 top-0 h-px bg-gradient-to-r ${plan.active ? "from-indigo-500 via-sky-500 to-teal-500" : "from-slate-400 to-slate-600"} opacity-80`}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-heading text-lg font-bold tracking-tight text-slate-900">
            {plan.name}
          </div>
          <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            {plan.platform} · {plan.billingCycle}
          </div>
        </div>
        <Pill variant={plan.active ? "emerald" : "neutral"}>
          {plan.active ? "ACTIVE" : "PAUSED"}
        </Pill>
      </div>

      <div className="mt-5 flex items-baseline gap-1">
        <span className="font-heading text-3xl font-bold tracking-tight text-slate-900">
          {formatCurrency(plan.price)}
        </span>
        <span className="text-xs font-medium text-slate-500">
          / {plan.billingCycle.toLowerCase()}
        </span>
      </div>
      <div className="mt-1 text-xs font-medium text-slate-500">
        {formatCompactNumber(plan.monthlyCredits)} credits / cycle
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-slate-50/70 p-3">
        <Stat
          label="Paid"
          value={plan.paidClaimedSubscriptions}
          tone="emerald"
        />
        <Stat
          label="Trial"
          value={plan.trialClaimedSubscriptions}
          tone="amber"
        />
        <Stat label="Cap" value={plan.subscriberCap ?? "∞"} tone="slate" />
      </div>

      {fillPercent !== null ? (
        <div className="mt-4">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
            <span>Capacity</span>
            <span>{fillPercent.toFixed(0)}%</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/60">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${fillPercent}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className={`h-full rounded-full ${plan.soldOut ? "bg-gradient-to-r from-rose-500 to-pink-500" : "bg-gradient-to-r from-indigo-500 via-sky-500 to-teal-500"}`}
            />
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-1.5">
        {plan.subjectGenerationEnabled ? (
          <Pill variant="indigo" icon={Tag}>
            Subjects
          </Pill>
        ) : null}
        {plan.translationEnabled ? <Pill variant="sky">Translate</Pill> : null}
        {plan.historyEnabled ? <Pill variant="violet">History</Pill> : null}
        {plan.favoritesEnabled ? <Pill variant="amber">Favorites</Pill> : null}
        {plan.prioritySupportEnabled ? (
          <Pill variant="rose">Priority</Pill>
        ) : null}
      </div>

      {plan.active ? (
        <motion.button
          whileTap={{ scale: 0.97 }}
          type="button"
          disabled={pending}
          onClick={onDeactivate}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <PauseCircle size={14} />
          {pending ? "Deactivating…" : "Deactivate plan"}
        </motion.button>
      ) : null}
    </motion.article>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone: "emerald" | "amber" | "slate";
}) {
  const colors = {
    emerald: "text-emerald-700",
    amber: "text-amber-700",
    slate: "text-slate-700",
  }[tone];
  return (
    <div className="text-center">
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </div>
      <div className={`mt-1 font-heading text-base font-bold ${colors}`}>
        {typeof value === "number" ? formatCompactNumber(value) : value}
      </div>
    </div>
  );
}
