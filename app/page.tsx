"use client";

import { useState } from "react";
import { Loader2, Check, Sparkles } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import UploadZone from "@/components/UploadZone";
import AnalysisPanel, { type ChartAnalysis } from "@/components/AnalysisPanel";
import PositionsQueue from "@/components/PositionsQueue";
import SettingsPanel from "@/components/SettingsPanel";

type Stage = "idle" | "reading" | "enriching" | "done";

export default function Page() {
  const [symbol, setSymbol] = useState("XAUUSD");
  const [note, setNote] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ChartAnalysis | null>(null);
  const [aiSafetyReview, setAiSafetyReview] = useState<{ concern: boolean; note: string } | null>(null);
  const [aiNarrative, setAiNarrative] = useState<string | null>(null);
  const [macroEvent, setMacroEvent] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [mt5Login, setMt5Login] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [entry, setEntry] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");

  async function analyzeImage(imageBase64: string, mimeType: string) {
    setError(null);
    setAnalysis(null);
    setAiSafetyReview(null);
    setAiNarrative(null);
    setMacroEvent(null);
    setStage("reading");

    try {
      const res = await fetch("/api/ai/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, mimeType, symbol, note: note || undefined })
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Erreur d'analyse.");
        setStage("idle");
        return;
      }
      setAnalysis(json.analysis);
      setEntry(json.analysis.entry?.toString() ?? "");
      setStopLoss(json.analysis.stopLoss?.toString() ?? "");
      setTakeProfit(json.analysis.takeProfit?.toString() ?? "");
      setStage("enriching");

      const enrichRes = await fetch("/api/ai/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis: json.analysis })
      });
      const enrichJson = await enrichRes.json();
      setAiSafetyReview(enrichJson.aiSafetyReview ?? null);
      setAiNarrative(enrichJson.aiNarrative ?? null);
      setMacroEvent(enrichJson.macroEvent ?? null);
      setStage("done");
    } catch {
      setError("Impossible de contacter le service d'analyse.");
      setStage("idle");
    }
  }

  async function submitPosition() {
    if (!analysis || analysis.stars === 0) return;
    setSubmitting(true);
    try {
      await fetch("/api/positions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          direction: analysis.direction,
          entry: Number(entry),
          stopLoss: Number(stopLoss),
          takeProfit: Number(takeProfit),
          stars: analysis.stars,
          mode: "manual",
          strategyMode: "image_analysis",
          narrative: analysis.narrative
        })
      });
    } finally {
      setSubmitting(false);
    }
  }

  function loadMt5Status() {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setMt5Login(d.mt5Login ?? null));
  }

  const canSubmit = analysis && analysis.stars > 0 && entry && stopLoss && takeProfit;

  return (
    <div className="flex min-h-screen bg-ink">
      <Sidebar
        mt5Login={mt5Login}
        onOpenSettings={() => {
          loadMt5Status();
          setShowSettings(true);
        }}
      />

      <main className="flex-1 p-6 space-y-6 max-w-[1600px]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl text-paper">Nouvelle analyse</h2>
            <p className="text-xs text-muted">Dépose une capture de graphique pour commencer</p>
          </div>
          <ProgressIndicator stage={stage} />
        </div>

        {error && <div className="rounded-xl border border-sell/40 bg-sell/10 p-4 text-sm text-sell">{error}</div>}

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
          <div className="space-y-6">
            <UploadZone
              onImageReady={(base64, mimeType) => analyzeImage(base64, mimeType)}
              symbol={symbol}
              onSymbolChange={setSymbol}
              note={note}
              onNoteChange={setNote}
            />

            <div className="bg-panel border border-line rounded-2xl">
              <PositionsQueue />
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-panel border border-line rounded-2xl">
              <AnalysisPanel
                analysis={analysis}
                entry={entry}
                stopLoss={stopLoss}
                takeProfit={takeProfit}
                onEntryChange={setEntry}
                onStopLossChange={setStopLoss}
                onTakeProfitChange={setTakeProfit}
                macroEvent={macroEvent}
                aiSafetyReview={aiSafetyReview}
                aiNarrative={aiNarrative}
              />
            </div>

            {analysis && (
              <button
                disabled={!canSubmit || submitting}
                onClick={submitPosition}
                className="w-full py-3 rounded-xl bg-gold text-ink font-medium hover:bg-gold2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {submitting ? "Envoi…" : "Envoyer en file de validation"}
              </button>
            )}
          </div>
        </div>
      </main>

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  );
}

function ProgressIndicator({ stage }: { stage: Stage }) {
  if (stage === "idle") return null;

  const steps: { key: Stage; label: string; icon: any }[] = [
    { key: "reading", label: "Lecture du graphique", icon: Sparkles },
    { key: "enriching", label: "Macro & filtre IA", icon: Sparkles }
  ];
  const order: Stage[] = ["reading", "enriching", "done"];
  const currentIndex = order.indexOf(stage);

  return (
    <div className="flex items-center gap-3 text-xs text-muted">
      {steps.map((s) => {
        const stepIndex = order.indexOf(s.key);
        const isDone = currentIndex > stepIndex;
        const isActive = currentIndex === stepIndex;
        return (
          <div key={s.key} className="flex items-center gap-1.5">
            {isDone ? (
              <Check size={13} className="text-buy" />
            ) : isActive ? (
              <Loader2 size={13} className="animate-spin text-gold" />
            ) : (
              <span className="w-3 h-3 rounded-full border border-line" />
            )}
            <span className={isActive ? "text-paper" : ""}>{s.label}</span>
          </div>
        );
      })}
    </div>
  );
}
