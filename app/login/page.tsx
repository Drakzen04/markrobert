"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      const json = await res.json();
      setError(json.error ?? "Erreur de connexion.");
    }
  }

  return (
    <main className="min-h-screen bg-ink flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-panel border border-line rounded-lg p-6 w-full max-w-sm space-y-4">
        <h1 className="font-display text-xl text-paper">Casper Bot</h1>
        <p className="text-xs text-muted">Accès protégé — ce dashboard pilote un compte de trading réel.</p>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mot de passe"
          className="w-full bg-panel2 border border-line rounded px-3 py-2 text-sm text-paper"
        />
        {error && <p className="text-xs text-sell">{error}</p>}
        <button type="submit" className="w-full py-2 rounded bg-gold text-ink text-sm font-medium">
          Entrer
        </button>
      </form>
    </main>
  );
}
