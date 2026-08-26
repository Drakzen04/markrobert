import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { aiPostTradeReview } from "@/lib/ai/roles";

export async function GET() {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("positions")
    .select("*")
    .eq("status", "closed")
    .order("closed_at", { ascending: false })
    .limit(30);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const review = await aiPostTradeReview(data ?? []);
  return NextResponse.json({ review, tradesAnalyzed: data?.length ?? 0 });
}
