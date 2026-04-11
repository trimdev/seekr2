"use client";

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { formatTime } from "@/lib/utils";

interface GameTimerProps {
  startedAt?: number | null;
  running: boolean;
}

export function GameTimer({ startedAt, running }: GameTimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!running || !startedAt) { setElapsed(0); return; }

    const tick = () => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [running, startedAt]);

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--border-dim)" }}>
      <Timer size={14} style={{ color: "var(--cyan)" }} />
      <span className="text-sm font-mono font-bold" style={{ color: "var(--text-primary)" }}>
        {formatTime(elapsed)}
      </span>
    </div>
  );
}
