import { NextResponse } from "next/server";
import { getSkuTasks, updateTaskStatus } from "@/lib/sheets";

export const dynamic = "force-dynamic"; // always fetch fresh from the Sheet, never cache

export async function GET() {
  try {
    const rows = await getSkuTasks();

    // Group flat rows into one object per SKU, matching the shape the UI needs
    const bySku = new Map<string, any>();
    for (const r of rows) {
      const key = `${r.sku}-${r.market}`;
      if (!bySku.has(key)) {
        bySku.set(key, {
          sku: r.sku,
          name: r.product,
          market: r.market,
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

    return NextResponse.json({ skus: Array.from(bySku.values()) });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { rowNumber, status } = await request.json();
    if (!rowNumber || !status) {
      return NextResponse.json({ error: "rowNumber and status are required" }, { status: 400 });
    }
    await updateTaskStatus(rowNumber, status);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
