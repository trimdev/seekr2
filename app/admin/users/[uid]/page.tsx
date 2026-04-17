"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getGames } from "@/lib/firestore";
import { getText } from "@/lib/utils";
import { Container } from "@/components/ui/Container";
import type { Game } from "@/types";
import {
  ArrowLeft,
  Loader2,
  RotateCcw,
  Trash2,
  ShieldCheck,
  ShieldOff,
  Plus,
  GamepadIcon,
  Activity,
  BookOpen,
  User,
} from "lucide-react";

interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  roles?: { admin?: boolean };
}

interface OwnedGame {
  gameId: string;
  grantedAt?: unknown;
  grantedBy?: string;
  gameName?: string;
}

interface ProgressEntry {
  gameId: string;
  currentStep: number;
  gameName?: string;
  totalStations?: number;
}

interface ActiveSessionEntry {
  gameId: string;
  sessionId: string;
  role: string;
  updatedAt?: unknown;
  gameName?: string;
}

export default function AdminUserDetailPage() {
  const { uid } = useParams<{ uid: string }>();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [ownedGames, setOwnedGames] = useState<OwnedGame[]>([]);
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSessionEntry[]>([]);
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [addGameId, setAddGameId] = useState("");

  const loadAll = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const [userSnap, ownedSnap, progressSnap, sessionSnap, games] = await Promise.all([
        getDoc(doc(db, "users", uid)),
        getDocs(collection(db, "users", uid, "owned_games")),
        getDocs(collection(db, "users", uid, "progress")),
        getDocs(collection(db, "users", uid, "active_session")),
        getGames(),
      ]);

      setAllGames(games);

      const gameMap = new Map(games.map((g) => [g.id, g]));

      if (userSnap.exists()) {
        setUser({ id: userSnap.id, ...userSnap.data() } as UserProfile);
      }

      setOwnedGames(
        ownedSnap.docs.map((d) => ({
          gameId: d.id,
          ...d.data(),
          gameName: getText(gameMap.get(d.id)?.title) || d.id,
        }))
      );

      setProgress(
        progressSnap.docs.map((d) => ({
          gameId: d.id,
          currentStep: (d.data().currentStep as number) ?? 0,
          gameName: getText(gameMap.get(d.id)?.title) || d.id,
        }))
      );

      setActiveSessions(
        sessionSnap.docs.map((d) => ({
          gameId: d.id,
          ...d.data(),
          gameName: getText(gameMap.get(d.id)?.title) || d.id,
        } as ActiveSessionEntry))
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function resetProgress(gameId: string) {
    if (!confirm("Visszaállítod a haladást 0-ra?")) return;
    setBusy(`prog:${gameId}`);
    try {
      await setDoc(doc(db, "users", uid, "progress", gameId), { currentStep: 0 });
      setProgress((prev) =>
        prev.map((p) => p.gameId === gameId ? { ...p, currentStep: 0 } : p)
      );
    } catch (e) { console.error(e); alert("Hiba!"); }
    finally { setBusy(null); }
  }

  async function deleteProgress(gameId: string) {
    if (!confirm("Törlöd a haladást?")) return;
    setBusy(`prog-del:${gameId}`);
    try {
      await deleteDoc(doc(db, "users", uid, "progress", gameId));
      setProgress((prev) => prev.filter((p) => p.gameId !== gameId));
    } catch (e) { console.error(e); alert("Hiba!"); }
    finally { setBusy(null); }
  }

  async function revokeGame(gameId: string) {
    if (!confirm("Elveszed a hozzáférést ehhez a játékhoz?")) return;
    setBusy(`own:${gameId}`);
    try {
      await deleteDoc(doc(db, "users", uid, "owned_games", gameId));
      setOwnedGames((prev) => prev.filter((g) => g.gameId !== gameId));
    } catch (e) { console.error(e); alert("Hiba!"); }
    finally { setBusy(null); }
  }

  async function grantGame() {
    if (!addGameId) return;
    if (ownedGames.some((g) => g.gameId === addGameId)) {
      alert("Ez a játék már hozzá van rendelve."); return;
    }
    setBusy(`grant:${addGameId}`);
    try {
      await setDoc(doc(db, "users", uid, "owned_games", addGameId), {
        grantedAt: serverTimestamp(),
        grantedBy: "admin",
      });
      const game = allGames.find((g) => g.id === addGameId);
      setOwnedGames((prev) => [
        ...prev,
        { gameId: addGameId, grantedBy: "admin", gameName: getText(game?.title) || addGameId },
      ]);
      setAddGameId("");
    } catch (e) { console.error(e); alert("Hiba!"); }
    finally { setBusy(null); }
  }

  async function clearSession(gameId: string) {
    if (!confirm("Törlöd az aktív szesziót?")) return;
    setBusy(`sess:${gameId}`);
    try {
      await deleteDoc(doc(db, "users", uid, "active_session", gameId));
      setActiveSessions((prev) => prev.filter((s) => s.gameId !== gameId));
    } catch (e) { console.error(e); alert("Hiba!"); }
    finally { setBusy(null); }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <Loader2 className="animate-spin" size={32} style={{ color: "var(--cyan)" }} />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <p style={{ color: "var(--text-muted)" }}>Felhasználó nem található.</p>
      </main>
    );
  }

  const isAdmin = user.roles?.admin === true;
  const unownedGames = allGames.filter((g) => !ownedGames.some((o) => o.gameId === g.id));

  return (
    <main className="min-h-screen pb-20" style={{ background: "var(--bg-base)" }}>
      <Container className="py-10">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/admin/users" className="btn-ghost text-sm px-3 py-2 min-h-0">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <p className="text-xs font-semibold tracking-[0.3em] uppercase" style={{ color: "var(--cyan)" }}>
              Admin / Felhasználók / Kezelés
            </p>
            <h1
              className="text-2xl font-black"
              style={{ fontFamily: "var(--font-cinzel), Cinzel, serif", color: "var(--text-primary)" }}
            >
              {user.name ?? "Névtelen"}
            </h1>
          </div>
        </div>

        {/* Profile card */}
        <div className="glass p-5 mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.2)" }}
          >
            <User size={22} style={{ color: "var(--cyan)" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold" style={{ color: "var(--text-primary)" }}>{user.name ?? "—"}</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{user.email ?? "—"}</p>
            <p className="font-mono text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>{uid}</p>
          </div>
          {isAdmin && (
            <span
              className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-semibold self-start"
              style={{ background: "var(--cyan-dim)", color: "var(--cyan)", border: "1px solid var(--border-glow)" }}
            >
              <ShieldCheck size={11} /> Admin
            </span>
          )}
        </div>

        {/* Owned games */}
        <Section icon={<GamepadIcon size={16} />} title="Megvásárolt játékok" count={ownedGames.length}>
          {ownedGames.length === 0 ? (
            <EmptyState label="Nincs megvásárolt játék." />
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--border-dim)" }}>
              {ownedGames.map((og) => (
                <div key={og.gameId} className="flex items-center gap-3 px-4 py-3">
                  <span className="flex-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {og.gameName}
                  </span>
                  {og.grantedBy === "admin" && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(255,107,53,0.1)", color: "var(--orange)" }}>
                      Admin adomány
                    </span>
                  )}
                  <button
                    onClick={() => revokeGame(og.gameId)}
                    disabled={busy === `own:${og.gameId}`}
                    className="btn-ghost text-xs px-3 py-1.5 min-h-0 flex items-center gap-1"
                    style={{ color: "var(--orange)", borderColor: "rgba(255,107,53,0.2)" }}
                  >
                    {busy === `own:${og.gameId}` ? <Loader2 size={12} className="animate-spin" /> : <><ShieldOff size={12} /> Elvesz</>}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Grant access */}
          {unownedGames.length > 0 && (
            <div className="px-4 py-3 flex items-center gap-2" style={{ borderTop: "1px solid var(--border-dim)" }}>
              <select
                value={addGameId}
                onChange={(e) => setAddGameId(e.target.value)}
                className="flex-1 rounded-xl px-3 py-2 text-sm"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid var(--border-dim)",
                  color: addGameId ? "var(--text-primary)" : "var(--text-faint)",
                  outline: "none",
                }}
              >
                <option value="">Játék kiválasztása…</option>
                {unownedGames.map((g) => (
                  <option key={g.id} value={g.id} style={{ background: "var(--bg-surface)" }}>
                    {getText(g.title)}
                  </option>
                ))}
              </select>
              <button
                onClick={grantGame}
                disabled={!addGameId || !!busy}
                className="btn-primary text-xs px-4 py-2 min-h-0 flex items-center gap-1"
              >
                {busy?.startsWith("grant:") ? <Loader2 size={12} className="animate-spin" /> : <><Plus size={13} /> Hozzáad</>}
              </button>
            </div>
          )}
        </Section>

        {/* Progress */}
        <Section icon={<BookOpen size={16} />} title="Haladás (szóló)" count={progress.length}>
          {progress.length === 0 ? (
            <EmptyState label="Nincs mentett haladás." />
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--border-dim)" }}>
              {progress.map((p) => (
                <div key={p.gameId} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{p.gameName}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {p.currentStep}. állomás
                    </p>
                  </div>
                  <button
                    onClick={() => resetProgress(p.gameId)}
                    disabled={!!busy}
                    className="btn-ghost text-xs px-3 py-1.5 min-h-0 flex items-center gap-1"
                    style={{ color: "var(--cyan)", borderColor: "rgba(0,212,255,0.2)" }}
                  >
                    {busy === `prog:${p.gameId}` ? <Loader2 size={12} className="animate-spin" /> : <><RotateCcw size={12} /> Visszaállít</>}
                  </button>
                  <button
                    onClick={() => deleteProgress(p.gameId)}
                    disabled={!!busy}
                    className="btn-ghost text-xs px-3 py-1.5 min-h-0 flex items-center gap-1"
                    style={{ color: "var(--orange)", borderColor: "rgba(255,107,53,0.2)" }}
                  >
                    {busy === `prog-del:${p.gameId}` ? <Loader2 size={12} className="animate-spin" /> : <><Trash2 size={12} /> Töröl</>}
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Active sessions */}
        <Section icon={<Activity size={16} />} title="Aktív szessziók" count={activeSessions.length}>
          {activeSessions.length === 0 ? (
            <EmptyState label="Nincs aktív szesszió." />
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--border-dim)" }}>
              {activeSessions.map((s) => (
                <div key={s.gameId} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{s.gameName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className="text-xs px-1.5 py-0.5 rounded font-mono"
                        style={{ background: "rgba(0,212,255,0.1)", color: "var(--cyan)" }}
                      >
                        {s.role}
                      </span>
                      <span className="text-xs font-mono" style={{ color: "var(--text-faint)" }}>
                        {s.sessionId?.slice(0, 8)}…
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/games/${s.gameId}/play?session=${s.sessionId}`}
                    target="_blank"
                    className="btn-ghost text-xs px-3 py-1.5 min-h-0 inline-flex items-center gap-1"
                    style={{ color: "var(--text-muted)", borderColor: "var(--border-dim)" }}
                  >
                    Megtekint
                  </Link>
                  <button
                    onClick={() => clearSession(s.gameId)}
                    disabled={!!busy}
                    className="btn-ghost text-xs px-3 py-1.5 min-h-0 flex items-center gap-1"
                    style={{ color: "var(--orange)", borderColor: "rgba(255,107,53,0.2)" }}
                  >
                    {busy === `sess:${s.gameId}` ? <Loader2 size={12} className="animate-spin" /> : <><Trash2 size={12} /> Töröl</>}
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>

      </Container>
    </main>
  );
}

function Section({
  icon,
  title,
  count,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="glass overflow-hidden mb-6">
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderBottom: "1px solid var(--border-dim)" }}
      >
        <span style={{ color: "var(--cyan)" }}>{icon}</span>
        <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{title}</p>
        <span
          className="ml-auto text-xs px-2 py-0.5 rounded-full font-mono"
          style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-faint)" }}
        >
          {count}
        </span>
      </div>
      {children}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <p className="px-4 py-5 text-sm text-center" style={{ color: "var(--text-faint)" }}>
      {label}
    </p>
  );
}
