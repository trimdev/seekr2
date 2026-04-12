"use client";

import { useEffect, useState, useMemo } from "react";
import { GameGrid } from "@/components/landing/GameGrid";
import { Container } from "@/components/ui/Container";
import { getGames } from "@/lib/firestore";
import { getText } from "@/lib/utils";
import type { Game } from "@/types";

const CITY_ORDER = ["Budapest", "Siófok", "Balatonfüred", "Keszthely", "Tihany"];

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

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  useEffect(() => {
    getGames().then(setGames).catch(console.error);
  }, []);

  const cities = useMemo(() => {
    const citySet = new Set<string>();
    for (const game of games) citySet.add(getCityKey(game));
    return [
      ...CITY_ORDER.filter((c) => citySet.has(c)),
      ...[...citySet].filter((c) => !CITY_ORDER.includes(c) && c !== "Egyéb"),
      ...(citySet.has("Egyéb") ? ["Egyéb"] : []),
    ];
  }, [games]);

  return (
    <main className="pb-20">
      <Container className="py-10">
        <p
          className="text-xs font-semibold tracking-[0.3em] uppercase mb-2"
          style={{ color: "var(--cyan)" }}
        >
          Kalandjátékok
        </p>
        <h1
          className="text-3xl font-black mb-1"
          style={{ fontFamily: "var(--font-cinzel), serif" }}
        >
          Válassz helyszínt
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          Minden játék egy igazi szabadtéri kaland.
        </p>

        {/* City filter tabs */}
        {cities.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {/* All tab */}
            <button
              onClick={() => setSelectedCity(null)}
              className="px-4 py-1.5 rounded-full text-sm font-semibold transition-colors duration-150"
              style={
                selectedCity === null
                  ? {
                      background: "var(--cyan)",
                      color: "#0a0e1a",
                      border: "1px solid var(--cyan)",
                    }
                  : {
                      background: "transparent",
                      color: "var(--text-primary)",
                      border: "1px solid rgba(0,212,255,0.2)",
                    }
              }
            >
              Összes
            </button>

            {cities.map((cityName) => (
              <button
                key={cityName}
                onClick={() => setSelectedCity(cityName)}
                className="px-4 py-1.5 rounded-full text-sm font-semibold transition-colors duration-150"
                style={
                  selectedCity === cityName
                    ? {
                        background: "var(--cyan)",
                        color: "#0a0e1a",
                        border: "1px solid var(--cyan)",
                      }
                    : {
                        background: "transparent",
                        color: "var(--text-primary)",
                        border: "1px solid rgba(0,212,255,0.2)",
                      }
                }
              >
                {cityName}
              </button>
            ))}
          </div>
        )}
      </Container>

      <GameGrid city={selectedCity} />
    </main>
  );
}
