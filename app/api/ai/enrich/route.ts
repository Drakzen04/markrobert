import { NextRequest, NextResponse } from "next/server";
import { aiSafetyReview, aiFastNarrative } from "@/lib/ai/roles";
import { fetchEconomicCalendar } from "@/lib/marketData";
import type { ChartAnalysis } from "@/lib/ai/roles";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const analysis = body.analysis as ChartAnalysis;
  if (!analysis) return NextResponse.json({ error: "analysis manquante" }, { status: 400 });

  const today = new Date().toISOString().slice(0, 10);
  const nearbyEvents = await fetchEconomicCalendar(today, today).catch(() => []);

  const [safetyReview, fastNarrative] = await Promise.all([
    aiSafetyReview(analysis, nearbyEvents).catch(() => null),
    aiFastNarrative(analysis).catch(() => null)
  ]);

  const macroHighImpact = nearbyEvents.find((e) => e.impact === "high");

  return NextResponse.json({
    aiSafetyReview: safetyReview,
    aiNarrative: fastNarrative,
    macroEvent: macroHighImpact ? `${macroHighImpact.event} (${macroHighImpact.country})` : null
  });
}
