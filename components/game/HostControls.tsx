"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Settings, Pause, Play, SkipForward, X, AlertTriangle } from "lucide-react";
import { useState } from "react";

interface HostControlsProps {
  status: "active" | "paused" | "ended";
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
  onEnd: () => void;
}

export function HostControls({ status, onPause, onResume, onSkip, onEnd }: HostControlsProps) {
  const [open, setOpen] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: "rgba(255,107,53,0.15)", border: "1px solid rgba(255,107,53,0.3)" }}
        aria-label="Host vezérlők"
      >
        <Settings size={18} style={{ color: "var(--orange)" }} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              style={{ background: "rgba(0,0,0,0.6)" }}
              onClick={() => { setOpen(false); setConfirmEnd(false); }}
            />
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="fixed bottom-0 left-0 right-0 z-50 glass rounded-t-3xl p-6 pb-safe"
              style={{ borderTop: "1px solid var(--border-glow)" }}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-base" style={{ fontFamily: "var(--font-cinzel), serif" }}>
                  Host vezérlők
                </h3>
                <button
                  onClick={() => { setOpen(false); setConfirmEnd(false); }}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.08)" }}
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {status === "active" ? (
                  <button
                    onClick={() => { onPause(); setOpen(false); }}
                    className="btn-ghost w-full flex items-center justify-center gap-2"
                  >
                    <Pause size={16} /> Szünet
                  </button>
                ) : status === "paused" ? (
                  <button
                    onClick={() => { onResume(); setOpen(false); }}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    <Play size={16} /> Folytatás
                  </button>
                ) : null}

                <button
                  onClick={() => { onSkip(); setOpen(false); }}
                  className="btn-ghost w-full flex items-center justify-center gap-2"
                >
                  <SkipForward size={16} /> Állomás kihagyása
                </button>

                {!confirmEnd ? (
                  <button
                    onClick={() => setConfirmEnd(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold"
                    style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}
                  >
                    <AlertTriangle size={16} /> Játék befejezése
                  </button>
                ) : (
                  <div className="glass-cyan rounded-xl p-4">
                    <p className="text-sm text-center mb-3" style={{ color: "var(--text-muted)" }}>
                      Biztosan befejezed a játékot?
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => setConfirmEnd(false)} className="btn-ghost flex-1 py-2 text-sm">
                        Mégsem
                      </button>
                      <button
                        onClick={() => { onEnd(); setOpen(false); }}
                        className="flex-1 py-2 rounded-xl text-sm font-bold"
                        style={{ background: "#ef4444", color: "#fff" }}
                      >
                        Befejezés
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
