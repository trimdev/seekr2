"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ArrowLeft, MapPin, Clock, Users, ChevronRight, Zap, Lock, ShoppingCart
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { getGame } from "@/lib/firestore";
import { db } from "@/lib/firebase";
import { getText } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Container } from "@/components/ui/Container";
import type { Game } from "@/types";

const GameMap = dynamic(() => import("@/components/game/GameMap"), { ssr: false });

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: "Könnyű",
  medium: "Közepes",
  hard: "Nehéz",
};

export default function GameDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [owned, setOwned] = useState<boolean | null>(null);

  useEffect(() => {
    if (!id) return;
    getGame(id as string).then(setGame).finally(() => setLoading(false));
  }, [id]);

  // Check ownership when game is ready
  useEffect(() => {
    if (!id || !game) return;
    // Free game: always accessible
    if (!game.price || game.price === 0) { setOwned(true); return; }
    // Paid game but user not logged in: mark as not owned to show login CTA
    if (!user) { setOwned(false); return; }
    getDoc(doc(db, "users", user.uid, "owned_games", id as string))
      .then((snap) => setOwned(snap.exists()))
      .catch(() => setOwned(false));
  }, [user, id, game]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--cyan)" }} />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "var(--bg-base)" }}>
        <Lock size={40} className="mb-4 opacity-30" />
        <p style={{ color: "var(--text-muted)" }}>A játék nem található.</p>
        <Link href="/games" className="btn-ghost mt-4">Vissza</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      {/* Cover */}
      <div className="relative h-64 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={[game.background, game.image].find(s => s?.startsWith("http")) ?? `/game-images/${id}.png`}
          alt={getText(game.title)}
          className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-[var(--bg-base)]" />

        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "rgba(10,14,26,0.7)", backdropFilter: "blur(8px)", border: "1px solid var(--border-dim)" }}
          aria-label="Vissza"
        >
          <ArrowLeft size={18} />
        </button>
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="-mt-6 pb-32"
      >
      <Container>
        {/* Meta chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {game.difficulty && (
            <span className="glass text-xs font-semibold px-3 py-1 rounded-full" style={{ color: "var(--cyan)" }}>
              {DIFFICULTY_LABEL[game.difficulty]}
            </span>
          )}
          {game.category && (
            <span className="glass text-xs font-semibold px-3 py-1 rounded-full capitalize" style={{ color: "var(--orange)" }}>
              {game.category === "outdoor" ? "Szabadtéri" : "Pub"}
            </span>
          )}
        </div>

        <h1
          className="text-3xl font-black mb-2"
          style={{ fontFamily: "var(--font-cinzel), serif" }}
        >
          {getText(game.title)}
        </h1>

        <div className="flex flex-wrap gap-4 mb-5" style={{ color: "var(--text-muted)" }}>
          {game.city && (
            <span className="flex items-center gap-1 text-sm">
              <MapPin size={14} style={{ color: "var(--cyan)" }} />
              {getText(game.city)}
            </span>
          )}
          {game.duration && (
            <span className="flex items-center gap-1 text-sm">
              <Clock size={14} /> {game.duration}
            </span>
          )}
          {game.players && (
            <span className="flex items-center gap-1 text-sm">
              <Users size={14} /> {game.players} fő
            </span>
          )}
        </div>

        {/* Story intro */}
        {game.story_intro && (
          <div
            className="glass rounded-2xl p-4 mb-5"
            style={{ borderLeft: "3px solid var(--cyan)" }}
          >
            <p className="text-sm leading-relaxed italic" style={{ color: "var(--text-muted)" }}>
              {getText(game.story_intro)}
            </p>
          </div>
        )}

        {/* Description */}
        {game.desc && (
          <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--text-muted)" }}>
            {getText(game.desc)}
          </p>
        )}

        {/* Mission */}
        {game.mission && (
          <div className="glass-cyan rounded-2xl p-4 mb-6 flex gap-3">
            <Zap size={20} style={{ color: "var(--cyan)", flexShrink: 0, marginTop: 2 }} />
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: "var(--cyan)" }}>KÜLDETÉS</p>
              <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                {getText(game.mission)}
              </p>
            </div>
          </div>
        )}

        {/* Starting point */}
        {game.startName && (
          <div className="glass rounded-2xl p-4 mb-5">
            <p className="text-xs font-semibold mb-1" style={{ color: "var(--text-muted)" }}>INDULÁSI PONT</p>
            <p className="font-medium">{getText(game.startName)}</p>
          </div>
        )}

        {/* Map */}
        {game.startPoint && (
          <div className="mb-8">
            <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-muted)" }}>TÉRKÉP</p>
            <GameMap
              startPoint={game.startPoint as { lat: number; lng: number }}
              endPoint={game.endPoint as { lat: number; lng: number } | null}
              startName={getText(game.startName)}
              endName={getText(game.endName)}
            />
          </div>
        )}

        {/* Price + CTA */}
        <div className="fixed bottom-0 left-0 right-0 p-4 pb-safe"
          style={{ background: "rgba(10,14,26,0.95)", backdropFilter: "blur(16px)", borderTop: "1px solid var(--border-dim)" }}
        >
          <Container className="flex items-center gap-3">
            {game.price != null && (
              <div className="flex-shrink-0">
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Ár</p>
                <p className="text-lg font-black" style={{ color: "var(--cyan)" }}>
                  {game.price === 0 ? "Ingyenes" : `${game.price.toLocaleString("hu")} Ft`}
                </p>
              </div>
            )}
            <div className="flex-1 flex flex-col gap-2">
              {/* Free game or already owned */}
              {(!game.price || game.price === 0 || owned === true) && (
                <Link
                  href={`/games/${id}/play`}
                  className="btn-primary w-full text-center flex items-center justify-center gap-2"
                >
                  Játék indítása
                  <ChevronRight size={16} />
                </Link>
              )}

              {/* Paid game — not yet owned */}
              {game.price != null && game.price > 0 && owned === false && (
                <>
                  {user ? (
                    <Link
                      href={`/checkout/${id}`}
                      className="btn-primary w-full text-center flex items-center justify-center gap-2"
                    >
                      <ShoppingCart size={16} />
                      Megvásárlás
                    </Link>
                  ) : (
                    <Link
                      href={`/login?redirect=/games/${id}`}
                      className="btn-primary w-full text-center flex items-center justify-center gap-2"
                    >
                      <Lock size={16} />
                      Belépés szükséges
                    </Link>
                  )}
                </>
              )}

              {/* Ownership check in progress */}
              {game.price != null && game.price > 0 && owned === null && (
                <div
                  className="w-full h-11 rounded-xl flex items-center justify-center"
                  style={{ background: "var(--cyan-dim)" }}
                >
                  <div
                    className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: "var(--cyan)" }}
                  />
                </div>
              )}
            </div>
          </Container>
        </div>
      </Container>
      </motion.div>
    </div>
  );
}
