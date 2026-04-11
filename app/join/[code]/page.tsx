"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Search } from "lucide-react";
import { collection, query, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function JoinByCodePage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [error, setError] = useState("");
  const [searching, setSearching] = useState(true);

  useEffect(() => {
    if (!code) return;
    const normalized = code.toUpperCase();

    // Find sessions whose ID starts with the code (first 6 chars)
    (async () => {
      try {
        const snap = await getDocs(collection(db, "game_sessions"));
        const match = snap.docs.find((d) =>
          d.id.slice(0, 6).toUpperCase() === normalized &&
          d.data().status !== "ended"
        );
        if (match) {
          const gameId = match.data().gameId;
          router.replace(`/games/${gameId}/play?session=${match.id}`);
        } else {
          setError("Nem találtunk aktív szobát ezzel a kóddal.");
          setSearching(false);
        }
      } catch {
        setError("Hiba a szoba keresése közben.");
        setSearching(false);
      }
    })();
  }, [code, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "var(--bg-base)" }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
        {searching ? (
          <>
            <Loader2 size={40} className="animate-spin mx-auto mb-4" style={{ color: "var(--cyan)" }} />
            <p className="text-lg font-bold" style={{ fontFamily: "var(--font-cinzel), serif" }}>
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
            <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>{error}</p>
            <button onClick={() => router.push("/")} className="btn-primary">
              Főoldal
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
