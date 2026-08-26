"use client";

import { Star, TrendingUp, TrendingDown, Minus, Check, X, AlertTriangle, ShieldAlert } from "lucide-react";
import type { ChartAnalysis } from "@/lib/ai/roles";

export type { ChartAnalysis };

function StarRow({ stars }: { stars: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={16} className={n <= stars ? "fill-gold text-gold" : "text-line"} />
      ))}
    </div>
  );
}

const CONFIDENCE_LABEL: Record<ChartAnalysis["confidence"], string> = {
  low: "Lecture peu fiable",
  medium: "Lecture correcte",
  high: "Lecture fiable"
};

export default function AnalysisPanel({
  analysis,
  entry,
  stopLoss,
  takeProfit,
  onEntryChange,
  onStopLossChange,
  onTakeProfitChange,
  macroEvent,
  aiSafetyReview,
  aiNarrative
}: {
  analysis: ChartAnalysis | null;
  entry: string;
  stopLoss: string;
  takeProfit: string;
  onEntryChange: (v: string) => void;
  onStopLossChange: (v: string) => void;
  onTakeProfitChange: (v: string) => void;
  macroEvent?: string | null;
  aiSafetyReview?: { concern: boolean; note: string } | null;
  aiNarrative?: string | null;
}) {
  if (!analysis) {
    return (
      <div className="p-8 text-center text-muted text-sm">
        Dépose une capture de graphique pour lancer l'analyse.
      </div>
    );
  }

  const DirIcon = analysis.direction === "bullish" ? TrendingUp : analysis.direction === "bearish" ? TrendingDown : Minus;
  const dirColor = analysis.direction === "bullish" ? "text-buy" : analysis.direction === "bearish" ? "text-sell" : "text-muted";
  const dirLabel = analysis.direction === "bullish" ? "Achat" : analysis.direction === "bearish" ? "Vente" : "Neutre";

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DirIcon size={18} className={dirColor} />
          <span className={`text-sm font-medium ${dirColor}`}>{dirLabel}</span>
        </div>
        <span className="text-[10px] uppercase tracking-widest text-muted bg-panel2 px-2 py-1 rounded">
          {CONFIDENCE_LABEL[analysis.confidence]}
        </span>
      </div>

      <p className="text-sm text-paper/90 leading-relaxed">{analysis.narrative}</p>
      {aiNarrative && <p className="text-sm text-muted italic leading-relaxed border-l-2 border-line pl-3">{aiNarrative}</p>}

      <div className="flex items-center justify-between border-t border-line pt-4">
        <span className="text-[10px] uppercase tracking-widest text-muted">Score order block</span>
        <StarRow stars={analysis.stars} />
      </div>

      {analysis.criteria.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted mb-2">Checklist (méthode Casper)</div>
          <ul className="space-y-2">
            {analysis.criteria.map((c, i) => (
              <li key={i} className="flex gap-2 text-sm">
                {c.met ? (
                  <Check size={15} className="text-buy shrink-0 mt-0.5" />
                ) : (
                  <X size={15} className="text-sell shrink-0 mt-0.5" />
                )}
                <span className="text-paper/85">
                  <span className="font-medium">{c.name}</span> — {c.detail}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <div className="text-[10px] uppercase tracking-widest text-muted mb-2 flex items-center gap-1">
          Niveaux (éditables avant validation)
        </div>
        <div className="grid grid-cols-3 gap-2">
          <LevelInput label="Entrée" value={entry} onChange={onEntryChange} />
          <LevelInput label="Stop loss" value={stopLoss} onChange={onStopLossChange} accent="text-sell" />
          <LevelInput label="Take profit" value={takeProfit} onChange={onTakeProfitChange} accent="text-buy" />
        </div>
        {analysis.confidence === "low" && (
          <p className="text-[10px] text-gold mt-2">
            Lecture de prix peu fiable sur cette image — vérifie et corrige ces valeurs avant d'envoyer en validation.
          </p>
        )}
      </div>

      {macroEvent && (
        <div className="flex items-start gap-2 rounded-lg border border-gold/40 bg-gold/10 p-3 text-sm text-gold">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span>Annonce macro à fort impact proche : {macroEvent}</span>
        </div>
      )}

      {aiSafetyReview?.concern && (
        <div className="flex items-start gap-2 rounded-lg border border-gold/40 bg-gold/10 p-3 text-sm text-gold">
          <ShieldAlert size={16} className="shrink-0 mt-0.5" />
          <span>Filtre IA : {aiSafetyReview.note}</span>
        </div>
      )}
    </div>
  );
}

function LevelInput({
  label,
  value,
  onChange,
  accent
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  accent?: string;
}) {
  return (
    <div className="bg-panel2 rounded-lg p-3">
      <div className="text-[10px] text-muted mb-1">{label}</div>
      <input
        type="number"
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-transparent font-mono text-sm outline-none ${accent ?? "text-paper"}`}
        placeholder="—"
      />
    </div>
  );
}
