import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { DEFAULT_RISK } from "@/lib/risk";

export async function GET() {
  try {
    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase.from("settings").select("*").eq("id", "default").maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({
      settings: data?.risk ?? DEFAULT_RISK,
      // On renvoie le login/serveur (utile pour vérifier quel compte est actif),
      // JAMAIS le mot de passe.
      mt5Login: data?.mt5_login ?? null,
      mt5Server: data?.mt5_server ?? null
    });
  } catch (err: any) {
    return NextResponse.json({ settings: DEFAULT_RISK, mt5Login: null, warning: err.message });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const supabase = getSupabaseServiceClient();

  const payload: Record<string, unknown> = {
    id: "default",
    risk: body.risk,
    updated_at: new Date().toISOString()
  };

  // Identifiants MT5 : stockés côté serveur uniquement, jamais renvoyés en clair.
  if (body.mt5?.login && body.mt5?.password && body.mt5?.server) {
    payload.mt5_login = body.mt5.login;
    payload.mt5_password = body.mt5.password;
    payload.mt5_server = body.mt5.server;
  }

  const { error } = await supabase.from("settings").upsert(payload, { onConflict: "id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
