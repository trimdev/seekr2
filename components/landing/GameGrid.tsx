"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { MapPin, Clock, Users, Lock, AlertCircle } from "lucide-react";
import { getGames } from "@/lib/firestore";
import { getText } from "@/lib/utils";
import { Container } from "@/components/ui/Container";
import type { Game } from "@/types";

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: "Könnyű",
  medium: "Közepes",
  hard: "Nehéz",
};
const DIFFICULTY_COLOR: Record<string, string> = {
  easy: "#22d3ee",
  medium: "#f59e0b",
  hard: "#ef4444",
};

const CITY_GRADIENT: Record<string, string> = {
  Budapest:     "linear-gradient(160deg, #0d1b3e 0%, #0f3460 60%, #1a4a7a 100%)",
  Siófok:       "linear-gradient(160deg, #051a2e 0%, #0a3550 60%, #0e6080 100%)",
  Balatonfüred: "linear-gradient(160deg, #061a10 0%, #0a3020 60%, #10502e 100%)",
  Keszthely:    "linear-gradient(160deg, #150a2a 0%, #2a1550 60%, #4a2080 100%)",
  Tihany:       "linear-gradient(160deg, #1f100a 0%, #3d1e0e 60%, #7a3c1a 100%)",
  default:      "linear-gradient(160deg, #0a0e1a 0%, #0f1628 60%, #162040 100%)",
};

function getCityKey(game: Game): string {
  const raw = getText(game.city);
  if (!raw) return "Egyéb";
  const lower = raw.toLowerCase();
  if (lower.includes("budapest")) return "Budapest";
  if (lower.includes("siófok") || lower.includes("siofok")) return "Siófok";
  if (lower.includes("balatonfüred") || lower.includes("balatonfured")) return "Balatonfüred";
  if (lower.includes("keszthely")) return "Keszthely";
  if (lower.includes("tihany")) return "Tihany";
  return raw;
}

function getGradient(game: Game): string {
  const city = getCityKey(game);
  return CITY_GRADIENT[city] ?? CITY_GRADIENT.default;
}

function getImageSrc(game: Game): string {
  const img = game.image || game.background || "";
  if (img.startsWith("http")) return img;
  return `/game-images/${game.id}.png`;
}

function GameCard({ game, index }: { game: Game; index: number }) {
  const gradient = getGradient(game);
  const price = game.price;
  const isPub = game.category === "pub";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ delay: (index % 2) * 0.08, duration: 0.4, ease: "easeOut" }}
      className="group"
    >
      <Link href={`/games/${game.id}`} className="block">
        {/* Poster card — full-bleed image, all text overlaid */}
        <div
          className="relative overflow-hidden rounded-xl"
          style={{
            aspectRatio: "3/4",
            background: gradient,
            boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
          }}
        >
          {/* Full-bleed cover image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getImageSrc(game)}
            alt={getText(game.title)}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-active:scale-105"
            loading="lazy"
            onError={(e) => {
              const el = e.target as HTMLImageElement;
              if (!el.src.includes("/game-images/")) {
                el.src = `/game-images/${game.id}.png`;
              } else {
                el.style.display = "none";
              }
            }}
          />

          {/* Gradient scrim — heavy at bottom, fades to transparent at top */}
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to top, rgba(5,8,18,0.98) 0%, rgba(5,8,18,0.85) 40%, rgba(5,8,18,0.3) 65%, transparent 100%)",
            }}
          />

          {/* Top badges */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between gap-1.5">
            {game.category && (
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full backdrop-blur-sm"
                style={{
                  background: isPub ? "rgba(180,50,30,0.75)" : "rgba(0,100,60,0.75)",
                  color: "#fff",
                  border: isPub ? "1px solid rgba(255,100,50,0.4)" : "1px solid rgba(0,200,100,0.3)",
                  fontSize: 11,
                  letterSpacing: "0.05em",
                }}
              >
                {isPub ? "KOCSMATÚRA" : "KÜLTÉRI"}
              </span>
            )}
            {game.difficulty && (
              <span
                className="text-xs font-black px-2 py-0.5 rounded-full backdrop-blur-sm ml-auto"
                style={{
                  background: `${DIFFICULTY_COLOR[game.difficulty]}22`,
                  color: DIFFICULTY_COLOR[game.difficulty],
                  border: `1px solid ${DIFFICULTY_COLOR[game.difficulty]}55`,
                  fontSize: 11,
                }}
              >
                {DIFFICULTY_LABEL[game.difficulty].toUpperCase()}
              </span>
            )}
          </div>

          {/* Bottom content — overlaid on image */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            {/* Price pill */}
            {price != null && (
              <div className="mb-2">
                <span
                  className="text-xs font-black px-2.5 py-1 rounded-full"
                  style={{
                    background: price === 0 ? "rgba(0,212,255,0.2)" : "rgba(255,107,53,0.2)",
                    color: price === 0 ? "var(--cyan)" : "var(--orange)",
                    border: `1px solid ${price === 0 ? "rgba(0,212,255,0.4)" : "rgba(255,107,53,0.4)"}`,
                  }}
                >
                  {price === 0 ? "INGYENES" : `${price.toLocaleString("hu")} Ft`}
                </span>
              </div>
            )}

            {/* Title */}
            <h3
              className="font-black text-white leading-tight mb-1"
              style={{
                fontFamily: "var(--font-cinzel), serif",
                fontSize: "clamp(15px, 4.5vw, 20px)",
                textShadow: "0 1px 8px rgba(0,0,0,0.9)",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {getText(game.title)}
            </h3>

            {/* Short description */}
            {(getText(game.shortdesc) || getText(game.desc)) && (
              <p
                className="mb-2"
                style={{
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: "rgba(210,225,250,0.85)",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {getText(game.shortdesc) || getText(game.desc)}
              </p>
            )}

            {/* Meta row */}
            <div className="flex items-center gap-2.5" style={{ color: "rgba(232,240,254,0.6)" }}>
              {game.duration && (
                <span className="flex items-center gap-1" style={{ fontSize: 12 }}>
                  <Clock size={11} />
                  {game.duration}
                </span>
              )}
              {game.players && (
                <span className="flex items-center gap-1" style={{ fontSize: 12 }}>
                  <Users size={11} />
                  {game.players}
                </span>
              )}
              {game.city && (
                <span className="flex items-center gap-1 ml-auto" style={{ fontSize: 12 }}>
                  <MapPin size={11} style={{ color: "var(--cyan)" }} />
                  <span style={{ color: "rgba(0,212,255,0.85)" }}>{getText(game.city)}</span>
                </span>
              )}
            </div>
          </div>

          {/* Subtle border glow on active */}
          <div
            className="absolute inset-0 rounded-xl opacity-0 group-active:opacity-100 transition-opacity duration-150"
            style={{ border: "1px solid rgba(0,212,255,0.5)", boxShadow: "inset 0 0 20px rgba(0,212,255,0.08)" }}
          />
        </div>
      </Link>
    </motion.div>
  );
}

export function GameGrid() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getGames()
      .then((list) => {
        console.log("[GameGrid] loaded", list.length, "games");
        setGames(list);
      })
      .catch((err) => {
        console.error("[GameGrid] fetch error:", err?.code, err?.message);
        setError(`Hiba: ${err?.message || err?.code || "ismeretlen hiba"}`);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Container>
        <div className="grid grid-cols-2 gap-2.5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-xl animate-pulse"
              style={{ aspectRatio: "3/4", background: "var(--bg-surface)" }}
            />
          ))}
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <div
          className="rounded-2xl p-5 flex flex-col items-center gap-3 text-center"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
        >
          <AlertCircle size={32} style={{ color: "#ef4444", opacity: 0.7 }} />
          <div>
            <p className="font-semibold text-sm mb-1">Nem sikerült betölteni a játékokat</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{error}</p>
          </div>
          <button
            onClick={() => {
              setLoading(true);
              setError(null);
              getGames().then(setGames).catch((e) => setError(e?.message)).finally(() => setLoading(false));
            }}
            className="btn-ghost text-sm px-4 py-2"
          >
            Újra
          </button>
        </div>
      </Container>
    );
  }

  if (!games.length) {
    return (
      <Container>
        <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>
          <Lock size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Hamarosan érkeznek a játékok...</p>
        </div>
      </Container>
    );
  }

  // Group by city
  const groups = new Map<string, Game[]>();
  for (const game of games) {
    const city = getCityKey(game);
    if (!groups.has(city)) groups.set(city, []);
    groups.get(city)!.push(game);
  }

  const CITY_ORDER = ["Budapest", "Siófok", "Balatonfüred", "Keszthely", "Tihany"];
  const sortedCities = [
    ...CITY_ORDER.filter((c) => groups.has(c)),
    ...[...groups.keys()].filter((c) => !CITY_ORDER.includes(c) && c !== "Egyéb"),
    ...(groups.has("Egyéb") ? ["Egyéb"] : []),
  ];

  let globalIndex = 0;

  return (
    <div className="space-y-12">
      {sortedCities.map((city) => {
        const cityGames = groups.get(city)!;
        return (
          <section key={city}>
            <Container>
              {/* City header */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="flex items-center gap-2 flex-shrink-0"
                >
                  <MapPin size={14} style={{ color: "var(--cyan)" }} />
                  <h2
                    className="font-black tracking-wide"
                    style={{
                      fontFamily: "var(--font-cinzel), serif",
                      fontSize: "clamp(15px, 4vw, 20px)",
                      color: "var(--text-primary)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {city}
                  </h2>
                </div>
                <div className="flex-1" style={{ height: 1, background: "linear-gradient(to right, rgba(0,212,255,0.3), transparent)" }} />
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                  style={{
                    background: "rgba(0,212,255,0.08)",
                    color: "var(--cyan)",
                    border: "1px solid rgba(0,212,255,0.15)",
                    fontSize: 11,
                  }}
                >
                  {cityGames.length} játék
                </span>
              </div>

              {/* 2-column poster grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {cityGames.map((game) => {
                  const idx = globalIndex++;
                  return <GameCard key={game.id} game={game} index={idx} />;
                })}
              </div>
            </Container>
          </section>
        );
      })}
    </div>
  );
}
