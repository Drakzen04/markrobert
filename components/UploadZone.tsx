"use client";

import { useCallback, useState } from "react";
import { ImagePlus, X } from "lucide-react";

const SYMBOLS = [
  { value: "EURUSD", label: "EUR/USD" },
  { value: "USOIL", label: "US Oil (WTI)" },
  { value: "XAUUSD", label: "Or (XAU/USD)" },
  { value: "BTCUSD", label: "Bitcoin (BTC/USD)" }
];

export default function UploadZone({
  onImageReady,
  symbol,
  onSymbolChange,
  note,
  onNoteChange,
  disabled
}: {
  onImageReady: (base64: string, mimeType: string, previewUrl: string) => void;
  symbol: string;
  onSymbolChange: (s: string) => void;
  note: string;
  onNoteChange: (n: string) => void;
  disabled?: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setPreview(dataUrl);
        onImageReady(dataUrl.split(",")[1], file.type, dataUrl);
      };
      reader.readAsDataURL(file);
    },
    [onImageReady]
  );

  return (
    <div className="bg-panel border border-line rounded-2xl p-5 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={symbol}
          onChange={(e) => onSymbolChange(e.target.value)}
          className="bg-panel2 border border-line rounded-lg px-3 py-2 text-sm text-paper focus:border-gold outline-none"
        >
          {SYMBOLS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="Note optionnelle (ex. \"session US, 5 minutes\")"
          className="flex-1 min-w-[200px] bg-panel2 border border-line rounded-lg px-3 py-2 text-sm text-paper focus:border-gold outline-none"
        />
      </div>

      {!preview ? (
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
          className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-12 cursor-pointer transition-colors ${
            dragging ? "border-gold bg-gold/5" : "border-line hover:border-gold/40"
          }`}
        >
          <ImagePlus size={28} className="text-muted" />
          <p className="text-sm text-muted">Glisse une capture de graphique ici, ou clique pour en choisir une</p>
          <p className="text-[10px] text-muted/70">Non enregistrée — analysée puis oubliée</p>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={disabled}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </label>
      ) : (
        <div className="relative">
          <img src={preview} alt="Capture déposée" className="rounded-xl border border-line max-h-80 w-full object-contain bg-panel2" />
          <button
            onClick={() => setPreview(null)}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-ink/80 text-paper hover:bg-ink"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
