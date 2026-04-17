"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, Keyboard } from "lucide-react";

interface QRPuzzleProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  isHost: boolean;
}

export function QRPuzzle({ value, onChange, onSubmit, disabled, isHost }: QRPuzzleProps) {
  const [mode, setMode] = useState<"scan" | "text">("scan");
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // Ref so the scan loop always calls the latest onSubmit (avoids stale closure
  // when onChange + onSubmit fire in the same animation frame tick).
  const onSubmitRef = useRef(onSubmit);
  useEffect(() => { onSubmitRef.current = onSubmit; }, [onSubmit]);

  const startScan = useCallback(async () => {
    if (!("BarcodeDetector" in window)) {
      setMode("text");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);
      // @ts-expect-error BarcodeDetector not yet in TS types
      const detector = new BarcodeDetector({ formats: ["qr_code"] });
      const tick = async () => {
        if (!videoRef.current || !streamRef.current?.active) return;
        const barcodes = await detector.detect(videoRef.current);
        if (barcodes.length > 0) {
          const raw = barcodes[0].rawValue;
          onChange(raw);
          stopScan();
          if (isHost) onSubmitRef.current();
        } else {
          requestAnimationFrame(tick);
        }
      };
      requestAnimationFrame(tick);
    } catch {
      setMode("text");
    }
  }, [isHost, onChange]);

  const stopScan = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Mode toggle */}
      <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-dim)" }}>
        {(["scan", "text"] as const).map((m) => (
          <button
            key={m}
            onClick={() => { stopScan(); setMode(m); }}
            disabled={disabled}
            className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all"
            style={{
              background: mode === m ? "rgba(0,212,255,0.15)" : "transparent",
              color: mode === m ? "var(--cyan)" : "var(--text-muted)",
            }}
          >
            {m === "scan" ? <Camera size={15} /> : <Keyboard size={15} />}
            {m === "scan" ? "Kamera" : "Kézi"}
          </button>
        ))}
      </div>

      {mode === "scan" ? (
        <div className="flex flex-col items-center gap-3">
          {scanning ? (
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden"
              style={{ border: "2px solid var(--cyan)", maxWidth: 280 }}>
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
              {/* Corner brackets */}
              <div className="absolute inset-4 pointer-events-none">
                {["tl", "tr", "bl", "br"].map((pos) => (
                  <div
                    key={pos}
                    className="absolute w-6 h-6"
                    style={{
                      ...(pos.includes("t") ? { top: 0 } : { bottom: 0 }),
                      ...(pos.includes("l") ? { left: 0 } : { right: 0 }),
                      borderTop: pos.includes("t") ? "3px solid var(--cyan)" : "none",
                      borderBottom: pos.includes("b") ? "3px solid var(--cyan)" : "none",
                      borderLeft: pos.includes("l") ? "3px solid var(--cyan)" : "none",
                      borderRight: pos.includes("r") ? "3px solid var(--cyan)" : "none",
                    }}
                  />
                ))}
              </div>
              <button
                onClick={stopScan}
                className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-xs"
                style={{ background: "rgba(0,0,0,0.6)", color: "#fff" }}
              >✕</button>
            </div>
          ) : (
            <button
              onClick={startScan}
              disabled={!isHost || disabled}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Camera size={18} />
              {isHost ? "QR kód beolvasása" : "A vezető olvashatja be"}
            </button>
          )}
          {value && (
            <p className="text-xs text-center font-mono px-2 py-1 rounded-lg"
              style={{ background: "rgba(0,212,255,0.1)", color: "var(--cyan)" }}>
              ✓ {value}
            </p>
          )}
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={!isHost || disabled}
            placeholder="Add meg a QR kód tartalmát…"
            className="input-seekr flex-1"
          />
          {isHost && (
            <button
              onClick={onSubmit}
              disabled={!value.trim() || disabled}
              className="btn-primary px-4"
              style={{ minWidth: 52 }}
            >
              →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
