import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

function checkAuth(req: NextRequest) {
  const auth = req.headers.get("x-bridge-secret");
  return Boolean(process.env.BRIDGE_SECRET) && auth === process.env.BRIDGE_SECRET;
}

/** Le pont récupère ici les positions validées (status=approved) et pas encore prises en charge. */
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const supabase = getSupabaseServiceClient();

  const { data: jobs, error } = await supabase
    .from("positions")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: true })
    .limit(5);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!jobs || jobs.length === 0) return NextResponse.json({ jobs: [] });

  // On marque immédiatement ces jobs "dispatched" pour éviter qu'un second
  // passage du pont (ou un redémarrage) ne les prenne deux fois.
  const ids = jobs.map((j) => j.id);
  await supabase.from("positions").update({ status: "dispatched" }).in("id", ids);

  return NextResponse.json({ jobs });
}

/** Le pont poste ici le résultat de l'exécution (succès avec ticket, ou échec). */
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const supabase = getSupabaseServiceClient();

  const patch: Record<string, unknown> =
    body.status === "open"
      ? { status: "open", mt5_ticket: body.ticket, mt5_symbol: body.mt5Symbol }
      : { status: "failed", error_message: body.error };

  const { error } = await supabase.from("positions").update(patch).eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
