import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

export async function GET() {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("positions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ positions: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from("positions")
    .insert({
      symbol: body.symbol,
      direction: body.direction,
      entry: body.entry,
      stop_loss: body.stopLoss,
      take_profit: body.takeProfit,
      stars: body.stars,
      mode: body.mode, // "auto" | "manual"
      status: body.mode === "auto" ? "approved" : "pending_approval",
      strategy_mode: body.strategyMode,
      narrative: body.narrative,
      is_simulation: false
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ position: data });
}
