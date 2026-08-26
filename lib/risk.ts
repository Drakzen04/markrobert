export type RiskSettings = {
  riskPerTradePct: number; // % du capital risqué par trade (défaut 1%)
  dailyLossLimitPct: number; // coupe le bot pour la journée si atteint (défaut 3%)
  maxConcurrentPositions: number; // défaut 2
  minStars: number; // 4 par défaut, jamais en dessous de 4 (règle Casper)
  newsBufferMinutes: number; // marge d'évitement autour des annonces macro (défaut 5)
  mode: "manual" | "auto";
};

export const DEFAULT_RISK: RiskSettings = {
  riskPerTradePct: 1,
  dailyLossLimitPct: 3,
  maxConcurrentPositions: 2,
  minStars: 4,
  newsBufferMinutes: 5,
  mode: "manual"
};

export type DailyPnlState = {
  realizedPct: number; // cumulé depuis minuit
  tradesCountToday: number;
  openPositions: number;
};

/**
 * Vérifie si une nouvelle position est autorisée par les garde-fous.
 * Ces règles s'appliquent QUE le mode soit manuel ou automatique — en mode
 * auto elles sont la seule protection réelle du capital, donc non contournables.
 */
export function canOpenPosition(
  settings: RiskSettings,
  state: DailyPnlState,
  candidateStars: number,
  isNearNewsEvent: boolean
): { allowed: boolean; reason?: string } {
  if (state.realizedPct <= -Math.abs(settings.dailyLossLimitPct)) {
    return { allowed: false, reason: "Limite de perte journalière atteinte — bot en pause jusqu'à demain." };
  }
  if (state.openPositions >= settings.maxConcurrentPositions) {
    return { allowed: false, reason: "Nombre maximum de positions simultanées atteint." };
  }
  if (candidateStars < settings.minStars) {
    return { allowed: false, reason: `Setup à ${candidateStars}★, en dessous du seuil minimum (${settings.minStars}★).` };
  }
  if (isNearNewsEvent) {
    return { allowed: false, reason: "Une annonce macro-économique est proche — le bot n'entre pas en position." };
  }
  return { allowed: true };
}

/** Taille de position simulée en unités de compte, à partir du risque % et de la distance de SL. */
export function computePositionSize(
  accountBalance: number,
  riskPerTradePct: number,
  entry: number,
  stopLoss: number
): number {
  const riskAmount = accountBalance * (riskPerTradePct / 100);
  const distance = Math.abs(entry - stopLoss);
  if (distance === 0) return 0;
  return riskAmount / distance;
}
