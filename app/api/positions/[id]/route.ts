import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const supabase = getSupabaseServiceClient();

  // action attendue: "approve" | "reject" | "close"
  const patch: Record<string, unknown> = {};
  if (body.action === "approve") patch.status = "approved"; // mis en file pour le pont MT5
  if (body.action === "reject") patch.status = "rejected";
  if (body.action === "close") {
    // La clôture réelle se fait sur MT5 (manuellement ou via une future commande
    // au pont) ; ici on marque juste le suivi côté dashboard une fois clôturé côté broker.
    patch.status = "closed";
    patch.result_pct = body.resultPct ?? null;
    patch.closed_at = new Date().toISOString();
  }

  const { data, error } = await supabase.from("positions").update(patch).eq("id", params.id).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ position: data });
}
