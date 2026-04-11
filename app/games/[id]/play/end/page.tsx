"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Trophy, RotateCcw, Home, Share2 } from "lucide-react";
import { ConfettiEffect } from "@/components/game/ConfettiEffect";
import { getGame } from "@/lib/firestore";
import { getText } from "@/lib/utils";

export default function EndPage() {
  const { id: gameId } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [confetti, setConfetti] = useState(true);
  const [gameTitle, setGameTitle] = useState("");

  useEffect(() => {
    if (gameId) {
      getGame(gameId as string).then((g) => {
        if (g) setGameTitle(getText(g.title));
      });
    }
    const t = setTimeout(() => setConfetti(false), 5000);
    return () => clearTimeout(t);
  }, [gameId]);

  const share = async () => {
    const text = `Teljesítettük a(z) "${gameTitle}" Seekr kalandjátékot! 🎉`;
    if (navigator.share) {
      await navigator.share({ title: "Seekr", text });
    } else {
      await navigator.clipboard.writeText(text);
      alert("Szöveg vágólapra másolva!");
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: "var(--bg-base)" }}
    >
      <ConfettiEffect active={confetti} />

      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
        style={{ background: "rgba(0,212,255,0.15)", border: "2px solid var(--cyan)" }}
      >
        <Trophy size={42} style={{ color: "var(--cyan)" }} />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h1
          className="text-4xl font-black mb-3 text-glow-cyan"
          style={{ fontFamily: "var(--font-cinzel), serif", color: "var(--cyan)" }}
        >
          Gratulálunk!
        </h1>
        <p className="text-base mb-2" style={{ color: "var(--text-primary)" }}>
          Teljesítettétek a kalandjátékot!
        </p>
        {gameTitle && (
          <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
            {gameTitle}
          </p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col gap-3 w-full max-w-xs"
      >
        <button onClick={share} className="btn-primary w-full flex items-center justify-center gap-2">
          <Share2 size={16} /> Megosztás
        </button>
        <button
          onClick={() => router.push(`/games/${gameId}`)}
          className="btn-ghost w-full flex items-center justify-center gap-2"
        >
          <RotateCcw size={16} /> Újra játszani
        </button>
        <button
          onClick={() => router.push("/")}
          className="btn-ghost w-full flex items-center justify-center gap-2"
        >
          <Home size={16} /> Főoldal
        </button>
      </motion.div>
    </div>
  );
}
