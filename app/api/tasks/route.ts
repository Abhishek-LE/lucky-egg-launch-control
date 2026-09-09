import { NextResponse } from "next/server";
import { getSkuTasks, getLaunchDates, getPeople, updateTaskStatus, updateTaskOwner } from "@/lib/sheets";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic"; // always fetch fresh from the Sheet, never cache

export async function GET() {
  try {
    const [rows, launchDates, people] = await Promise.all([getSkuTasks(), getLaunchDates(), getPeople()]);

    // Build a set of SKUs that are already in post-launch (non-placeholder rows).
    // If Supabase is unavailable, fall back to showing everything.
    let launchedSet = new Set<string>();
    try {
      const { data } = await getSupabaseServerClient()
        .from("post_launch_skus")
        .select("sku, market")
        .eq("is_placeholder", false);
      launchedSet = new Set((data ?? []).map((r: any) => `${r.sku}-${r.market}`));
    } catch {
      // non-fatal — show all pre-launch SKUs if Supabase is down
    }

    // Group flat rows into one object per SKU, matching the shape the UI needs
    const bySku = new Map<string, any>();
    for (const r of rows) {
      const key = `${r.sku}-${r.market}`;
      if (launchedSet.has(key)) continue;
      if (!bySku.has(key)) {
        const dates = launchDates.get(`${r.sku}:${r.market}`);
        bySku.set(key, {
          sku: r.sku,
          name: r.product,
          market: r.market,
          launchDate: dates?.launchDate ?? null,
          arrivalDate: dates?.arrivalDate ?? null,
          checklist: [],
        });
      }
      bySku.get(key).checklist.push({
        rowNumber: r.rowNumber,
        name: r.task,
        team: r.team,
        status: r.status,
        critical: r.critical,
        owner: r.owner,
        dayOffset: r.dayOffset,
      });
    }

    return NextResponse.json({ skus: Array.from(bySku.values()), people });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { rowNumber } = body;
    if (!rowNumber) {
      return NextResponse.json({ error: "rowNumber is required" }, { status: 400 });
    }
    if (body.status !== undefined) {
      await updateTaskStatus(rowNumber, body.status);
    } else if (body.owner !== undefined) {
      await updateTaskOwner(rowNumber, body.owner);
    } else {
      return NextResponse.json({ error: "status or owner is required" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
