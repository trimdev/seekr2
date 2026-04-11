"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

interface LockPuzzleProps {
  digits: string[];
  setDigits: (d: string[]) => void;
  onUnlock: () => void;
  solution: string;
  disabled?: boolean;
}

export function LockPuzzle({ digits, setDigits, onUnlock, solution, disabled }: LockPuzzleProps) {
  const [unlocked, setUnlocked] = useState(false);

  const updateDigit = (index: number, delta: number) => {
    if (disabled || unlocked) return;
    const next = [...digits];
    next[index] = ((parseInt(next[index], 10) + delta + 10) % 10).toString();
    setDigits(next);

    if (next.join("") === solution.trim()) {
      setUnlocked(true);
      try { new Audio("/sounds/success.mp3").play(); } catch {}
      setTimeout(onUnlock, 600);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <p className="text-sm italic" style={{ color: "var(--text-muted)" }}>
        🔒 Állítsd be a helyes kódot
      </p>
      <div className="flex gap-3">
        {digits.map((d, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-1"
          >
            <button
              onPointerDown={() => updateDigit(i, 1)}
              disabled={disabled || unlocked}
              className="w-14 h-11 rounded-xl flex items-center justify-center transition-all active:scale-90"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--border-dim)" }}
              aria-label="Növelés"
            >
              <ChevronUp size={18} style={{ color: "var(--cyan)" }} />
            </button>

            <div
              className="w-14 h-16 rounded-xl flex items-center justify-center text-3xl font-black transition-colors"
              style={{
                background: unlocked ? "rgba(34,211,238,0.12)" : "rgba(255,255,255,0.04)",
                border: `2px solid ${unlocked ? "var(--cyan)" : "var(--border-dim)"}`,
                color: unlocked ? "var(--cyan)" : "var(--text-primary)",
                fontFamily: "monospace",
              }}
            >
              {d}
            </div>

            <button
              onPointerDown={() => updateDigit(i, -1)}
              disabled={disabled || unlocked}
              className="w-14 h-11 rounded-xl flex items-center justify-center transition-all active:scale-90"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--border-dim)" }}
              aria-label="Csökkentés"
            >
              <ChevronDown size={18} style={{ color: "var(--cyan)" }} />
            </button>
          </div>
        ))}
      </div>
      {unlocked && (
        <p className="text-sm font-semibold" style={{ color: "var(--cyan)" }}>
          ✓ Felnyílt!
        </p>
      )}
    </div>
  );
}
