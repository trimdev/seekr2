"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Loader2 } from "lucide-react";
import { createSession } from "@/lib/firestore";

interface SessionCreatorProps {
  gameId: string;
  uid: string;
  displayName: string;
  onCreated: (sessionId: string) => void;
}

export function SessionCreator({ gameId, uid, displayName, onCreated }: SessionCreatorProps) {
  const [name, setName] = useState(displayName || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const sessionId = await createSession(gameId, uid, name.trim());
      onCreated(sessionId);
    } catch (e: unknown) {
      setError("Nem sikerült létrehozni a szobát. Próbáld újra.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-cyan rounded-2xl p-6"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(0,212,255,0.15)" }}>
          <Users size={20} style={{ color: "var(--cyan)" }} />
        </div>
        <div>
          <h3 className="font-bold text-base" style={{ fontFamily: "var(--font-cinzel), serif" }}>
            Szoba létrehozása
          </h3>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Te leszel a csapatvezető</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-muted)" }}>
            Neved a játékban
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="Pl. Kovács Péter"
            className="input-seekr"
            maxLength={32}
          />
        </div>
        {error && <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p>}
        <button
          onClick={handleCreate}
          disabled={loading || !name.trim()}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {loading ? (
            <><Loader2 size={16} className="animate-spin" /> Létrehozás…</>
          ) : (
            "Szoba indítása"
          )}
        </button>
      </div>
    </motion.div>
  );
}
