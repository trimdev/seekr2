"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronRight, Trophy, RotateCcw, Lock } from "lucide-react";
import {
  doc, setDoc, updateDoc, onSnapshot, getDoc, serverTimestamp, arrayUnion,
  addDoc, collection,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useGame } from "@/hooks/useGame";
import { useSession } from "@/hooks/useSession";
import { getText, sessionCode, sessionShareUrl } from "@/lib/utils";
import { createSession, joinSession, getActiveSession, syncSessionState, updateInputState, saveProgress, getProgress } from "@/lib/firestore";

import { TextPuzzle } from "@/components/game/puzzles/TextPuzzle";
import { LockPuzzle } from "@/components/game/puzzles/LockPuzzle";
import { OrderPuzzle } from "@/components/game/puzzles/OrderPuzzle";
import { MatchPuzzle } from "@/components/game/puzzles/MatchPuzzle";
import { QRPuzzle } from "@/components/game/puzzles/QRPuzzle";
import { HintPanel } from "@/components/game/HintPanel";
import { ChatPanel } from "@/components/game/ChatPanel";
import { PlayerList } from "@/components/game/PlayerList";
import { HostControls } from "@/components/game/HostControls";
import { ConfettiEffect } from "@/components/game/ConfettiEffect";
import { GameTimer } from "@/components/game/GameTimer";
import { BottomNav } from "@/components/nav/BottomNav";
import { SessionCreator } from "@/components/game/SessionCreator";
import { JoinPrompt } from "@/components/game/JoinPrompt";
import { Container } from "@/components/ui/Container";
import type { Station, GameSession, InputState } from "@/types";

type Tab = "home" | "chat" | "hints" | "map";

export default function PlayPage() {
  const { id: gameId } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // ── game data ──────────────────────────────────────────────────────────────
  const { game, stations, loading: gameLoading } = useGame(gameId as string);

  // ── session state ──────────────────────────────────────────────────────────
  const [sessionId, setSessionId] = useState<string | null>(searchParams.get("session"));
  const [isHost, setIsHost] = useState(false);
  const [needsJoin, setNeedsJoin] = useState(false);
  const [effectiveUid, setEffectiveUid] = useState<string | null>(null);

  const { session, loading: sessionLoading } = useSession(sessionId);

  // ── game play state ────────────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState(0);
  const [solved, setSolved] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);
  const [nextHintOpen, setNextHintOpen] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  // puzzle input state
  const [inputValue, setInputValue] = useState("");
  const [inputCorrect, setInputCorrect] = useState<boolean | null>(null);
  const [lockDigits, setLockDigits] = useState<string[]>([]);
  const [orderItems, setOrderItems] = useState<string[]>([]);
  const [matchSelections, setMatchSelections] = useState<Record<string, string>>({});
  const [qrValue, setQrValue] = useState("");

  // ── Access control ─────────────────────────────────────────────────────────
  const [hasAccess, setHasAccess] = useState(true);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [chatUnread, setChatUnread] = useState(0);
  const [confetti, setConfetti] = useState(false);

  const station: Station | undefined = stations[currentStep];
  const stationType = station?.type || "text";

  // ── Set effective UID from authenticated user ──────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    if (user) {
      setEffectiveUid(user.uid);
    } else {
      setEffectiveUid(null);
    }
  }, [user, authLoading]);

  // ── Load saved progress for solo play (no session) ────────────────────────
  useEffect(() => {
    if (!user || !gameId || sessionId) return; // only solo play
    getProgress(user.uid, gameId as string).then((step) => {
      if (step > 0) setCurrentStep(step);
    });
  }, [user, gameId, sessionId]);

  // ── Guard: clamp currentStep to valid range ───────────────────────────────
  useEffect(() => {
    if (stations.length > 0 && currentStep >= stations.length) {
      setCurrentStep(stations.length - 1);
    }
  }, [stations.length, currentStep]);

  // ── Resolve session role on load ───────────────────────────────────────────
  useEffect(() => {
    if (!effectiveUid || !gameId) return;
    const sid = searchParams.get("session");
    if (!sid) return; // no session param → show creator

    (async () => {
      const active = await getActiveSession(effectiveUid, gameId as string);
      if (active && active.sessionId === sid) {
        setSessionId(sid);
        setIsHost(active.role === "host");
      } else {
        // Need to join
        setSessionId(sid);
        const snap = await getDoc(doc(db, "game_sessions", sid));
        if (!snap.exists()) return;
        const data = snap.data();
        const already = (data.members as { uid: string }[]).find((m) => m.uid === effectiveUid);
        if (already) {
          await setDoc(doc(db, "users", effectiveUid, "active_session", gameId as string), {
            sessionId: sid, gameId, role: "guest", updatedAt: serverTimestamp(),
          });
          setIsHost(false);
        } else {
          setNeedsJoin(true);
        }
      }
    })();
  }, [effectiveUid, gameId, searchParams]);

  // ── Ownership check (paid games, non-guest, no session join) ──────────────
  useEffect(() => {
    if (!game || gameLoading || authLoading) return;
    if (!game.price || game.price <= 0) { setHasAccess(true); return; }
    // Guests joining via session link bypass ownership check
    if (searchParams.get("session")) { setHasAccess(true); return; }
    if (!user) {
      // Paid game, not logged in → redirect to login
      router.replace(`/login?redirect=/games/${gameId}/play`);
      return;
    }
    (async () => {
      const ownedSnap = await getDoc(doc(db, "users", user.uid, "owned_games", gameId as string));
      if (!ownedSnap.exists()) {
        setHasAccess(false);
      } else {
        setHasAccess(true);
      }
    })();
  }, [game, gameLoading, authLoading, user, gameId, searchParams, router]);

  // ── Sync session → local state ─────────────────────────────────────────────
  useEffect(() => {
    if (!session || isHost) return; // host drives state, guests follow
    setCurrentStep(session.currentStep ?? 0);
    setSolved(session.solved ?? false);
    setHintOpen(session.hintOpen ?? false);
    setNextHintOpen(session.nextHintOpen ?? false);

    const inp: InputState = session.inputState || {};
    if (inp.textValue !== undefined) setInputValue(inp.textValue);
    if (inp.lockDigits) setLockDigits(inp.lockDigits);
    if (inp.orderItems) setOrderItems(inp.orderItems);
    if (inp.matchSelections) setMatchSelections(inp.matchSelections);
    if (inp.qrValue !== undefined) setQrValue(inp.qrValue);

    if (session.status === "ended") router.replace(`/games/${gameId}/play/end?session=${sessionId}`);
  }, [session, isHost]);

  // ── Initialize puzzle input when station changes ───────────────────────────
  useEffect(() => {
    if (!station) return;
    setInputValue("");
    setInputCorrect(null);
    setQrValue("");
    setLockDigits(() => {
      const sol = getText(station.solution);
      return Array(sol.length).fill("0");
    });
    setOrderItems(station.puzzleOrder ? [...station.puzzleOrder].sort(() => Math.random() - 0.5) : []);
    setMatchSelections({});
  }, [currentStep, station?.id]);

  // ── Host: broadcast input state to guests ─────────────────────────────────
  const broadcastInput = useCallback(async (partial: Partial<InputState>) => {
    if (!sessionId || !isHost) return;
    await updateInputState(sessionId, {
      textValue: inputValue,
      lockDigits,
      orderItems,
      matchSelections,
      qrValue,
      ...partial,
    });
  }, [sessionId, isHost, inputValue, lockDigits, orderItems, matchSelections, qrValue]);

  // ── Solution check (host only) ─────────────────────────────────────────────
  const checkSolution = useCallback(async () => {
    if (!isHost || !station) return;
    const sol = getText(station.solution).trim().toLowerCase();
    let ok = false;

    if (stationType === "text") {
      ok = inputValue.trim().toLowerCase() === sol;
    } else if (stationType === "lock") {
      ok = lockDigits.join("") === sol;
    } else if (stationType === "puzzle_order") {
      const target = station.puzzleOrder ?? [];
      ok = orderItems.join("||") === target.join("||");
    } else if (stationType === "puzzle_match") {
      const pairs = station.puzzleMatch ?? [];
      ok = pairs.every((p) => matchSelections[p.left] === p.right);
    } else if (stationType === "qr") {
      ok = qrValue.trim().toLowerCase() === sol;
    }

    if (ok) {
      setSolved(true);
      setConfetti(true);
      try { new Audio("/sounds/success.mp3").play(); } catch {}
      if (sessionId) {
        await syncSessionState(sessionId, { solved: true, nextHintOpen: false });
      } else if (effectiveUid) {
        await saveProgress(effectiveUid, gameId as string, currentStep + 1);
      }
    } else {
      setInputCorrect(false);
      try { new Audio("/sounds/error.mp3").play(); } catch {}
      setTimeout(() => setInputCorrect(null), 2000);
    }
  }, [isHost, station, stationType, inputValue, lockDigits, orderItems, matchSelections, qrValue, sessionId, effectiveUid, gameId, currentStep]);

  // ── Advance to next station (host only) ────────────────────────────────────
  const nextStation = useCallback(async () => {
    const next = currentStep + 1;
    if (next >= stations.length) {
      if (sessionId) {
        await syncSessionState(sessionId, { status: "ended", currentStep: next });
      }
      router.replace(`/games/${gameId}/play/end?session=${sessionId ?? ""}`);
      return;
    }
    setCurrentStep(next);
    setSolved(false);
    setHintOpen(false);
    setNextHintOpen(false);
    setConfetti(false);
    if (sessionId) {
      await syncSessionState(sessionId, {
        currentStep: next,
        solved: false,
        hintOpen: false,
        nextHintOpen: false,
        inputState: {},
      });
    } else if (user?.uid) {
      await saveProgress(user.uid, gameId as string, next);
    }
  }, [currentStep, stations.length, sessionId, gameId, router, user]);

  // ── Host controls ──────────────────────────────────────────────────────────
  const revealHint = async () => {
    setHintOpen(true);
    if (sessionId) await syncSessionState(sessionId, { hintOpen: true });
  };
  const revealNextHint = async () => {
    setNextHintOpen(true);
    if (sessionId) await syncSessionState(sessionId, { nextHintOpen: true });
  };
  const pauseGame = async () => {
    if (sessionId) await syncSessionState(sessionId, { status: "paused" });
  };
  const resumeGame = async () => {
    if (sessionId) await syncSessionState(sessionId, { status: "active" });
  };
  const skipStation = async () => { await nextStation(); };
  const endGame = async () => {
    if (sessionId) await syncSessionState(sessionId, { status: "ended" });
    router.replace(`/games/${gameId}/play/end?session=${sessionId ?? ""}`);
  };

  // ── Join handler (guest) ───────────────────────────────────────────────────
  const handleJoin = async (name: string) => {
    if (!effectiveUid || !sessionId || !gameId) return;
    await joinSession(sessionId, gameId as string, effectiveUid, name);
    setNeedsJoin(false);
    setIsHost(false);
  };

  // ── Session created (host flow) ────────────────────────────────────────────
  const handleSessionCreated = (sid: string) => {
    setSessionId(sid);
    setIsHost(true);
    router.replace(`/games/${gameId}/play?session=${sid}`);
  };

  // ── Loading / error states ─────────────────────────────────────────────────
  const loading = authLoading || gameLoading || (!!sessionId && sessionLoading);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--cyan)" }} />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "var(--bg-base)" }}>
        <p style={{ color: "var(--text-muted)" }}>A játék nem elérhető.</p>
        <button onClick={() => router.back()} className="btn-ghost">Vissza</button>
      </div>
    );
  }

  if (!gameLoading && stations.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "var(--bg-base)" }}>
        <p style={{ color: "var(--text-muted)" }}>Nincs állomás ehhez a játékhoz.</p>
        <button onClick={() => router.back()} className="btn-ghost">Vissza</button>
      </div>
    );
  }

  // ── Locked — game requires purchase ───────────────────────────────────────
  if (!hasAccess) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-4"
        style={{ background: "var(--bg-base)" }}
      >
        <Lock size={48} className="mb-4 opacity-40" />
        <h2
          className="text-xl font-black mb-2 text-center"
          style={{ fontFamily: "var(--font-cinzel), serif" }}
        >
          Ez a játék megvásárolható
        </h2>
        <p
          className="text-sm mb-6 text-center"
          style={{ color: "var(--text-muted)" }}
        >
          A játékhoz hozzáférés szükséges.
        </p>
        <Link href={`/checkout/${gameId}`} className="btn-primary">
          Megvásárlás
        </Link>
      </div>
    );
  }

  // ── Needs join prompt ──────────────────────────────────────────────────────
  if (needsJoin) {
    return <JoinPrompt sessionId={sessionId!} onJoin={handleJoin} />;
  }

  // ── No session yet — show creator (host) or join options ───────────────────
  if (!sessionId) {
    return (
      <div className="min-h-screen py-8" style={{ background: "var(--bg-base)" }}>
      <Container>
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-dim)" }}>
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-xl font-black" style={{ fontFamily: "var(--font-cinzel), serif" }}>
            {getText(game.title)}
          </h1>
        </div>
        {effectiveUid ? (
          <SessionCreator
            gameId={gameId as string}
            uid={effectiveUid}
            displayName={user?.displayName || ""}
            onCreated={handleSessionCreated}
          />
        ) : (
          <p style={{ color: "var(--text-muted)" }}>Bejelentkezés szükséges...</p>
        )}
      </Container>
      </div>
    );
  }

  // ── Game Intro ─────────────────────────────────────────────────────────────
  if (showIntro && (isHost || !sessionId)) {
    return (
      <div className="min-h-screen flex flex-col py-8" style={{ background: "var(--bg-base)" }}>
      <Container className="flex flex-col flex-1">
        {game.background && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={game.background} alt="" className="fixed inset-0 w-full h-full object-cover opacity-10 pointer-events-none" />
        )}
        <div className="relative z-10 flex-1 flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <button onClick={() => router.back()} className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.07)" }}>
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-xl font-black" style={{ fontFamily: "var(--font-cinzel), serif" }}>
              {getText(game.title)}
            </h1>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            {game.story_intro && (
              <div className="glass rounded-2xl p-5 mb-6" style={{ borderLeft: "3px solid var(--cyan)" }}>
                <p className="text-sm leading-relaxed italic" style={{ color: "var(--text-muted)" }}>
                  {getText(game.story_intro)}
                </p>
              </div>
            )}
            {game.mission && (
              <div className="glass-cyan rounded-2xl p-4 mb-8">
                <p className="text-xs font-semibold mb-1" style={{ color: "var(--cyan)" }}>KÜLDETÉS</p>
                <p className="text-sm">{getText(game.mission)}</p>
              </div>
            )}

            {session?.members && (
              <PlayerList
                members={session.members}
                hostUid={session.createdBy}
                sessionId={sessionId}
                gameId={gameId as string}
              />
            )}
          </div>

          <button
            onClick={() => {
              setShowIntro(false);
              setStartedAt(Date.now());
              if (sessionId) syncSessionState(sessionId, { started: true });
            }}
            className="btn-primary w-full mt-8 flex items-center justify-center gap-2"
          >
            Kaland kezdése <ChevronRight size={16} />
          </button>
        </div>
      </Container>
      </div>
    );
  }

  // ── Main Game Screen ───────────────────────────────────────────────────────
  const progress = stations.length ? ((currentStep) / stations.length) * 100 : 0;
  const sessionStatus = session?.status ?? "active";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-base)" }}>
      <ConfettiEffect active={confetti} />

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-30"
        style={{ background: "rgba(10,14,26,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border-dim)" }}
      >
      <Container className="flex items-center gap-3 py-3">
        <button
          onClick={async () => {
            if (!sessionId && user?.uid) {
              await saveProgress(user.uid, gameId as string, currentStep);
            }
            router.replace(`/games/${gameId}`);
          }}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <ArrowLeft size={16} />
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
            {getText(game.title)} • {currentStep + 1}/{stations.length}
          </p>
          {/* Progress bar */}
          <div className="h-1 rounded-full mt-1" style={{ background: "var(--bg-surface)" }}>
            <div
              className="h-1 rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: "var(--cyan)" }}
            />
          </div>
        </div>

        <GameTimer startedAt={startedAt} running={sessionStatus === "active"} />

        {isHost && sessionId && (
          <HostControls
            status={sessionStatus}
            onPause={pauseGame}
            onResume={resumeGame}
            onSkip={skipStation}
            onEnd={endGame}
          />
        )}
      </Container>
      </header>

      {/* ── Tab content ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto mb-nav">
        <AnimatePresence mode="wait">
          {activeTab === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
            <Container className="py-5">
              {/* Paused overlay */}
              {sessionStatus === "paused" && (
                <div
                  className="glass rounded-2xl p-4 mb-4 flex items-center gap-3"
                  style={{ background: "rgba(255,107,53,0.1)", borderColor: "rgba(255,107,53,0.3)" }}
                >
                  <span className="text-lg">⏸</span>
                  <p className="text-sm font-medium" style={{ color: "var(--orange)" }}>
                    A csapatvezető szüneteltette a játékot
                  </p>
                </div>
              )}

              {/* Station header */}
              {station && (
                <>
                  {/* Station image */}
                  {station.image && (
                    <motion.div
                      key={`img-${currentStep}`}
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="rounded-2xl overflow-hidden mb-4"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={station.image} alt="" className="w-full max-h-52 object-cover" />
                    </motion.div>
                  )}

                  {/* Station title + subtitle */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-xs font-mono opacity-30">
                        {String(currentStep + 1).padStart(2, "0")}
                      </span>
                      <h2
                        className="text-xl font-black"
                        style={{ fontFamily: "var(--font-cinzel), serif" }}
                      >
                        {getText(station.title)}
                      </h2>
                    </div>
                    {station.subtitle && (
                      <p className="text-xs" style={{ color: "var(--cyan)" }}>
                        {getText(station.subtitle)}
                      </p>
                    )}
                  </div>

                  {/* Riddle */}
                  {station.riddle && (
                    <div
                      className="glass rounded-2xl p-4 mb-4"
                      style={{ borderLeft: "3px solid var(--cyan)" }}
                    >
                      <p className="text-sm leading-relaxed">{getText(station.riddle)}</p>
                    </div>
                  )}

                  {/* Task */}
                  {station.task && (
                    <p className="text-xs mb-5 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                      {getText(station.task)}
                    </p>
                  )}

                  {/* Solved state */}
                  <AnimatePresence>
                    {solved ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-cyan rounded-2xl p-5 mb-4 text-center"
                      >
                        <p className="text-2xl mb-2">🎉</p>
                        <p
                          className="text-base font-bold mb-2"
                          style={{ color: "var(--cyan)" }}
                        >
                          Helyes megfejtés!
                        </p>
                        {station.story && (
                          <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-muted)" }}>
                            {getText(station.story)}
                          </p>
                        )}
                        {isHost && (
                          <button onClick={nextStation} className="btn-primary w-full flex items-center justify-center gap-2">
                            {currentStep + 1 < stations.length ? (
                              <>Következő állomás <ChevronRight size={16} /></>
                            ) : (
                              <>Befejezés <Trophy size={16} /></>
                            )}
                          </button>
                        )}
                        {!isHost && (
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                            Várakozás a csapatvezetőre…
                          </p>
                        )}
                      </motion.div>
                    ) : (
                      <motion.div key="puzzle" className="flex flex-col gap-4">
                        {/* Puzzle input */}
                        {stationType === "text" && (
                          <TextPuzzle
                            value={inputValue}
                            onChange={(v) => { setInputValue(v); broadcastInput({ textValue: v }); }}
                            onSubmit={checkSolution}
                            disabled={!isHost}
                            isHost={isHost}
                            correct={inputCorrect}
                          />
                        )}
                        {stationType === "lock" && (
                          <LockPuzzle
                            digits={lockDigits}
                            setDigits={(d) => { setLockDigits(d); broadcastInput({ lockDigits: d }); }}
                            onUnlock={checkSolution}
                            solution={getText(station.solution)}
                            disabled={!isHost}
                          />
                        )}
                        {stationType === "puzzle_order" && (
                          <>
                            <OrderPuzzle
                              items={orderItems}
                              setItems={(items) => { setOrderItems(items); broadcastInput({ orderItems: items }); }}
                              disabled={!isHost}
                            />
                            {isHost && (
                              <button onClick={checkSolution} className="btn-primary w-full">
                                Ellenőrzés
                              </button>
                            )}
                          </>
                        )}
                        {stationType === "puzzle_match" && (
                          <>
                            <MatchPuzzle
                              pairs={station.puzzleMatch ?? []}
                              selections={matchSelections}
                              setSelections={(s) => { setMatchSelections(s); broadcastInput({ matchSelections: s }); }}
                              disabled={!isHost}
                            />
                            {isHost && (
                              <button onClick={checkSolution} className="btn-primary w-full">
                                Ellenőrzés
                              </button>
                            )}
                          </>
                        )}
                        {stationType === "qr" && (
                          <QRPuzzle
                            value={qrValue}
                            onChange={(v) => { setQrValue(v); broadcastInput({ qrValue: v }); }}
                            onSubmit={checkSolution}
                            disabled={!isHost}
                            isHost={isHost}
                          />
                        )}

                        {!isHost && (
                          <p className="text-xs text-center py-2" style={{ color: "var(--text-faint)" }}>
                            👁 Néző — csak a csapatvezető adhatja be a választ
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </Container>
            </motion.div>
          )}

          {activeTab === "chat" && sessionId && effectiveUid && (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <ChatPanel
                sessionId={sessionId}
                uid={effectiveUid}
                userName={session?.members?.find((m) => m.uid === effectiveUid)?.name ?? "Vendég"}
              />
            </motion.div>
          )}

          {activeTab === "hints" && (
            <motion.div
              key="hints"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Container className="py-5">
                <h2
                  className="text-xl font-black mb-4"
                  style={{ fontFamily: "var(--font-cinzel), serif" }}
                >
                  Tippek & Segítség
                </h2>
                <HintPanel
                  hint={station ? getText(station.hint) : undefined}
                  nextHint={station ? getText(station.nextHint) : undefined}
                  hintOpen={hintOpen}
                  nextHintOpen={nextHintOpen}
                  isHost={isHost}
                  onRevealHint={revealHint}
                  onRevealNextHint={revealNextHint}
                  solved={solved}
                />
              </Container>
            </motion.div>
          )}

          {activeTab === "map" && (
            <motion.div
              key="map"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Container className="py-5">
                <h2
                  className="text-xl font-black mb-4"
                  style={{ fontFamily: "var(--font-cinzel), serif" }}
                >
                  Játékosok & Kód
                </h2>
                {session && sessionId && (
                  <PlayerList
                    members={session.members}
                    hostUid={session.createdBy}
                    sessionId={sessionId}
                    gameId={gameId as string}
                  />
                )}
              </Container>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Bottom nav ────────────────────────────────────────────── */}
      <BottomNav
        active={activeTab}
        onChange={(tab) => {
          setActiveTab(tab);
          if (tab === "chat") setChatUnread(0);
        }}
        chatUnread={chatUnread}
      />
    </div>
  );
}
