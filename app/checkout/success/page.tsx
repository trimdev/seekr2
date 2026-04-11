"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, AlertCircle, Loader } from "lucide-react";
import { getGame } from "@/lib/firestore";
import { getText } from "@/lib/utils";
import { auth } from "@/lib/firebase";
import { Container } from "@/components/ui/Container";
import type { Game } from "@/types";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const gameId = searchParams.get("gameId");
  const paymentIntentId = searchParams.get("payment_intent");

  const [game, setGame] = useState<Game | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const verifiedRef = useRef(false);

  useEffect(() => {
    if (!gameId) {
      router.replace("/games");
      return;
    }
    getGame(gameId).then(setGame);
  }, [gameId, router]);

  useEffect(() => {
    if (!gameId || !paymentIntentId || verifiedRef.current) return;
    verifiedRef.current = true;

    // Wait briefly for auth to initialise
    const doVerify = async () => {
      // Poll until auth is ready (max 5s)
      let attempts = 0;
      while (!auth.currentUser && attempts < 10) {
        await new Promise((r) => setTimeout(r, 500));
        attempts++;
      }

      if (!auth.currentUser) {
        setErrorMsg("Bejelentkezés szükséges a vásárlás igazolásához.");
        setStatus("error");
        return;
      }

      try {
        const token = await auth.currentUser.getIdToken();
        const res = await fetch("/api/verify-purchase", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ gameId, paymentIntentId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Ismeretlen hiba");
        setStatus("success");
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : "Hiba a vásárlás igazolása közben.");
        setStatus("error");
      }
    };

    doVerify();
  }, [gameId, paymentIntentId]);

  return (
    <div
      className="min-h-screen flex items-center justify-center py-12"
      style={{ background: "var(--bg-base)" }}
    >
      <Container>
        <div className="max-w-md mx-auto">
          {status === "loading" && (
            <div className="glass rounded-2xl p-8 flex flex-col items-center gap-4 text-center">
              <Loader
                size={40}
                className="animate-spin"
                style={{ color: "var(--cyan)" }}
              />
              <p style={{ color: "var(--text-muted)" }}>Vásárlás igazolása...</p>
            </div>
          )}

          {status === "success" && (
            <div
              className="glass-cyan rounded-2xl p-8 flex flex-col items-center gap-4 text-center"
            >
              <CheckCircle size={48} style={{ color: "var(--cyan)" }} />
              <h1
                className="text-2xl font-black"
                style={{ fontFamily: "var(--font-cinzel), serif" }}
              >
                Sikeres vásárlás!
              </h1>
              {game && (
                <p style={{ color: "var(--text-muted)" }}>
                  <span style={{ color: "var(--text-primary)" }}>
                    {getText(game.title)}
                  </span>{" "}
                  most elérhető a fiókodban.
                </p>
              )}
              {gameId && (
                <Link
                  href={`/games/${gameId}`}
                  className="btn-primary mt-2 w-full text-center"
                >
                  Játék megnyitása
                </Link>
              )}
            </div>
          )}

          {status === "error" && (
            <div
              className="glass rounded-2xl p-8 flex flex-col items-center gap-4 text-center"
              style={{ borderColor: "var(--orange)" }}
            >
              <AlertCircle size={48} style={{ color: "var(--orange)" }} />
              <h1 className="text-2xl font-black">Hiba történt</h1>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {errorMsg ?? "Nem sikerült igazolni a vásárlást."}
              </p>
              <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                Ha a fizetés sikeresen megtörtént, a hozzáférés néhány percen
                belül automatikusan aktiválódik.
              </p>
              {gameId && (
                <Link href={`/games/${gameId}`} className="btn-ghost mt-2">
                  Vissza a játékhoz
                </Link>
              )}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: "var(--bg-base)" }}
        >
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "var(--cyan)" }}
          />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
