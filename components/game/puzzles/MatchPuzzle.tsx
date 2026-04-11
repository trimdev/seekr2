"use client";

interface MatchPair { left: string; right: string }

interface MatchPuzzleProps {
  pairs: MatchPair[];
  selections: Record<string, string>;
  setSelections: (s: Record<string, string>) => void;
  disabled?: boolean;
}

export function MatchPuzzle({ pairs, selections, setSelections, disabled }: MatchPuzzleProps) {
  const options = pairs.map((p) => p.right);

  return (
    <div className="flex flex-col gap-3">
      {pairs.map((pair) => (
        <div
          key={pair.left}
          className="glass rounded-xl px-4 py-3 flex items-center gap-3"
        >
          <span className="flex-1 text-sm font-medium">{pair.left}</span>
          <span style={{ color: "var(--text-faint)" }}>→</span>
          <select
            value={selections[pair.left] || ""}
            onChange={(e) =>
              setSelections({ ...selections, [pair.left]: e.target.value })
            }
            disabled={disabled}
            className="rounded-xl px-3 py-2 text-sm"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid var(--border-dim)",
              color:
                selections[pair.left]
                  ? "var(--text-primary)"
                  : "var(--text-faint)",
              minWidth: "110px",
              outline: "none",
            }}
          >
            <option value="" disabled>
              Válassz…
            </option>
            {options.map((opt) => (
              <option key={opt} value={opt} style={{ background: "var(--bg-card)", color: "var(--text-primary)" }}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
