"use client";

import { ArrowUp, ArrowDown } from "lucide-react";

interface OrderPuzzleProps {
  items: string[];
  setItems: (items: string[]) => void;
  disabled?: boolean;
}

export function OrderPuzzle({ items, setItems, disabled }: OrderPuzzleProps) {
  const move = (index: number, dir: -1 | 1) => {
    const next = [...items];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
  };

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <div
          key={`${item}-${i}`}
          className="glass flex items-center gap-3 px-4 py-3 rounded-xl"
        >
          <span
            className="text-xs font-mono font-bold w-5 flex-shrink-0 opacity-30"
          >
            {i + 1}
          </span>
          <span className="flex-1 text-sm font-medium">{item}</span>
          {!disabled && (
            <div className="flex gap-1">
              <button
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-20 active:scale-90 transition-transform"
                style={{ background: "rgba(255,255,255,0.06)" }}
                aria-label="Fel"
              >
                <ArrowUp size={14} style={{ color: "var(--cyan)" }} />
              </button>
              <button
                onClick={() => move(i, 1)}
                disabled={i === items.length - 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-20 active:scale-90 transition-transform"
                style={{ background: "rgba(255,255,255,0.06)" }}
                aria-label="Le"
              >
                <ArrowDown size={14} style={{ color: "var(--cyan)" }} />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
