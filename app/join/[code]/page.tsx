"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Search } from "lucide-react";

export default function JoinByCodePage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [error, setError] = useState("");
  const [searching, setSearching] = useState(true);

  useEffect(() => {
    if (!code) return;
    const normalized = code.toUpperCase();

    (async () => {
      try {
        const res = await fetch(`/api/find-session?code=${normalized}`);
        const data = await res.json();

        if (res.ok && data.gameId && data.sessionId) {
          router.replace(`/games/${data.gameId}/play?session=${data.sessionId}`);
        } else {
          setError(data.error ?? "Nem találtunk aktív szobát ezzel a kóddal.");
          setSearching(false);
        }
      } catch {
        setError("Hiba a szoba keresése közben.");
        setSearching(false);
      }
    })();
  }, [code, router]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "var(--bg-base)" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        {searching ? (
          <>
            <Loader2
              size={40}
              className="animate-spin mx-auto mb-4"
              style={{ color: "var(--cyan)" }}
            />
            <p
              className="text-lg font-bold"
              style={{ fontFamily: "var(--font-cinzel), serif" }}
            >
              Szoba keresése…
            </p>
            <p className="text-sm mt-2 font-mono" style={{ color: "var(--cyan)" }}>
              {code?.toUpperCase()}
            </p>
          </>
        ) : (
          <>
            <Search size={40} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-bold mb-2">Szoba nem található</p>
            <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
              {error}
            </p>
            <button onClick={() => router.push("/join")} className="btn-primary">
              Próbáld újra
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
