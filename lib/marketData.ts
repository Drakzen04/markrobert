const FINNHUB_BASE = "https://finnhub.io/api/v1";

export type EconomicEvent = {
  event: string;
  country: string;
  time: string;
  impact: "low" | "medium" | "high";
};

/**
 * Calendrier économique (Finnhub) — seule donnée de marché externe encore
 * utilisée par le bot. L'analyse elle-même se base uniquement sur l'image
 * que tu fournis ; ceci ne sert qu'à vérifier si une annonce macro à fort
 * impact est proche, pour l'afficher en avertissement.
 */
export async function fetchEconomicCalendar(fromISODate: string, toISODate: string): Promise<EconomicEvent[]> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) return [];

  const url = `${FINNHUB_BASE}/calendar/economic?from=${fromISODate}&to=${toISODate}&token=${apiKey}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.economicCalendar ?? []) as EconomicEvent[];
  } catch {
    return [];
  }
}
