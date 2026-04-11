import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  addDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  type Unsubscribe,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Game, Station, GameSession, Member, InputState } from "@/types";

// ── Games ────────────────────────────────────────────────────────────────────

export async function getGames(): Promise<Game[]> {
  // Always use REST API for game listing — the Firebase SDK can hang
  // indefinitely on cold connections (no built-in timeout), which leaves
  // the GameGrid stuck in loading state. REST with the API key is fast,
  // reliable, and works without auth.
  try {
    return await getGamesRest();
  } catch (restErr) {
    console.warn("[getGames] REST failed, trying SDK:", restErr);
  }
  // SDK fallback (slower on first connect but handles auth-gated rules)
  const snap = await getDocs(collection(db, "games"));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Game))
    .filter((g) => g.active !== false);
}

async function firestoreVal(v: Record<string, unknown>): Promise<unknown> {
  if (!v) return undefined;
  if ("stringValue" in v) return v.stringValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("mapValue" in v) {
    const map = v.mapValue as { fields?: Record<string, Record<string, unknown>> };
    const obj: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(map.fields ?? {})) {
      obj[k] = await firestoreVal(val);
    }
    return obj;
  }
  if ("arrayValue" in v) {
    const arr = v.arrayValue as { values?: Record<string, unknown>[] };
    return Promise.all((arr.values ?? []).map(firestoreVal));
  }
  return undefined;
}

async function getGamesRest(): Promise<Game[]> {
  const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const PROJECT = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/games?key=${API_KEY}&pageSize=100`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Firestore REST ${res.status}`);
  const json = await res.json() as { documents?: Array<{ name: string; fields?: Record<string, Record<string, unknown>> }> };
  const games: Game[] = [];
  for (const docRaw of json.documents ?? []) {
    const id = docRaw.name.split("/").pop()!;
    const fields: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(docRaw.fields ?? {})) {
      fields[k] = await firestoreVal(v);
    }
    const g = { id, ...fields } as Game;
    if (g.active !== false) games.push(g);
  }
  return games;
}

export async function getGame(gameId: string): Promise<Game | null> {
  // REST first to avoid SDK cold-start hangs
  try {
    const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const PROJECT = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/games/${gameId}?key=${API_KEY}`
    );
    if (res.ok) {
      const docRaw = await res.json() as { name: string; fields?: Record<string, Record<string, unknown>> };
      const fields: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(docRaw.fields ?? {})) {
        fields[k] = await firestoreVal(v);
      }
      return { id: gameId, ...fields } as Game;
    }
  } catch {
    // fall through to SDK
  }
  const snap = await getDoc(doc(db, "games", gameId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Game;
}

export async function getStations(gameId: string): Promise<Station[]> {
  const snap = await getDocs(
    query(
      collection(db, "games", gameId, "stations"),
      orderBy("order", "asc")
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Station));
}

// ── Sessions ─────────────────────────────────────────────────────────────────

export async function createSession(
  gameId: string,
  uid: string,
  memberName: string
): Promise<string> {
  const ref = await addDoc(collection(db, "game_sessions"), {
    gameId,
    createdBy: uid,
    createdAt: serverTimestamp(),
    status: "active",
    currentStep: 0,
    started: false,
    solved: false,
    hintOpen: false,
    nextHintOpen: false,
    maxMembers: 6,
    members: [{ uid, name: memberName, joinedAt: serverTimestamp() }],
    inputState: {},
  } satisfies Omit<GameSession, "id">);

  await setDoc(doc(db, "users", uid, "active_session", gameId), {
    sessionId: ref.id,
    gameId,
    role: "host",
    updatedAt: serverTimestamp(),
  });

  return ref.id;
}

export async function joinSession(
  sessionId: string,
  gameId: string,
  uid: string,
  memberName: string
): Promise<void> {
  await updateDoc(doc(db, "game_sessions", sessionId), {
    members: arrayUnion({ uid, name: memberName, joinedAt: serverTimestamp() }),
  });

  await setDoc(doc(db, "users", uid, "active_session", gameId), {
    sessionId,
    gameId,
    role: "guest",
    updatedAt: serverTimestamp(),
  });
}

export async function getActiveSession(
  uid: string,
  gameId: string
): Promise<{ sessionId: string; role: "host" | "guest" } | null> {
  const snap = await getDoc(doc(db, "users", uid, "active_session", gameId));
  if (!snap.exists()) return null;
  return snap.data() as { sessionId: string; role: "host" | "guest" };
}

export async function getSession(sessionId: string): Promise<GameSession | null> {
  const snap = await getDoc(doc(db, "game_sessions", sessionId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as GameSession;
}

export function subscribeSession(
  sessionId: string,
  callback: (session: GameSession) => void
): Unsubscribe {
  return onSnapshot(doc(db, "game_sessions", sessionId), (snap) => {
    if (snap.exists()) {
      callback({ id: snap.id, ...snap.data() } as GameSession);
    }
  });
}

export async function syncSessionState(
  sessionId: string,
  patch: Partial<GameSession>
): Promise<void> {
  await updateDoc(doc(db, "game_sessions", sessionId), patch as DocumentData);
}

export async function updateInputState(
  sessionId: string,
  inputState: InputState
): Promise<void> {
  await updateDoc(doc(db, "game_sessions", sessionId), { inputState });
}

// ── Progress (solo play) ──────────────────────────────────────────────────────

export async function saveProgress(uid: string, gameId: string, step: number) {
  await setDoc(doc(db, "users", uid, "progress", gameId), {
    currentStep: step,
  });
}

export async function getProgress(
  uid: string,
  gameId: string
): Promise<number> {
  const snap = await getDoc(doc(db, "users", uid, "progress", gameId));
  if (!snap.exists()) return 0;
  return (snap.data().currentStep as number) ?? 0;
}

// ── Chat ─────────────────────────────────────────────────────────────────────

export async function sendChatMessage(
  sessionId: string,
  uid: string,
  name: string,
  text: string
): Promise<void> {
  await addDoc(collection(db, "game_sessions", sessionId, "chat"), {
    uid,
    name,
    text,
    createdAt: serverTimestamp(),
  });
}

export function subscribeChat(
  sessionId: string,
  callback: (msgs: DocumentData[]) => void
): Unsubscribe {
  return onSnapshot(
    query(
      collection(db, "game_sessions", sessionId, "chat"),
      orderBy("createdAt", "asc")
    ),
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
}
