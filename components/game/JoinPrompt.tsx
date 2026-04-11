"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, Loader2 } from "lucide-react";

interface JoinPromptProps {
  sessionId: string;
  onJoin: (name: string) => Promise<void>;
}

export function JoinPrompt({ sessionId, onJoin }: JoinPromptProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handle = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      await onJoin(name.trim());
    } catch {
      setError("Nem sikerült csatlakozni. Próbáld újra.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "var(--bg-base)" }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="glass-cyan rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(0,212,255,0.15)" }}>
              <UserPlus size={20} style={{ color: "var(--cyan)" }} />
            </div>
            <div>
              <h2 className="font-bold text-base" style={{ fontFamily: "var(--font-cinzel), serif" }}>
                Csatlakozás
              </h2>
              <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                Szoba: {sessionId.slice(0, 6).toUpperCase()}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-muted)" }}>
                Hogyan hívnak?
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handle()}
                placeholder="A neved a játékban"
                className="input-seekr"
                maxLength={32}
                autoFocus
              />
            </div>
            {error && <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p>}
            <button
              onClick={handle}
              disabled={loading || !name.trim()}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Csatlakozás…</>
              ) : (
                "Belépés a szobába"
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
