"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, RotateCcw, X } from "lucide-react";

type PostLaunchSku = {
  id: number;
  sku: string;
  product: string;
  market: string;
  launch_date: string;
  days_since_launch: number;
  amazon_stage: number | null;
  tiktok_stage: number | null;
  rating: number | null;
  review_count: number | null;
  lifetime_sales: number | null;
  is_placeholder: boolean;
};

function UndoModal({
  sku,
  onConfirm,
  onCancel,
  undoing,
  error,
}: {
  sku: PostLaunchSku;
  onConfirm: () => void;
  onCancel: () => void;
  undoing: boolean;
  error: string | null;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Undo Launch</h2>
            <p className="mt-0.5 text-xs text-slate-400">This will move the SKU back to Pre-Launch.</p>
          </div>
          <button
            onClick={onCancel}
            className="ml-4 shrink-0 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mb-4 rounded-lg border border-slate-100 bg-slate-50 p-3">
          <p className="font-semibold text-slate-800">{sku.product}</p>
          <div className="mt-1 flex items-center gap-1.5">
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
            <span className="text-xs text-slate-400">· launched {sku.launch_date}</span>
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
            disabled={undoing}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={undoing}
            className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
          >
            <RotateCcw size={13} />
            {undoing ? "Undoing…" : "Undo launch"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PostLaunchPage() {
  const [skus, setSkus] = useState<PostLaunchSku[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [undoConfirm, setUndoConfirm] = useState<PostLaunchSku | null>(null);
  const [undoing, setUndoing] = useState(false);
  const [undoError, setUndoError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/postlaunch")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setSkus(data.skus);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleUndo() {
    if (!undoConfirm) return;
    setUndoing(true);
    setUndoError(null);
    try {
      const res = await fetch("/api/launch", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku: undoConfirm.sku, market: undoConfirm.market }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Undo failed");
      setSkus((prev) => prev.filter((s) => s.id !== undoConfirm.id));
      setUndoConfirm(null);
    } catch (e: any) {
      setUndoError(e.message);
    } finally {
      setUndoing(false);
    }
  }

  const shell = (content: React.ReactNode) => (
    <>
      <div className="border-b border-slate-200 bg-white px-8 py-4">
        <h1 className="text-lg font-bold text-slate-900">Post-Launch</h1>
      </div>
      <div className="mx-auto max-w-5xl px-8 py-6">{content}</div>
    </>
  );

  if (loading) return shell(<div className="text-sm text-slate-500">Loading from Supabase…</div>);
  if (error)
    return shell(
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        Couldn't load Supabase: {error}. Check the schema is set up and env vars are set.
      </div>
    );

  return (
    <>
      {undoConfirm && (
        <UndoModal
          sku={undoConfirm}
          onConfirm={handleUndo}
          onCancel={() => { setUndoConfirm(null); setUndoError(null); }}
          undoing={undoing}
          error={undoError}
        />
      )}
      {shell(
        <div>
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
            <AlertTriangle size={14} className="shrink-0" />
            SKU names, markets, and launch dates are real. Stage, rating, and sales figures are empty
            until Nova/Neon data is wired in — rows marked "awaiting data" below.
          </div>
          <div className="space-y-2">
            {skus.map((s) => (
              <div key={s.id} className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">{s.product}</h3>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-xs text-slate-500">
                    {s.sku}
                  </span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs ${
                      s.market === "UK"
                        ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                        : "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700"
                    }`}
                  >
                    {s.market}
                  </span>
                  {s.is_placeholder ? (
                    <span className="ml-auto rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-700">
                      Awaiting data
                    </span>
                  ) : (
                    <button
                      onClick={() => setUndoConfirm(s)}
                      className="ml-auto flex items-center gap-1 rounded border border-slate-200 px-2 py-0.5 text-xs text-slate-400 hover:border-slate-300 hover:text-slate-600"
                    >
                      <RotateCcw size={11} />
                      Undo launch
                    </button>
                  )}
                </div>
                <div className="mt-1 font-mono text-xs text-slate-400">
                  Launched {s.launch_date} · Day {s.days_since_launch}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
