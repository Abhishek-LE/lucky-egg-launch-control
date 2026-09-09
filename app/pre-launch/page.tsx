"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Star, CheckCircle2, Circle, MinusCircle } from "lucide-react";

type Task = {
  rowNumber: number;
  name: string;
  team: string;
  status: string;
  critical: boolean;
  owner: string;
  dayOffset: number | null;
};
type Sku = { sku: string; name: string; market: string; checklist: Task[] };

function tierColor(pct: number) {
  if (pct >= 70) return "text-emerald-700 from-emerald-400 to-emerald-600";
  if (pct >= 35) return "text-amber-700 from-amber-400 to-amber-600";
  return "text-rose-700 from-rose-400 to-rose-600";
}

function computeReadiness(checklist: Task[]) {
  let total = 0,
    done = 0;
  for (const t of checklist) {
    if (t.status === "N/A") continue;
    const w = t.critical ? 3 : 1;
    total += w;
    if (t.status === "Done") done += w;
  }
  return total ? Math.round((done / total) * 100) : 0;
}

export default function PreLaunchPage() {
  const [skus, setSkus] = useState<Sku[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSkus(data.skus);
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
    // optimistic update
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
    } catch (e) {
      // revert on failure, then reload from source of truth
      load();
    } finally {
      setSaving(null);
    }
  }

  if (loading) return <div className="text-sm text-slate-500">Loading from Google Sheet…</div>;
  if (error)
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        Couldn't load the sheet: {error}. Check the service account has Editor access and the env
        vars are set.
      </div>
    );

  return (
    <div>
      <h1 className="mb-4 text-lg font-bold text-slate-900">Pre-Launch</h1>
      <div className="space-y-2">
        {skus.map((s) => {
          const key = `${s.sku}-${s.market}`;
          const pct = computeReadiness(s.checklist);
          const tone = tierColor(pct);
          const isOpen = !!open[key];
          return (
            <div key={key} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <button
                onClick={() => setOpen((o) => ({ ...o, [key]: !o[key] }))}
                className="flex w-full items-center gap-3 border-l-4 py-2.5 pl-3 pr-4 text-left"
                style={{ borderLeftColor: pct >= 70 ? "#34d399" : pct >= 35 ? "#fbbf24" : "#fb7185" }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-slate-900">{s.name}</h3>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-mono text-slate-500">
                      {s.sku}
                    </span>
                    <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">
                      {s.market}
                    </span>
                  </div>
                </div>
                <span className={`font-mono text-sm font-semibold ${tone.split(" ")[0]}`}>{pct}%</span>
                {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              {isOpen && (
                <div className="border-t border-slate-200 bg-slate-50 p-4">
                  <ul className="space-y-1">
                    {s.checklist.map((t) => (
                      <li
                        key={t.rowNumber}
                        onClick={() => t.status !== "N/A" && toggleTask(s, t)}
                        className={`flex items-center gap-1.5 rounded px-1 py-0.5 text-xs text-slate-700 ${
                          t.status !== "N/A" ? "cursor-pointer hover:bg-white" : ""
                        } ${saving === t.rowNumber ? "opacity-50" : ""}`}
                      >
                        {t.status === "Done" ? (
                          <CheckCircle2 size={14} className="text-emerald-600" />
                        ) : t.status === "N/A" ? (
                          <MinusCircle size={14} className="text-slate-300" />
                        ) : (
                          <Circle size={14} className="text-slate-300" />
                        )}
                        <span className={t.status === "Done" ? "text-slate-400 line-through" : ""}>
                          {t.name}
                        </span>
                        {t.critical && (
                          <Star size={9} className="fill-amber-400 text-amber-400" />
                        )}
                        <span className="ml-auto font-mono text-[10px] text-slate-400">
                          {t.owner}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
