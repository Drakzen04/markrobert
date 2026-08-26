import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

/**
 * Le pont Python (sur ton PC) appelle cette route toutes les quelques minutes
 * pour récupérer les identifiants MT5 à jour — ça permet de changer de compte
 * depuis le dashboard sans toucher au code du pont.
 * Protégé par BRIDGE_SECRET (à définir aussi bien sur Vercel que sur ton PC).
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("x-bridge-secret");
  if (!process.env.BRIDGE_SECRET || auth !== process.env.BRIDGE_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let data;
  try {
    const supabase = getSupabaseServiceClient();
    const result = await supabase.from("settings").select("mt5_login, mt5_password, mt5_server").eq("id", "default").maybeSingle();
    if (result.error) throw new Error(result.error.message);
    data = result.data;
  } catch (err: any) {
    return NextResponse.json({ error: `Erreur Supabase : ${err.message}` }, { status: 500 });
  }
  if (!data?.mt5_login || !data?.mt5_password || !data?.mt5_server) {
    return NextResponse.json({ error: "Identifiants MT5 non configurés dans les Réglages du dashboard." }, { status: 404 });
  }

  return NextResponse.json({
    login: data.mt5_login,
    password: data.mt5_password,
    server: data.mt5_server
  });
}
