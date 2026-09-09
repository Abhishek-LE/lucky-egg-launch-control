"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import {
  ChevronDown,
  ChevronRight,
  Star,
  CheckCircle2,
  Circle,
  MinusCircle,
  AlertTriangle,
  CalendarDays,
  Package,
  Rocket,
  X,
} from "lucide-react";

type Task = {
  rowNumber: number;
  name: string;
  team: string;
  status: string;
  critical: boolean;
  owner: string;
  dayOffset: number | null;
};
type Sku = {
  sku: string;
  name: string;
  market: string;
  launchDate: string | null;
  arrivalDate: string | null;
  checklist: Task[];
};
type Person = { name: string; team: string };

const TEAM_COLOR: Record<string, string> = {
  Marketplace: "border-indigo-200 bg-indigo-50 text-indigo-700",
  Marketing: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
  Operations: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Other: "border-slate-200 bg-slate-50 text-slate-600",
};

function tierColor(pct: number) {
  if (pct >= 70)
    return {
      bar: "from-emerald-400 to-emerald-600",
      text: "text-emerald-700",
      border: "border-l-emerald-400",
    };
  if (pct >= 35)
    return {
      bar: "from-amber-400 to-amber-600",
      text: "text-amber-700",
      border: "border-l-amber-400",
    };
  return {
    bar: "from-rose-400 to-rose-600",
    text: "text-rose-700",
    border: "border-l-rose-400",
  };
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${d} ${months[parseInt(m, 10) - 1]} ${y}`;
}

function computeReadiness(checklist: Task[], launchDate: string | null) {
  const daysOut = daysUntil(launchDate);
  const applyCritical = daysOut !== null && daysOut <= 90;
  let total = 0, done = 0;
  for (const t of checklist) {
    if (t.status === "N/A") continue;
    const w = applyCritical && t.critical ? 3 : 1;
    total += w;
    if (t.status === "Done") done += w;
  }
  return total ? Math.round((done / total) * 100) : 0;
}

function Pill({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium leading-none ${className}`}
    >
      {children}
    </span>
  );
}

function MeterBar({ pct }: { pct: number }) {
  const c = tierColor(pct);
  return (
    <div className="flex w-36 items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${c.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`w-9 shrink-0 text-right font-mono text-xs font-semibold ${c.text}`}>
        {pct}%
      </span>
    </div>
  );
}

function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="font-mono text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "Done")
    return <CheckCircle2 size={14} className="shrink-0 text-emerald-600" />;
  if (status === "Working on it")
    return <Circle size={14} className="shrink-0 text-sky-500" />;
  if (status === "N/A")
    return <MinusCircle size={14} className="shrink-0 text-slate-300" />;
  return <Circle size={14} className="shrink-0 text-slate-300" />;
}

function TMinusBadge({ days }: { days: number }) {
  if (days < 0)
    return (
      <span className="rounded bg-rose-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-rose-700">
        {-days}d late
      </span>
    );
  if (days <= 14)
    return (
      <span className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-amber-700">
        T-{days}d
      </span>
    );
  if (days <= 30)
    return (
      <span className="rounded bg-sky-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-sky-700">
        T-{days}d
      </span>
    );
  return (
    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-500">
      T-{days}d
    </span>
  );
}

function OwnerDropdown({
  task,
  people,
  onAssign,
}: {
  task: Task;
  people: Person[];
  onAssign: (task: Task, owner: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative ml-auto shrink-0" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`rounded px-1.5 py-0.5 font-mono text-[10px] transition ${
          task.owner
            ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
            : "text-slate-300 hover:bg-slate-100 hover:text-slate-500"
        }`}
      >
        {task.owner || "+ assign"}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 min-w-[140px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {task.owner && (
            <button
              onClick={() => { onAssign(task, ""); setOpen(false); }}
              className="block w-full px-3 py-1.5 text-left text-xs text-slate-400 hover:bg-slate-50"
            >
              Unassign
            </button>
          )}
          {people.map((p) => (
            <button
              key={p.name}
              onClick={() => { onAssign(task, p.name); setOpen(false); }}
              className={`block w-full px-3 py-1.5 text-left text-xs hover:bg-slate-50 ${
                task.owner === p.name ? "font-semibold text-indigo-600" : "text-slate-700"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ChecklistPanel({
  sku,
  onToggle,
  onAssign,
  saving,
  people,
}: {
  sku: Sku;
  onToggle: (task: Task) => void;
  onAssign: (task: Task, owner: string) => void;
  saving: number | null;
  people: Person[];
}) {
  const groups = useMemo(() => {
    const g: Record<string, Task[]> = {};
    for (const t of sku.checklist) {
      const key = ["Marketplace", "Marketing", "Operations"].includes(t.team)
        ? t.team
        : "Other";
      if (!g[key]) g[key] = [];
      g[key].push(t);
    }
    for (const k of Object.keys(g)) {
      g[k].sort((a, b) => (a.status === "Done" ? 1 : 0) - (b.status === "Done" ? 1 : 0));
    }
    return g;
  }, [sku.checklist]);

  const teamOrder = ["Marketplace", "Marketing", "Operations", "Other"].filter(
    (t) => groups[t]?.length
  );

  return (
    <div className="grid gap-4 border-t border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
      {teamOrder.map((teamKey) => {
        const tasks = groups[teamKey];
        const done = tasks.filter((t) => t.status === "Done").length;
        const colorClass =
          TEAM_COLOR[teamKey] ?? "border-slate-200 bg-slate-50 text-slate-600";
        return (
          <div key={teamKey}>
            <div
              className={`mb-2 inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-semibold ${colorClass}`}
            >
              {teamKey}
              <span className="font-mono font-normal">
                {done}/{tasks.length}
              </span>
            </div>
            <ul className="space-y-1">
              {tasks.map((t) => {
                const clickable = t.status !== "N/A";
                return (
                  <li
                    key={t.rowNumber}
                    onClick={() => clickable && onToggle(t)}
                    className={`flex items-center gap-1.5 rounded px-1 py-0.5 text-xs leading-snug text-slate-700 ${
                      clickable ? "cursor-pointer hover:bg-white" : ""
                    } ${saving === t.rowNumber ? "opacity-50" : ""}`}
                  >
                    <StatusIcon status={t.status} />
                    <span
                      className={`flex-1 ${
                        t.status === "Done"
                          ? "text-slate-400 line-through decoration-slate-300"
                          : ""
                      }`}
                    >
                      {t.name}
                      {t.critical && (
                        <Star
                          size={10}
                          className="ml-1 inline -translate-y-0.5 fill-amber-400 text-amber-400"
                        />
                      )}
                    </span>
                    <OwnerDropdown task={t} people={people} onAssign={onAssign} />
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function PreLaunchRow({
  sku,
  onToggle,
  onAssign,
  saving,
  onLaunch,
  people,
}: {
  sku: Sku;
  onToggle: (task: Task) => void;
  onAssign: (task: Task, owner: string) => void;
  saving: number | null;
  onLaunch: (sku: Sku) => void;
  people: Person[];
}) {
  const [open, setOpen] = useState(false);
  const pct = computeReadiness(sku.checklist, sku.launchDate);
  const daysToLaunch = daysUntil(sku.launchDate);
  const critOpen = sku.checklist.filter(
    (t) => t.critical && t.status !== "Done" && t.status !== "N/A"
  ).length;
  const tier = tierColor(pct);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      {/* Row header — split into expand area and action buttons to avoid nested <button> */}
      <div className={`flex items-center border-l-4 ${tier.border}`}>
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex flex-1 items-center gap-3 py-2.5 pl-3 pr-2 text-left"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="truncate text-sm font-bold text-slate-900">{sku.name}</h3>
              <Pill className="border-slate-200 bg-slate-50 font-mono text-slate-500">
                {sku.sku}
              </Pill>
              <Pill
                className={
                  sku.market === "UK"
                    ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                    : "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700"
                }
              >
                {sku.market}
              </Pill>
              {critOpen > 0 && (
                <Pill className="border-amber-300 bg-amber-50 text-amber-700">
                  <AlertTriangle size={9} />
                  {critOpen} critical
                </Pill>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {sku.launchDate ? (
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <CalendarDays size={11} />
                  {formatDate(sku.launchDate)}
                </span>
              ) : (
                <span className="text-xs text-slate-300">No launch date</span>
              )}
              {daysToLaunch !== null && <TMinusBadge days={daysToLaunch} />}
              {sku.arrivalDate && (
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Package size={11} />
                  {formatDate(sku.arrivalDate)}
                </span>
              )}
            </div>
          </div>
          <MeterBar pct={pct} />
          {open ? (
            <ChevronDown size={16} className="shrink-0 text-slate-400" />
          ) : (
            <ChevronRight size={16} className="shrink-0 text-slate-400" />
          )}
        </button>
        <div className="pr-3">
          <button
            onClick={() => onLaunch(sku)}
            className="flex items-center gap-1 rounded border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
          >
            <Rocket size={11} />
            Launch
          </button>
        </div>
      </div>
      {open && <ChecklistPanel sku={sku} onToggle={onToggle} onAssign={onAssign} saving={saving} people={people} />}
    </div>
  );
}

function LaunchModal({
  sku,
  onConfirm,
  onCancel,
  launching,
  error,
}: {
  sku: Sku;
  onConfirm: () => void;
  onCancel: () => void;
  launching: boolean;
  error: string | null;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Mark as Launched</h2>
            </div>
          <button
            onClick={onCancel}
            className="ml-4 shrink-0 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mb-4 rounded-lg border border-slate-100 bg-slate-50 p-3">
          <p className="font-semibold text-slate-800">{sku.name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-xs text-slate-400">{sku.sku}</span>
            <span
              className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
                sku.market === "UK"
                  ? "bg-indigo-50 text-indigo-700"
                  : "bg-fuchsia-50 text-fuchsia-700"
              }`}
            >
              {sku.market}
            </span>
            {sku.launchDate && (
              <span className="text-xs text-slate-400">· {formatDate(sku.launchDate)}</span>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-3 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={launching}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={launching}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            <Rocket size={13} />
            {launching ? "Launching…" : "Confirm launch"}
          </button>
        </div>
      </div>
    </div>
  );
}

function MarketGroup({
  title,
  skus,
  toggleTask,
  assignTask,
  saving,
  onLaunch,
  people,
}: {
  title: string;
  skus: Sku[];
  toggleTask: (sku: Sku, task: Task) => void;
  assignTask: (sku: Sku, task: Task, owner: string) => void;
  saving: number | null;
  onLaunch: (sku: Sku) => void;
  people: Person[];
}) {
  if (!skus.length) return null;
  return (
    <div className="mb-5">
      <div className="mb-2 flex items-center gap-2 px-0.5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">{title}</h2>
        <span className="font-mono text-xs text-slate-300">{skus.length}</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>
      <div className="space-y-1.5">
        {skus.map((s) => (
          <PreLaunchRow
            key={`${s.sku}-${s.market}`}
            sku={s}
            onToggle={(task) => toggleTask(s, task)}
            onAssign={(task, owner) => assignTask(s, task, owner)}
            saving={saving}
            onLaunch={onLaunch}
            people={people}
          />
        ))}
      </div>
    </div>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="border-b border-slate-200 bg-white px-8 py-4">
        <h1 className="text-lg font-bold text-slate-900">Pre-Launch</h1>
      </div>
      <div className="mx-auto max-w-5xl px-8 py-6">{children}</div>
    </>
  );
}

export default function PreLaunchPage() {
  const [skus, setSkus] = useState<Sku[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [market, setMarket] = useState<"All" | "UK" | "US">("All");
  const [saving, setSaving] = useState<number | null>(null);
  const [launchConfirm, setLaunchConfirm] = useState<Sku | null>(null);
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSkus(data.skus);
      setPeople(data.people ?? []);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleTask(sku: Sku, task: Task) {
    const nextStatus = task.status === "Done" ? "Not started" : "Done";
    setSaving(task.rowNumber);
    setSkus((prev) =>
      prev.map((s) =>
        s.sku === sku.sku && s.market === sku.market
          ? {
              ...s,
              checklist: s.checklist.map((t) =>
                t.rowNumber === task.rowNumber ? { ...t, status: nextStatus } : t
              ),
            }
          : s
      )
    );
    try {
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rowNumber: task.rowNumber, status: nextStatus }),
      });
    } catch {
      load();
    } finally {
      setSaving(null);
    }
  }

  async function assignTask(sku: Sku, task: Task, owner: string) {
    setSkus((prev) =>
      prev.map((s) =>
        s.sku === sku.sku && s.market === sku.market
          ? { ...s, checklist: s.checklist.map((t) => t.rowNumber === task.rowNumber ? { ...t, owner } : t) }
          : s
      )
    );
    try {
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rowNumber: task.rowNumber, owner }),
      });
    } catch {
      load();
    }
  }

  async function handleLaunch() {
    if (!launchConfirm) return;
    setLaunching(true);
    setLaunchError(null);
    try {
      const res = await fetch("/api/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: launchConfirm.sku,
          name: launchConfirm.name,
          market: launchConfirm.market,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Launch failed");
      setSkus((prev) =>
        prev.filter(
          (s) => !(s.sku === launchConfirm.sku && s.market === launchConfirm.market)
        )
      );
      setLaunchConfirm(null);
    } catch (e: any) {
      setLaunchError(e.message);
    } finally {
      setLaunching(false);
    }
  }

  const uniqueSkuCount = new Set(skus.map((s) => s.sku)).size;

  const launchesLate = skus.filter((s) => {
    const d = daysUntil(s.launchDate);
    return d !== null && d < 0;
  }).length;

  const launchingThisWeek = skus.filter((s) => {
    const d = daysUntil(s.launchDate);
    return d !== null && d >= 0 && d <= 7;
  }).length;

  const byMarket = (m: string) =>
    skus
      .filter((s) => s.market === m)
      .sort((a, b) => {
        if (!a.launchDate && !b.launchDate) return 0;
        if (!a.launchDate) return 1;
        if (!b.launchDate) return -1;
        return a.launchDate.localeCompare(b.launchDate);
      });

  if (loading)
    return (
      <PageShell>
        <div className="text-sm text-slate-500">Loading from Google Sheet…</div>
      </PageShell>
    );

  if (error)
    return (
      <PageShell>
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          Couldn't load the sheet: {error}. Check the service account has Editor access and
          the env vars are set.
        </div>
      </PageShell>
    );

  return (
    <>
      {launchConfirm && (
        <LaunchModal
          sku={launchConfirm}
          onConfirm={handleLaunch}
          onCancel={() => {
            setLaunchConfirm(null);
            setLaunchError(null);
          }}
          launching={launching}
          error={launchError}
        />
      )}
      <PageShell>
        <div className="mb-5 grid grid-cols-3 gap-3">
          <StatCard value={uniqueSkuCount} label="Unique SKUs in pipeline" />
          <StatCard value={launchesLate} label="Launches running late" />
          <StatCard value={launchingThisWeek} label="Launching within 7 days" />
        </div>

        <div className="mb-4 flex gap-2">
          {(["All", "UK", "US"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMarket(m)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                market === m
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {market === "All" ? (
          <>
            <MarketGroup
              title="United Kingdom"
              skus={byMarket("UK")}
              toggleTask={toggleTask}
              assignTask={assignTask}
              saving={saving}
              onLaunch={setLaunchConfirm}
              people={people}
            />
            <MarketGroup
              title="United States"
              skus={byMarket("US")}
              toggleTask={toggleTask}
              assignTask={assignTask}
              saving={saving}
              onLaunch={setLaunchConfirm}
              people={people}
            />
          </>
        ) : (
          <MarketGroup
            title={market === "UK" ? "United Kingdom" : "United States"}
            skus={byMarket(market)}
            toggleTask={toggleTask}
            assignTask={assignTask}
            saving={saving}
            onLaunch={setLaunchConfirm}
            people={people}
          />
        )}
      </PageShell>
    </>
  );
}
