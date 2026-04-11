"use client";

import { avatarColor, sessionCode } from "@/lib/utils";
import { Copy, Check, Crown } from "lucide-react";
import { useState } from "react";
import type { Member } from "@/types";

interface PlayerListProps {
  members: Member[];
  hostUid: string;
  sessionId: string;
  gameId: string;
}

export function PlayerList({ members, hostUid, sessionId, gameId }: PlayerListProps) {
  const [copied, setCopied] = useState(false);
  const code = sessionCode(sessionId);
  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/games/${gameId}/play?session=${sessionId}`
    : "";

  const copyCode = async () => {
    await navigator.clipboard.writeText(shareUrl || code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass rounded-2xl p-4">
      {/* Code row */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Csatlakozási kód</p>
          <p
            className="text-2xl font-black tracking-widest"
            style={{ fontFamily: "monospace", color: "var(--cyan)" }}
          >
            {code}
          </p>
        </div>
        <button
          onClick={copyCode}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90"
          style={{ background: copied ? "rgba(0,212,255,0.15)" : "rgba(255,255,255,0.06)", border: "1px solid var(--border-dim)" }}
          aria-label="Kód másolása"
        >
          {copied ? <Check size={16} style={{ color: "var(--cyan)" }} /> : <Copy size={16} style={{ color: "var(--text-muted)" }} />}
        </button>
      </div>

      {/* Members */}
      <div className="flex flex-col gap-2">
        {members.map((m, i) => (
          <div key={m.uid} className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ background: avatarColor(i), color: "#000" }}
            >
              {(m.name || "?")[0].toUpperCase()}
            </div>
            <span className="text-sm font-medium flex-1 truncate">{m.name}</span>
            {m.uid === hostUid && (
              <Crown size={14} style={{ color: "var(--orange)", flexShrink: 0 }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
