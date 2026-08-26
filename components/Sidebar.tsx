"use client";

import { LineChart, Settings, Wifi, WifiOff } from "lucide-react";

type Props = {
  mt5Login: string | null;
  onOpenSettings: () => void;
};

export default function Sidebar({ mt5Login, onOpenSettings }: Props) {
  return (
    <aside className="w-64 shrink-0 border-r border-line bg-panel flex flex-col h-screen sticky top-0">
      <div className="p-5 border-b border-line">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gold/15 flex items-center justify-center">
            <LineChart size={16} className="text-gold" />
          </div>
          <div>
            <h1 className="font-display text-base text-paper leading-tight">Casper Bot</h1>
            <p className="text-[10px] uppercase tracking-widest text-muted">Analyse par capture</p>
          </div>
        </div>
      </div>

      <div className="p-5">
        <p className="text-xs text-paper/70 leading-relaxed">
          Dépose une capture de graphique pour obtenir une analyse selon la grille 5 étoiles order block / ICT.
        </p>
      </div>

      <div className="p-5 mt-auto space-y-3">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 rounded-lg border border-line bg-panel2 px-3 py-3 text-left hover:border-gold/40 transition-colors"
        >
          {mt5Login ? <Wifi size={16} className="text-buy shrink-0" /> : <WifiOff size={16} className="text-sell shrink-0" />}
          <div className="min-w-0">
            <p className="text-xs text-paper truncate">{mt5Login ?? "Aucun compte MT5"}</p>
            <p className="text-[10px] text-muted">{mt5Login ? "Compte configuré" : "À configurer"}</p>
          </div>
        </button>

        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted hover:text-paper hover:bg-panel2 transition-colors"
        >
          <Settings size={15} />
          Réglages
        </button>
      </div>
    </aside>
  );
}
