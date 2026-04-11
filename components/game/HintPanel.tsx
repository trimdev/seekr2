"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, ChevronDown } from "lucide-react";

interface HintPanelProps {
  hint?: string;
  nextHint?: string;
  hintOpen: boolean;
  nextHintOpen: boolean;
  isHost: boolean;
  onRevealHint: () => void;
  onRevealNextHint: () => void;
  solved: boolean;
}

export function HintPanel({
  hint, nextHint, hintOpen, nextHintOpen,
  isHost, onRevealHint, onRevealNextHint, solved,
}: HintPanelProps) {
  return (
    <div className="flex flex-col gap-3">
      {hint && (
        <div>
          {hintOpen ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="glass-cyan rounded-2xl p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb size={16} style={{ color: "var(--cyan)" }} />
                <span className="text-xs font-semibold" style={{ color: "var(--cyan)" }}>TIPP</span>
              </div>
              <p className="text-sm leading-relaxed">{hint}</p>
            </motion.div>
          ) : (
            <button
              onClick={onRevealHint}
              disabled={!isHost}
              className="w-full glass rounded-2xl p-4 flex items-center gap-3 text-left transition-all"
              style={{
                opacity: isHost ? 1 : 0.5,
                cursor: isHost ? "pointer" : "default",
              }}
            >
              <Lightbulb size={18} style={{ color: "var(--text-faint)" }} />
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                  {isHost ? "Tipp felfedése" : "Tipp — a csapatvezető fedi fel"}
                </p>
              </div>
              {isHost && <ChevronDown size={16} style={{ color: "var(--text-faint)" }} />}
            </button>
          )}
        </div>
      )}

      {nextHint && solved && (
        <div>
          {nextHintOpen ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="glass rounded-2xl p-4"
              style={{ borderColor: "rgba(255,107,53,0.3)" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb size={16} style={{ color: "var(--orange)" }} />
                <span className="text-xs font-semibold" style={{ color: "var(--orange)" }}>KÖVETKEZŐ ÁLLOMÁS</span>
              </div>
              <p className="text-sm leading-relaxed">{nextHint}</p>
            </motion.div>
          ) : (
            <button
              onClick={onRevealNextHint}
              disabled={!isHost}
              className="w-full glass rounded-2xl p-4 flex items-center gap-3 text-left transition-all"
              style={{ opacity: isHost ? 1 : 0.5, cursor: isHost ? "pointer" : "default" }}
            >
              <Lightbulb size={18} style={{ color: "var(--orange)" }} />
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                  Következő állomás iránymutatója
                </p>
              </div>
              {isHost && <ChevronDown size={16} style={{ color: "var(--text-faint)" }} />}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
