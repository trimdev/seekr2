"use client";

import { useEffect, useState } from "react";

const COLORS = ["#00d4ff", "#ff6b35", "#a855f7", "#22d3ee", "#f59e0b", "#10b981", "#fff"];

interface Piece {
  id: number;
  left: string;
  color: string;
  dur: string;
  delay: string;
  r: string;
  size: number;
}

export function ConfettiEffect({ active }: { active: boolean }) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    if (!active) { setPieces([]); return; }

    const generated: Piece[] = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      dur: `${1.8 + Math.random() * 1.4}s`,
      delay: `${Math.random() * 0.8}s`,
      r: `${Math.random() * 4}px`,
      size: 6 + Math.floor(Math.random() * 8),
    }));
    setPieces(generated);

    const t = setTimeout(() => setPieces([]), 4000);
    return () => clearTimeout(t);
  }, [active]);

  if (!pieces.length) return null;

  return (
    <>
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left,
            background: p.color,
            width: p.size,
            height: p.size,
            ["--dur" as string]: p.dur,
            ["--delay" as string]: p.delay,
            ["--r" as string]: p.r,
          }}
        />
      ))}
    </>
  );
}
