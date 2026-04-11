"use client";

import { useEffect, useState } from "react";
import { getGame, getStations } from "@/lib/firestore";
import type { Game, Station } from "@/types";

export function useGame(gameId: string) {
  const [game, setGame] = useState<Game | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) return;
    setLoading(true);
    Promise.all([getGame(gameId), getStations(gameId)])
      .then(([g, s]) => {
        setGame(g);
        setStations(s);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [gameId]);

  return { game, stations, loading, error };
}
