import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertOctagon,
  Apple,
  CreditCard,
  RefreshCw,
  Repeat2,
  ScrollText,
} from "lucide-react";
import { useState } from "react";

import { Panel } from "../components/panel";
import {
  EmptyShell,
  ErrorShell,
  LoadingShell,
  Pill,
  PillVariant,
  SectionHead,
  Tile,
} from "../components/ui";
import {
  getApiErrorMessage,
  getBillingDeadLetters,
  getRevenueCatBillingDeadLetters,
  replayBillingDeadLetter,
  replayRevenueCatBillingDeadLetter,
  syncRevenueCatCatalog,
} from "../lib/api";
import { formatCompactNumber, formatDateTime } from "../lib/format";

type Filter = "ALL" | "PENDING" | "DEAD_LETTER";

const statusVariant: Record<string, PillVariant> = {
  PENDING: "amber",
  DEAD_LETTER: "rose",
  RECOVERED: "emerald",
  REPLAYED: "emerald",
};

function pillFor(status: string): PillVariant {
  return statusVariant[status.toUpperCase()] ?? "neutral";
}

export function BillingOpsPage() {
  const [filter, setFilter] = useState<Filter>("ALL");
  const params = filter === "ALL" ? undefined : filter;

  const googleQuery = useQuery({
    queryKey: ["admin", "billing", "google", params],
    queryFn: () => getBillingDeadLetters(40, params),
    refetchInterval: 45_000,
  });
  const rcQuery = useQuery({
    queryKey: ["admin", "billing", "rc", params],
    queryFn: () => getRevenueCatBillingDeadLetters(40, params),
    refetchInterval: 45_000,
  });

  const totalDead =
    (googleQuery.data?.filter((d) => d.status === "DEAD_LETTER").length ?? 0) +
    (rcQuery.data?.filter((d) => d.status === "DEAD_LETTER").length ?? 0);
  const totalPending =
    (googleQuery.data?.filter((d) => d.status === "PENDING").length ?? 0) +
    (rcQuery.data?.filter((d) => d.status === "PENDING").length ?? 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Tile
          label="Dead letters"
          accent="rose"
          icon={AlertOctagon}
          value={formatCompactNumber(totalDead)}
          hint="Across both providers"
        />
        <Tile
          label="Pending"
          accent="amber"
          icon={Repeat2}
          value={formatCompactNumber(totalPending)}
          hint="Awaiting retry"
        />
        <Tile
          label="Google events"
          accent="indigo"
          icon={CreditCard}
          value={formatCompactNumber(googleQuery.data?.length ?? 0)}
          hint="In filter window"
        />
        <Tile
          label="RevenueCat"
          accent="emerald"
          icon={Apple}
          value={formatCompactNumber(rcQuery.data?.length ?? 0)}
          hint="In filter window"
        />
      </div>

      <Panel>
        <SectionHead
          eyebrow="Filter"
          eyebrowIcon={ScrollText}
          title="Billing event triage"
          description="Filter and replay stuck or dead-lettered subscription events."
          trailing={
            <div className="inline-flex rounded-xl bg-slate-900 p-1 text-[11px] font-semibold text-slate-300 shadow-inner">
              {(["ALL", "PENDING", "DEAD_LETTER"] as const).map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setFilter(label)}
                  className={`rounded-lg px-3 py-1.5 transition ${
                    filter === label
                      ? "bg-gradient-to-r from-indigo-500 to-sky-500 text-white shadow"
                      : "hover:text-white"
                  }`}
                >
                  {label.replace("_", " ")}
                </button>
              ))}
            </div>
          }
        />
      </Panel>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <GooglePanel query={googleQuery} />
        <RevenueCatPanel query={rcQuery} />
      </div>
    </div>
  );
}

function GooglePanel({
  query,
}: {
  query: ReturnType<
    typeof useQuery<Awaited<ReturnType<typeof getBillingDeadLetters>>>
  >;
}) {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<string | null>(null);
  const replay = useMutation({
    mutationFn: replayBillingDeadLetter,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["admin", "billing", "google"],
      }),
    onSettled: () => setPending(null),
  });

  return (
    <Panel className="p-0">
      <div className="border-b border-slate-200/70 p-6">
        <SectionHead
          eyebrow="Google Play"
          eyebrowIcon={CreditCard}
          title="Play Billing dead letters"
          description="RTDN events that failed downstream processing."
        />
      </div>
      {query.isLoading ? (
        <div className="p-6">
          <LoadingShell label="Loading Google events…" />
        </div>
      ) : query.error ? (
        <div className="p-6">
          <ErrorShell message={getApiErrorMessage(query.error)} />
        </div>
      ) : (query.data ?? []).length === 0 ? (
        <div className="p-6">
          <EmptyShell
            title="No Google events"
            description="Everything is clean in this filter window."
          />
        </div>
      ) : (
        <ul className="max-h-[34rem] divide-y divide-slate-100 overflow-y-auto">
          {(query.data ?? []).map((event) => (
            <li
              key={event.eventId}
              className="px-6 py-4 transition-colors hover:bg-indigo-50/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Pill variant={pillFor(event.status)}>{event.status}</Pill>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {event.notificationType}
                    </span>
                  </div>
                  <div className="mt-1.5 truncate font-mono text-xs font-semibold text-slate-900">
                    {event.productId}{" "}
                    {event.basePlanId ? `· ${event.basePlanId}` : ""}
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-500">
                    Retries {event.retryCount} ·{" "}
                    {formatDateTime(event.updatedAt)}
                  </div>
                  {event.lastError ? (
                    <div className="mt-2 rounded-lg border border-rose-100 bg-rose-50/70 px-3 py-2 text-[11px] font-medium text-rose-700">
                      {event.lastError}
                    </div>
                  ) : null}
                </div>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  disabled={pending === event.eventId && replay.isPending}
                  onClick={() => {
                    setPending(event.eventId);
                    replay.mutate(event.eventId);
                  }}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-500 px-3 py-1.5 text-[11px] font-semibold text-white shadow transition hover:shadow-md disabled:opacity-60"
                >
                  <Repeat2 size={12} />
                  Replay
                </motion.button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function RevenueCatPanel({
  query,
}: {
  query: ReturnType<
    typeof useQuery<Awaited<ReturnType<typeof getRevenueCatBillingDeadLetters>>>
  >;
}) {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<string | null>(null);
  const replay = useMutation({
    mutationFn: replayRevenueCatBillingDeadLetter,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "billing", "rc"] }),
    onSettled: () => setPending(null),
  });
  const sync = useMutation({
    mutationFn: syncRevenueCatCatalog,
  });

  return (
    <Panel className="p-0">
      <div className="border-b border-slate-200/70 p-6">
        <SectionHead
          eyebrow="RevenueCat"
          eyebrowIcon={Apple}
          eyebrowTone="emerald"
          title="RevenueCat dead letters"
          description="Cross-platform billing events that failed delivery."
          trailing={
            <motion.button
              whileTap={{ scale: 0.96 }}
              type="button"
              disabled={sync.isPending}
              onClick={() => sync.mutate()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-60"
            >
              <RefreshCw
                size={12}
                className={sync.isPending ? "animate-spin" : ""}
              />
              {sync.isPending ? "Syncing…" : "Sync catalog"}
            </motion.button>
          }
        />
        {sync.data ? (
          <div className="mt-3 rounded-xl border border-emerald-200/70 bg-emerald-50/70 px-3 py-2 text-[11px] font-semibold text-emerald-700">
            Updated {sync.data.plansUpdated} · Missed {sync.data.plansMissed}
          </div>
        ) : null}
      </div>
      {query.isLoading ? (
        <div className="p-6">
          <LoadingShell label="Loading RevenueCat events…" />
        </div>
      ) : query.error ? (
        <div className="p-6">
          <ErrorShell message={getApiErrorMessage(query.error)} />
        </div>
      ) : (query.data ?? []).length === 0 ? (
        <div className="p-6">
          <EmptyShell
            title="No RevenueCat events"
            description="Everything is clean in this filter window."
          />
        </div>
      ) : (
        <ul className="max-h-[34rem] divide-y divide-slate-100 overflow-y-auto">
          {(query.data ?? []).map((event) => (
            <li
              key={event.eventId}
              className="px-6 py-4 transition-colors hover:bg-indigo-50/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Pill variant={pillFor(event.status)}>{event.status}</Pill>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {event.eventType}
                    </span>
                  </div>
                  <div className="mt-1.5 truncate font-mono text-xs font-semibold text-slate-900">
                    {event.appUserId}
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-500">
                    {event.productId ?? "—"} · Retries {event.retryCount} ·{" "}
                    {formatDateTime(event.updatedAt)}
                  </div>
                  {event.lastError ? (
                    <div className="mt-2 rounded-lg border border-rose-100 bg-rose-50/70 px-3 py-2 text-[11px] font-medium text-rose-700">
                      {event.lastError}
                    </div>
                  ) : null}
                </div>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  disabled={pending === event.eventId && replay.isPending}
                  onClick={() => {
                    setPending(event.eventId);
                    replay.mutate(event.eventId);
                  }}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-1.5 text-[11px] font-semibold text-white shadow transition hover:shadow-md disabled:opacity-60"
                >
                  <Repeat2 size={12} />
                  Replay
                </motion.button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
