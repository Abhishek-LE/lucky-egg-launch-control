"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

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

export default function PostLaunchPage() {
  const [skus, setSkus] = useState<PostLaunchSku[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/postlaunch")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setSkus(data.skus);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-sm text-slate-500">Loading from Supabase…</div>;
  if (error)
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        Couldn't load Supabase: {error}. Check the schema is set up and env vars are set.
      </div>
    );

  return (
    <div>
      <h1 className="mb-4 text-lg font-bold text-slate-900">Post-Launch</h1>
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
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-mono text-slate-500">
                {s.sku}
              </span>
              <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">
                {s.market}
              </span>
              {s.is_placeholder && (
                <span className="ml-auto rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-700">
                  Awaiting data
                </span>
              )}
            </div>
            <div className="mt-1 font-mono text-xs text-slate-400">
              Launched {s.launch_date} · Day {s.days_since_launch}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
