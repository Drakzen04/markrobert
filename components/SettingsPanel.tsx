"use client";

import { useEffect, useState } from "react";
import { X, ShieldCheck, Wifi, WifiOff } from "lucide-react";
import type { RiskSettings } from "@/lib/risk";
import { DEFAULT_RISK } from "@/lib/risk";

export default function SettingsPanel({ onClose }: { onClose: () => void }) {
  const [risk, setRisk] = useState<RiskSettings>(DEFAULT_RISK);
  const [mt5Login, setMt5Login] = useState("");
  const [mt5Password, setMt5Password] = useState("");
  const [mt5Server, setMt5Server] = useState("");
  const [currentMt5Login, setCurrentMt5Login] = useState<string | null>(null);
  const [currentMt5Server, setCurrentMt5Server] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function loadSettings() {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) setRisk(data.settings);
        setCurrentMt5Login(data.mt5Login ?? null);
        setCurrentMt5Server(data.mt5Server ?? null);
      });
  }

  useEffect(loadSettings, []);

  async function save() {
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        risk,
        mt5: mt5Login && mt5Password && mt5Server ? { login: mt5Login, password: mt5Password, server: mt5Server } : undefined
      })
    });
    setSaved(true);
    setMt5Login("");
    setMt5Password("");
    setMt5Server("");
    setTimeout(() => setSaved(false), 2000);
    loadSettings();
  }

  return (
    <div className="fixed inset-0 bg-ink/85 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-panel border border-line rounded-2xl w-full max-w-lg shadow-2xl my-8">
        <div className="flex items-center justify-between p-5 border-b border-line">
          <h2 className="font-display text-lg text-paper">Réglages</h2>
          <button onClick={onClose} className="text-muted hover:text-paper p-1 rounded-lg hover:bg-panel2">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Compte MT5 — en premier, c'est le plus important */}
          <div className="rounded-xl border border-gold/30 bg-gold/5 p-4 space-y-3">
            <div className="flex items-center gap-2">
              {currentMt5Login ? <Wifi size={16} className="text-buy" /> : <WifiOff size={16} className="text-sell" />}
              <span className="text-sm font-medium text-paper">Compte Exness (MT5)</span>
            </div>
            <p className="text-xs text-muted">
              {currentMt5Login ? (
                <>
                  Actuellement configuré : <span className="text-paper font-mono">{currentMt5Login}</span> sur{" "}
                  <span className="text-paper font-mono">{currentMt5Server}</span>.
                </>
              ) : (
                "Aucun compte configuré."
              )}{" "}
              Change ces valeurs pour switcher de compte — le pont sur ton PC les récupère automatiquement.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Login (ex. 476631487)"
                value={mt5Login}
                onChange={(e) => setMt5Login(e.target.value)}
                className="bg-panel2 border border-line rounded-lg px-3 py-2 text-sm text-paper focus:border-gold outline-none"
              />
              <input
                type="text"
                placeholder="Serveur (ex. Exness-MT5Trial9)"
                value={mt5Server}
                onChange={(e) => setMt5Server(e.target.value)}
                className="bg-panel2 border border-line rounded-lg px-3 py-2 text-sm text-paper focus:border-gold outline-none"
              />
            </div>
            <input
              type="password"
              placeholder="Nouveau mot de passe trader"
              value={mt5Password}
              onChange={(e) => setMt5Password(e.target.value)}
              className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-sm text-paper focus:border-gold outline-none"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted">
              <ShieldCheck size={13} /> Gestion du risque
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Risque par trade (%)">
                <input
                  type="number"
                  step="0.1"
                  value={risk.riskPerTradePct}
                  onChange={(e) => setRisk({ ...risk, riskPerTradePct: Number(e.target.value) })}
                  className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-sm text-paper focus:border-gold outline-none"
                />
              </Field>
              <Field label="Perte journalière max (%)">
                <input
                  type="number"
                  step="0.1"
                  value={risk.dailyLossLimitPct}
                  onChange={(e) => setRisk({ ...risk, dailyLossLimitPct: Number(e.target.value) })}
                  className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-sm text-paper focus:border-gold outline-none"
                />
              </Field>
              <Field label="Positions simultanées max">
                <input
                  type="number"
                  value={risk.maxConcurrentPositions}
                  onChange={(e) => setRisk({ ...risk, maxConcurrentPositions: Number(e.target.value) })}
                  className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-sm text-paper focus:border-gold outline-none"
                />
              </Field>
              <Field label="Étoiles minimum (≥4)">
                <input
                  type="number"
                  min={4}
                  max={5}
                  value={risk.minStars}
                  onChange={(e) => setRisk({ ...risk, minStars: Math.max(4, Number(e.target.value)) })}
                  className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-sm text-paper focus:border-gold outline-none"
                />
              </Field>
            </div>
        </div>

        <div className="flex justify-end items-center gap-3 p-5 border-t border-line">
          {saved && <span className="text-xs text-buy">Enregistré.</span>}
          <button onClick={save} className="px-5 py-2 bg-gold text-ink text-sm font-medium rounded-lg hover:bg-gold2 transition-colors">
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs text-muted">{label}</span>
      {children}
    </label>
  );
}
