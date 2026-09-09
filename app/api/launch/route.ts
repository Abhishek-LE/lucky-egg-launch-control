import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { sku, name, market } = await request.json();
    if (!sku || !name || !market) {
      return NextResponse.json(
        { error: "sku, name, and market are required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();
    const today = new Date().toISOString().split("T")[0];

    const { data: existing } = await supabase
      .from("post_launch_skus")
      .select("id")
      .eq("sku", sku)
      .eq("market", market)
      .eq("is_placeholder", false)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "SKU already in post-launch" }, { status: 409 });
    }

    const { error } = await supabase.from("post_launch_skus").insert({
      sku,
      product: name,
      market,
      launch_date: today,
      days_since_launch: 0,
      is_placeholder: false,
    });

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { sku, market } = await request.json();
    if (!sku || !market) {
      return NextResponse.json({ error: "sku and market are required" }, { status: 400 });
    }
    const supabase = getSupabaseServerClient();
    const { error } = await supabase
      .from("post_launch_skus")
      .delete()
      .eq("sku", sku)
      .eq("market", market)
      .eq("is_placeholder", false);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
