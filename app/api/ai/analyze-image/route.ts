import { NextRequest, NextResponse } from "next/server";
import { aiChartAnalysis } from "@/lib/ai/roles";

/**
 * L'image ne quitte jamais la mémoire de cette requête : reçue en base64,
 * envoyée au modèle vision, puis oubliée — rien n'est écrit sur disque ni en
 * base de données.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { imageBase64, mimeType, symbol, note } = body;

  if (!imageBase64 || !mimeType) {
    return NextResponse.json({ error: "Image manquante." }, { status: 400 });
  }

  const analysis = await aiChartAnalysis(imageBase64, mimeType, symbol, note);
  if (!analysis) {
    return NextResponse.json(
      { error: "Analyse indisponible (clé NVIDIA_KEY_VISION manquante, ou erreur du modèle — réessaie)." },
      { status: 502 }
    );
  }

  return NextResponse.json({ analysis });
}
