"use client";

import { useEffect, useState } from "react";
import { subscribeSession } from "@/lib/firestore";
import type { GameSession } from "@/types";

export function useSession(sessionId: string | null) {
  const [session, setSession] = useState<GameSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeSession(sessionId, (s) => {
      setSession(s);
      setLoading(false);
    });
    return () => unsub();
  }, [sessionId]);

  return { session, loading };
}
