"use client";

import { useEffect, useState, useCallback } from "react";
import { TrendingUp, TrendingDown, Check, X, Clock, Send, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";

type Position = {
  id: string;
  symbol: string;
  direction: "bullish" | "bearish";
  entry: number;
  stop_loss: number;
  take_profit: number;
  stars: number;
  mode: "manual" | "auto";
  status: "pending_approval" | "approved" | "dispatched" | "open" | "rejected" | "closed" | "failed";
  strategy_mode: string;
  created_at: string;
  mt5_ticket?: string | null;
  error_message?: string | null;
};

const STATUS_META: Record<Position["status"], { label: string; color: string; icon: any }> = {
  pending_approval: { label: "À valider", color: "text-gold bg-gold/10 border-gold/30", icon: Clock },
  approved: { label: "En file", color: "text-gold bg-gold/10 border-gold/30", icon: Send },
  dispatched: { label: "Envoyé au pont", color: "text-gold bg-gold/10 border-gold/30", icon: Send },
  open: { label: "Ouverte", color: "text-buy bg-buy/10 border-buy/30", icon: CheckCircle2 },
  rejected: { label: "Rejetée", color: "text-muted bg-panel2 border-line", icon: X },
  closed: { label: "Clôturée", color: "text-muted bg-panel2 border-line", icon: CheckCircle2 },
  failed: { label: "Échec", color: "text-sell bg-sell/10 border-sell/30", icon: AlertCircle }
};

export default function PositionsQueue() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [review, setReview] = useState<string | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/positions");
    const json = await res.json();
    setPositions(json.positions ?? []);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  async function act(id: string, action: "approve" | "reject" | "close") {
    await fetch(`/api/positions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action })
    });
    load();
  }

  async function runReview() {
    setReviewLoading(true);
    try {
      const res = await fetch("/api/ai/review");
      const json = await res.json();
      setReview(json.review ?? "Bilan indisponible.");
    } finally {
      setReviewLoading(false);
    }
  }

  const pending = positions.filter((p) => p.status === "pending_approval");
  const queued = positions.filter((p) => p.status === "approved" || p.status === "dispatched");
  const open = positions.filter((p) => p.status === "open");
  const failed = positions.filter((p) => p.status === "failed");
  const history = positions.filter((p) => p.status === "closed" || p.status === "rejected").slice(0, 10);

  return (
    <div className="divide-y divide-line">
      <Section title="À valider" count={pending.length}>
        {pending.length === 0 && <Empty text="Aucune position en attente de validation." />}
        {pending.map((p) => (
          <PositionRow key={p.id} p={p}>
            <button onClick={() => act(p.id, "approve")} className="p-1.5 rounded bg-buy/15 text-buy hover:bg-buy/25">
              <Check size={14} />
            </button>
            <button onClick={() => act(p.id, "reject")} className="p-1.5 rounded bg-sell/15 text-sell hover:bg-sell/25">
              <X size={14} />
            </button>
          </PositionRow>
        ))}
      </Section>

      <Section title="En file pour le pont MT5" count={queued.length}>
        {queued.length === 0 && <Empty text="Rien en attente d'exécution sur ton compte Exness." />}
        {queued.map((p) => (
          <PositionRow key={p.id} p={p} />
        ))}
      </Section>

      <Section title="Positions ouvertes sur Exness" count={open.length}>
        {open.length === 0 && <Empty text="Aucune position réellement ouverte." />}
        {open.map((p) => (
          <PositionRow key={p.id} p={p}>
            {p.mt5_ticket && <span className="text-xs text-muted font-mono">#{p.mt5_ticket}</span>}
          </PositionRow>
        ))}
      </Section>

      {failed.length > 0 && (
        <Section title="Échecs d'exécution" count={failed.length}>
          {failed.map((p) => (
            <PositionRow key={p.id} p={p}>
              <span className="text-xs text-sell max-w-[200px] truncate">{p.error_message}</span>
            </PositionRow>
          ))}
        </Section>
      )}

      <Section title="Historique récent" count={history.length}>
        {history.length === 0 && <Empty text="Pas encore d'historique." />}
        {history.map((p) => (
          <PositionRow key={p.id} p={p} />
        ))}
      </Section>

      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] uppercase tracking-widest text-muted flex items-center gap-1">
            <Sparkles size={12} /> Bilan IA des trades clôturés
          </span>
          <button
            onClick={runReview}
            disabled={reviewLoading}
            className="px-3 py-1.5 text-xs rounded-lg border border-line text-paper hover:border-gold transition-colors"
          >
            {reviewLoading ? "Analyse…" : "Générer un bilan"}
          </button>
        </div>
        {review && <p className="text-sm text-paper/90 bg-panel2 rounded-lg p-3 leading-relaxed">{review}</p>}
      </div>
    </div>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] uppercase tracking-widest text-muted">{title}</span>
        <span className="text-[10px] text-muted bg-panel2 px-1.5 py-0.5 rounded-full">{count}</span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="text-sm text-muted italic py-1">{text}</div>;
}

function PositionRow({ p, children }: { p: Position; children?: React.ReactNode }) {
  const DirIcon = p.direction === "bullish" ? TrendingUp : TrendingDown;
  const dirColor = p.direction === "bullish" ? "text-buy" : "text-sell";
  const meta = STATUS_META[p.status];
  const StatusIcon = meta.icon;

  return (
    <div className="flex items-center justify-between bg-panel2 rounded-lg px-3 py-2.5">
      <div className="flex items-center gap-3">
        <DirIcon size={15} className={dirColor} />
        <span className="text-sm text-paper">{p.symbol}</span>
        <span className="text-xs text-muted">{p.stars}★</span>
        <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${meta.color}`}>
          <StatusIcon size={11} />
          {meta.label}
        </span>
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}
