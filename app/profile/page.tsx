"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { getText, avatarColor } from "@/lib/utils";
import { Container } from "@/components/ui/Container";
import type { Game } from "@/types";

// ── Types ────────────────────────────────────────────────────────────────────

interface OwnedGame {
  gameId: string;
  purchasedAt: string;
  confirmedBy: string;
  paymentIntentId?: string;
  voucherCode?: string;
}

interface GameProgress {
  currentStep: number;
}

interface ActiveSession {
  sessionId: string;
  role: "host" | "guest";
  gameId: string;
}

interface GameCard {
  owned: OwnedGame;
  game: Game | null;
  progress: GameProgress | null;
  totalStations: number;
  activeSession: ActiveSession | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatHungarianDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("hu-HU", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

// ── Profile Page ─────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [gameCards, setGameCards] = useState<GameCard[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Voucher state
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherStatus, setVoucherStatus] = useState<
    "idle" | "loading" | "select_game" | "success" | "error"
  >("idle");
  const [voucherMessage, setVoucherMessage] = useState("");
  const [voucherGames, setVoucherGames] = useState<Game[]>([]);
  const [selectedGameId, setSelectedGameId] = useState("");
  const [pendingVoucherCode, setPendingVoucherCode] = useState("");

  // ── Redirect if not logged in ─────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  // ── Load owned games ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    const uid = user.uid;

    (async () => {
      setDataLoading(true);
      try {
        const ownedSnap = await getDocs(
          collection(db, "users", uid, "owned_games")
        );
        const ownedList: OwnedGame[] = ownedSnap.docs.map((d) => ({
          gameId: d.id,
          ...(d.data() as Omit<OwnedGame, "gameId">),
        }));

        const cards: GameCard[] = await Promise.all(
          ownedList.map(async (owned) => {
            const gid = owned.gameId;

            const [gameSnap, progressSnap, stationsSnap, sessionSnap] =
              await Promise.all([
                getDoc(doc(db, "games", gid)),
                getDoc(doc(db, "users", uid, "progress", gid)),
                getDocs(collection(db, "games", gid, "stations")),
                getDoc(doc(db, "users", uid, "active_session", gid)),
              ]);

            const game: Game | null = gameSnap.exists()
              ? ({ id: gameSnap.id, ...gameSnap.data() } as Game)
              : null;

            const progress: GameProgress | null = progressSnap.exists()
              ? (progressSnap.data() as GameProgress)
              : null;

            const totalStations = stationsSnap.size;

            const activeSession: ActiveSession | null = sessionSnap.exists()
              ? (sessionSnap.data() as ActiveSession)
              : null;

            return { owned, game, progress, totalStations, activeSession };
          })
        );

        setGameCards(cards);
      } finally {
        setDataLoading(false);
      }
    })();
  }, [user]);

  // ── Voucher: step 1 — lookup ──────────────────────────────────────────────
  async function handleVoucherLookup() {
    if (!user || !voucherCode.trim()) return;
    const code = voucherCode.trim().toUpperCase();
    setVoucherStatus("loading");
    setVoucherMessage("");

    try {
      const voucherSnap = await getDoc(doc(db, "vouchers", code));
      if (!voucherSnap.exists()) {
        setVoucherStatus("error");
        setVoucherMessage("Érvénytelen voucher kód.");
        return;
      }
      const vd = voucherSnap.data() as {
        status: string;
        redeemedCount: number;
        redeemLimit: number;
      };
      if (vd.status !== "active") {
        setVoucherStatus("error");
        setVoucherMessage("Ez a voucher már felhasználásra került.");
        return;
      }
      if (vd.redeemedCount >= vd.redeemLimit) {
        setVoucherStatus("error");
        setVoucherMessage("Ez a voucher elérte a felhasználási limitet.");
        return;
      }

      // Load all games for selection
      const gamesSnap = await getDocs(collection(db, "games"));
      const games: Game[] = gamesSnap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Game))
        .filter((g) => g.active !== false);

      setPendingVoucherCode(code);
      setVoucherGames(games);
      setSelectedGameId(games[0]?.id ?? "");
      setVoucherStatus("select_game");
    } catch {
      setVoucherStatus("error");
      setVoucherMessage("Hiba történt a voucher ellenőrzésekor.");
    }
  }

  // ── Voucher: step 2 — redeem ──────────────────────────────────────────────
  async function handleVoucherRedeem() {
    if (!user || !selectedGameId || !pendingVoucherCode) return;
    const uid = user.uid;
    setVoucherStatus("loading");

    try {
      await runTransaction(db, async (tx) => {
        const vRef = doc(db, "vouchers", pendingVoucherCode);
        const vSnap = await tx.get(vRef);
        if (!vSnap.exists()) throw new Error("not_found");
        const vd = vSnap.data() as {
          status: string;
          redeemedCount: number;
          redeemLimit: number;
        };
        if (vd.status !== "active" || vd.redeemedCount >= vd.redeemLimit) {
          throw new Error("invalid");
        }
        tx.update(vRef, {
          status: "redeemed",
          redeemedCount: vd.redeemedCount + 1,
        });
        tx.set(
          doc(db, "users", uid, "owned_games", selectedGameId),
          {
            purchasedAt: new Date().toISOString(),
            confirmedBy: "voucher",
            voucherCode: pendingVoucherCode,
          }
        );
      });

      setVoucherStatus("success");
      setVoucherMessage("Sikeresen beváltottad a vouchert! Frissítsd az oldalt.");
      setVoucherCode("");
    } catch (err: unknown) {
      const msg =
        err instanceof Error && err.message === "invalid"
          ? "A voucher időközben érvénytelenné vált."
          : "Hiba történt a beváltáskor.";
      setVoucherStatus("error");
      setVoucherMessage(msg);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (authLoading) {
    return <ProfileSkeleton />;
  }

  if (!user) return null;

  const initials = (user.displayName || user.email || "?").charAt(0).toUpperCase();
  const avatarBg = avatarColor(0);

  return (
    <div
      className="min-h-screen py-8"
      style={{ background: "var(--bg-base)" }}
    >
      <Container>
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="glass rounded-2xl p-6 mb-8 flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar */}
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black flex-shrink-0"
            style={{
              background: avatarBg,
              color: "#000",
              fontFamily: "var(--font-cinzel), serif",
            }}
          >
            {initials}
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <h1
              className="text-2xl font-black mb-1"
              style={{ fontFamily: "var(--font-cinzel), serif" }}
            >
              {user.displayName || "Felhasználó"}
            </h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {user.email}
            </p>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="btn-ghost flex-shrink-0"
            style={{ minHeight: "42px", padding: "10px 20px" }}
          >
            Kijelentkezés
          </button>
        </div>

        {/* ── My Games ───────────────────────────────────────────── */}
        <section className="mb-10">
          <h2
            className="text-xl font-black mb-5"
            style={{ fontFamily: "var(--font-cinzel), serif", color: "var(--cyan)" }}
          >
            Saját játékaim
          </h2>

          {dataLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="glass rounded-2xl h-48 animate-pulse"
                  style={{ opacity: 0.5 }}
                />
              ))}
            </div>
          ) : gameCards.length === 0 ? (
            <div
              className="glass rounded-2xl p-10 flex flex-col items-center gap-4 text-center"
            >
              <span className="text-4xl">🗺️</span>
              <p
                className="text-lg font-semibold"
                style={{ color: "var(--text-muted)" }}
              >
                Még nincs játékod
              </p>
              <Link href="/games" className="btn-primary" style={{ padding: "12px 28px" }}>
                Játékok böngészése
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {gameCards.map(({ owned, game, progress, totalStations, activeSession }) => {
                const title = game ? getText(game.title) : owned.gameId;
                const city = game ? getText(game.city) : "";
                const currentStep = progress?.currentStep ?? 0;
                const progressPct =
                  totalStations > 0
                    ? Math.round((currentStep / totalStations) * 100)
                    : 0;

                const imageUrl =
                  game?.image && game.image.startsWith("http")
                    ? game.image
                    : `/game-images/${owned.gameId}.png`;

                return (
                  <div
                    key={owned.gameId}
                    className="glass rounded-2xl overflow-hidden"
                    style={{ border: "1px solid var(--border-dim)" }}
                  >
                    {/* Game image */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt={title}
                      className="w-full h-36 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />

                    <div className="p-4">
                      {/* Title + city */}
                      <h3
                        className="text-base font-black mb-0.5"
                        style={{ fontFamily: "var(--font-cinzel), serif" }}
                      >
                        {title}
                      </h3>
                      {city && (
                        <p
                          className="text-xs mb-2"
                          style={{ color: "var(--cyan)" }}
                        >
                          {city}
                        </p>
                      )}

                      {/* Purchase date */}
                      <p
                        className="text-xs mb-3"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Vásárolva: {formatHungarianDate(owned.purchasedAt)}
                      </p>

                      {/* Progress bar */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className="text-xs"
                            style={{ color: "var(--text-muted)" }}
                          >
                            Haladás
                          </span>
                          <span
                            className="text-xs font-semibold"
                            style={{ color: "var(--cyan)" }}
                          >
                            {currentStep}/{totalStations} állomás
                          </span>
                        </div>
                        <div
                          className="h-1.5 rounded-full"
                          style={{ background: "var(--bg-surface)" }}
                        >
                          <div
                            className="h-1.5 rounded-full transition-all duration-500"
                            style={{
                              width: `${progressPct}%`,
                              background: "var(--cyan)",
                            }}
                          />
                        </div>
                      </div>

                      {/* CTA */}
                      {activeSession ? (
                        <Link
                          href={`/games/${owned.gameId}/play?session=${activeSession.sessionId}`}
                          className="btn-primary w-full text-center block"
                          style={{ padding: "10px 0", fontSize: "14px" }}
                        >
                          Folytatás
                        </Link>
                      ) : (
                        <Link
                          href={`/games/${owned.gameId}/play`}
                          className="btn-ghost w-full text-center block"
                          style={{ padding: "10px 0", fontSize: "14px" }}
                        >
                          Játék indítása
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Voucher section ─────────────────────────────────────── */}
        <section className="mb-10">
          <h2
            className="text-xl font-black mb-5"
            style={{ fontFamily: "var(--font-cinzel), serif", color: "var(--orange)" }}
          >
            Voucher beváltása
          </h2>

          <div
            className="glass rounded-2xl p-6"
            style={{ border: "1px solid var(--border-dim)" }}
          >
            {voucherStatus === "select_game" ? (
              <div className="flex flex-col gap-4">
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Válaszd ki, melyik játékhoz szeretnéd a vouchert beváltani:
                </p>
                <select
                  className="input-seekr"
                  value={selectedGameId}
                  onChange={(e) => setSelectedGameId(e.target.value)}
                >
                  {voucherGames.map((g) => (
                    <option key={g.id} value={g.id}>
                      {getText(g.title)} — {getText(g.city)}
                    </option>
                  ))}
                </select>
                <div className="flex gap-3">
                  <button
                    onClick={handleVoucherRedeem}
                    className="btn-primary flex-1"
                    disabled={!selectedGameId}
                  >
                    Beváltás
                  </button>
                  <button
                    onClick={() => {
                      setVoucherStatus("idle");
                      setPendingVoucherCode("");
                    }}
                    className="btn-ghost"
                  >
                    Mégse
                  </button>
                </div>
              </div>
            ) : voucherStatus === "success" ? (
              <div className="text-center py-4">
                <p className="text-2xl mb-2">🎉</p>
                <p
                  className="font-semibold mb-4"
                  style={{ color: "var(--cyan)" }}
                >
                  {voucherMessage}
                </p>
                <button
                  onClick={() => {
                    setVoucherStatus("idle");
                    setVoucherMessage("");
                  }}
                  className="btn-ghost"
                >
                  Bezárás
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Voucher kód formátuma: SKR-XXXX-XXXX
                </p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    className="input-seekr flex-1"
                    placeholder="SKR-XXXX-XXXX"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleVoucherLookup();
                    }}
                    disabled={voucherStatus === "loading"}
                  />
                  <button
                    onClick={handleVoucherLookup}
                    className="btn-primary flex-shrink-0"
                    disabled={
                      voucherStatus === "loading" || !voucherCode.trim()
                    }
                    style={{ padding: "14px 20px" }}
                  >
                    {voucherStatus === "loading" ? "..." : "Beváltás"}
                  </button>
                </div>

                {voucherStatus === "error" && voucherMessage && (
                  <p
                    className="text-sm"
                    style={{ color: "var(--orange)" }}
                  >
                    {voucherMessage}
                  </p>
                )}
              </div>
            )}
          </div>
        </section>
      </Container>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div
      className="min-h-screen py-8"
      style={{ background: "var(--bg-base)" }}
    >
      <Container>
        <div
          className="glass rounded-2xl p-6 mb-8 flex items-center gap-5 animate-pulse"
        >
          <div
            className="w-16 h-16 rounded-full flex-shrink-0"
            style={{ background: "var(--bg-surface)" }}
          />
          <div className="flex-1 flex flex-col gap-2">
            <div
              className="h-5 w-40 rounded-lg"
              style={{ background: "var(--bg-surface)" }}
            />
            <div
              className="h-4 w-56 rounded-lg"
              style={{ background: "var(--bg-surface)" }}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="glass rounded-2xl h-48 animate-pulse"
              style={{ opacity: 0.4 }}
            />
          ))}
        </div>
      </Container>
    </div>
  );
}
