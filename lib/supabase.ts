import { createClient } from "@supabase/supabase-js";

// Ces valeurs viennent UNIQUEMENT des variables d'environnement.
// Ne jamais coder une clé en dur ici, même pour tester.
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

function validateUrl(url: string, varName: string) {
  if (!url) throw new Error(`${varName} est vide ou absente sur Vercel.`);
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)) {
    throw new Error(
      `${varName} a une valeur invalide ("${url}"). Attendu un format exact comme https://xxxxxxxxxxxx.supabase.co ` +
        `(sans slash final, sans espace, sans guillemets). Recopie-la depuis Supabase → Project Settings → API → Project URL.`
    );
  }
}

export function getSupabaseClient() {
  validateUrl(supabaseUrl, "NEXT_PUBLIC_SUPABASE_URL");
  if (!supabaseAnonKey) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY est vide ou absente sur Vercel.");
  return createClient(supabaseUrl, supabaseAnonKey);
}

// Client "service role" — UNIQUEMENT utilisé côté serveur (routes API), jamais exposé au navigateur.
export function getSupabaseServiceClient() {
  const url = (process.env.SUPABASE_URL ?? supabaseUrl ?? "").trim();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();

  validateUrl(url, "SUPABASE_URL");
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY est vide ou absente sur Vercel.");
  if (serviceKey.length < 100) {
    throw new Error(
      `SUPABASE_SERVICE_ROLE_KEY semble tronquée (${serviceKey.length} caractères, une vraie clé service_role est bien plus longue). Recopie-la en entier depuis Supabase.`
    );
  }

  return createClient(url, serviceKey, { auth: { persistSession: false } });
}
