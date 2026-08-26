import { callNvidia } from "./client";
import type { EconomicEvent } from "@/lib/marketData";

/**
 * RÔLE 1 — Filtre de sécurité final (nemotron, capacité de raisonnement).
 * Ne remplace JAMAIS ton jugement ni la gestion du risque — il ajoute une
 * seconde paire d'yeux sur le résultat de l'analyse d'image, en croisant avec
 * le contexte macro. Affiché comme AVERTISSEMENT, jamais comme blocage silencieux.
 */
export async function aiSafetyReview(analysis: ChartAnalysis, nearbyEvents: EconomicEvent[]): Promise<{ concern: boolean; note: string } | null> {
  const apiKey = process.env.NVIDIA_KEY_NEMOTRON;
  if (analysis.stars === 0) return null;

  const prompt = `Tu es un filtre de risque pour un bot de trading. Analyse ce setup en une phrase courte, en français.
Direction: ${analysis.direction}, étoiles: ${analysis.stars}/5, confiance de lecture: ${analysis.confidence}.
Critères: ${analysis.criteria.map((c) => `${c.name}:${c.met ? "ok" : "non"}`).join(", ")}
Événements macro proches (24h): ${nearbyEvents.map((e) => `${e.event} (${e.country}, impact ${e.impact})`).join(", ") || "aucun"}.
Réponds UNIQUEMENT au format: CONCERN:oui ou CONCERN:non, puis une phrase courte de justification.`;

  const raw = await callNvidia(apiKey, "nvidia/nemotron-3.5-lightning-30b-a3b", [{ role: "user", content: prompt }], 200, 0.2);
  if (!raw) return null;

  const concern = /CONCERN\s*:\s*oui/i.test(raw);
  const note = raw.replace(/CONCERN\s*:\s*(oui|non)/i, "").trim();
  return { concern, note: note || raw };
}

/**
 * RÔLE 2 — Narration rapide (muse-glimmer, léger et rapide).
 * Reformule la narration déjà générée par l'analyse d'image en une
 * explication plus naturelle. Si indisponible, la narration originale
 * reste affichée — jamais bloquant.
 */
export async function aiFastNarrative(analysis: ChartAnalysis): Promise<string | null> {
  const apiKey = process.env.NVIDIA_KEY_MUSE;
  if (!analysis.narrative) return null;
  const prompt = `Reformule cette analyse de trading en 2 phrases claires, en français, pour une lecture rapide avant validation manuelle : "${analysis.narrative}"`;
  return callNvidia(apiKey, "meta/muse-glimmer-30b", [{ role: "user", content: prompt }], 150, 0.5);
}

export type ChartAnalysis = {
  direction: "bullish" | "bearish" | "neutral";
  stars: number;
  criteria: { name: string; met: boolean; detail: string }[];
  entry: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  riskReward: number | null;
  narrative: string;
  confidence: "low" | "medium" | "high";
};

const CHART_ANALYSIS_PROMPT = `Tu es un analyste trading expert de la méthode "order block" / ICT enseignée par un trader nommé Casper. Analyse la capture de graphique fournie en appliquant EXACTEMENT sa grille de 5 critères :

1. IMBALANCE — l'order block repéré libère-t-il une zone d'inefficience (gap visible entre bougies) au moment de sa création ? (critère quasi éliminatoire)
2. TENDANCE — le marché est-il clairement directionnel (structure de points hauts/bas cohérente), pas en range ?
3. LIQUIDITÉ — l'order block est-il proche d'une poche de liquidité déjà prise (equal highs/lows, swing) plutôt que menacé par une poche non prise juste avant ?
4. FRAÎCHEUR — la zone semble-t-elle vierge (jamais retouchée depuis sa formation) ?
5. ZONE FIBONACCI — le niveau se situe-t-il en zone discount (pour un achat) ou premium (pour une vente) par rapport au dernier swing visible ?

Réponds UNIQUEMENT avec un objet JSON valide, rien avant ni après, selon exactement ce schéma :
{
  "direction": "bullish" | "bearish" | "neutral",
  "stars": <entier 0 à 5, nombre de critères ci-dessus clairement remplis>,
  "criteria": [
    {"name": "Imbalance", "met": true|false, "detail": "<courte justification en français>"},
    {"name": "Tendance", "met": true|false, "detail": "..."},
    {"name": "Liquidité", "met": true|false, "detail": "..."},
    {"name": "Fraîcheur", "met": true|false, "detail": "..."},
    {"name": "Zone Fibonacci", "met": true|false, "detail": "..."}
  ],
  "entry": <prix estimé d'entrée lu sur le graphique, ou null si illisible>,
  "stopLoss": <prix estimé de stop loss, ou null>,
  "takeProfit": <prix estimé de take profit à 2R, ou null>,
  "riskReward": <ratio numérique, généralement 2>,
  "narrative": "<synthèse en 3-4 phrases en français, façon météo du marché>",
  "confidence": "low" | "medium" | "high"
}

Si l'image n'est pas un graphique de trading exploitable, réponds avec stars=0, direction="neutral", et explique pourquoi dans narrative.
IMPORTANT : les prix (entry/stopLoss/takeProfit) sont une LECTURE APPROXIMATIVE de l'image, pas une donnée de marché fiable — indique une confidence "low" si les niveaux de prix ne sont pas clairement lisibles sur l'axe du graphique.`;

/**
 * Analyse structurée d'une capture de graphique, seule source d'analyse du
 * bot désormais (plus de flux de données live). L'image transite en mémoire
 * uniquement — jamais stockée sur disque ni en base de données.
 */
export async function aiChartAnalysis(base64Image: string, mimeType: string, symbolHint?: string, userNote?: string): Promise<ChartAnalysis | null> {
  const apiKey = process.env.NVIDIA_KEY_VISION;
  if (!apiKey) return null;

  const contextLine = [symbolHint ? `Actif concerné : ${symbolHint}.` : "", userNote ? `Note de l'utilisateur : ${userNote}` : ""]
    .filter(Boolean)
    .join(" ");

  const NVIDIA_BASE = "https://integrate.api.nvidia.com/v1/chat/completions";
  try {
    const res = await fetch(NVIDIA_BASE, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "nvidia/ising-calibration-1.5-31b",
        messages: [
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Image}` } },
              { type: "text", text: `${CHART_ANALYSIS_PROMPT}\n${contextLine}` }
            ]
          }
        ],
        temperature: 0.2,
        max_tokens: 900,
        stream: false
      }),
      cache: "no-store"
    });
    if (!res.ok) return null;
    const data = await res.json();
    const raw: string = data.choices?.[0]?.message?.content ?? "";
    return parseChartAnalysis(raw);
  } catch {
    return null;
  }
}

function parseChartAnalysis(raw: string): ChartAnalysis | null {
  try {
    // Le modèle peut entourer le JSON de balises de code malgré la consigne — on nettoie.
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);

    return {
      direction: ["bullish", "bearish", "neutral"].includes(parsed.direction) ? parsed.direction : "neutral",
      stars: Math.max(0, Math.min(5, Number(parsed.stars) || 0)),
      criteria: Array.isArray(parsed.criteria) ? parsed.criteria : [],
      entry: typeof parsed.entry === "number" ? parsed.entry : null,
      stopLoss: typeof parsed.stopLoss === "number" ? parsed.stopLoss : null,
      takeProfit: typeof parsed.takeProfit === "number" ? parsed.takeProfit : null,
      riskReward: typeof parsed.riskReward === "number" ? parsed.riskReward : null,
      narrative: typeof parsed.narrative === "string" ? parsed.narrative : "",
      confidence: ["low", "medium", "high"].includes(parsed.confidence) ? parsed.confidence : "low"
    };
  } catch {
    return null;
  }
}
/**
 * RÔLE 3 — Bilan post-trade (laguna-xs).
 * Analyse un lot de positions clôturées et suggère des AJUSTEMENTS DE RÉGLAGES
 * (jamais appliqués automatiquement — affichés comme suggestion que tu appliques
 * toi-même dans Réglages si tu es d'accord). C'est le "apprendre de ses erreurs"
 * demandé, mais gardé sous ton contrôle plutôt qu'auto-modifié.
 */
export async function aiPostTradeReview(closedPositions: any[]): Promise<string | null> {
  const apiKey = process.env.NVIDIA_KEY_LAGUNA;
  if (closedPositions.length === 0) return "Pas encore assez de trades clôturés pour un bilan.";

  const summary = closedPositions
    .map((p) => `${p.symbol} ${p.direction} ${p.stars}★ mode:${p.strategy_mode} résultat:${p.result_pct ?? "?"}%`)
    .join("\n");

  const prompt = `Voici les derniers trades clôturés d'un bot de trading order-block/ICT :
${summary}
En français, en 4-5 phrases maximum : identifie les patterns de pertes/gains (ex: un mode ou un score qui sous-performe) et suggère UN réglage concret à ajuster (ex: relever le seuil d'étoiles minimum, réduire le risque par trade). Sois concret et bref.`;

  return callNvidia(apiKey, "poolside/laguna-xs-2.1", [{ role: "user", content: prompt }], 400, 0.4);
}
