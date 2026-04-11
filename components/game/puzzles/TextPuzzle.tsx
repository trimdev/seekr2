"use client";

import { Send } from "lucide-react";

interface TextPuzzleProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  isHost: boolean;
  correct?: boolean | null;
}

export function TextPuzzle({ value, onChange, onSubmit, disabled, isHost, correct }: TextPuzzleProps) {
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isHost && !disabled) onSubmit();
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKey}
          disabled={disabled || !isHost}
          placeholder={isHost ? "Írd be a megfejtést…" : "A csapatvezető adja be a választ"}
          className="input-seekr pr-14"
          style={{
            borderColor: correct === false ? "#ef4444" : correct === true ? "#22d3ee" : undefined,
          }}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
        />
        {isHost && (
          <button
            onClick={onSubmit}
            disabled={disabled || !value.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{
              background: value.trim() ? "var(--cyan)" : "var(--border-dim)",
              color: value.trim() ? "#000" : "var(--text-faint)",
            }}
            aria-label="Beküldés"
          >
            <Send size={15} />
          </button>
        )}
      </div>
      {correct === false && (
        <p className="text-xs text-center" style={{ color: "#ef4444" }}>
          Nem ez a helyes megfejtés. Próbáld újra!
        </p>
      )}
    </div>
  );
}
