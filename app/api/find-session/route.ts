import { NextRequest, NextResponse } from "next/server";

const PROJECT = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY!;

// Cache an anonymous Firebase ID token so we don't create a new anonymous
// user on every request. Token is valid for 1 hour; refresh at 55 min.
let _cachedToken: string | null = null;
let _tokenExpiry = 0;

async function getAnonToken(): Promise<string> {
  if (_cachedToken && Date.now() < _tokenExpiry) return _cachedToken;

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ returnSecureToken: true }),
    }
  );
  if (!res.ok) throw new Error(`Anonymous auth failed: ${res.status}`);
  const data = await res.json();
  _cachedToken = data.idToken as string;
  _tokenExpiry = Date.now() + 55 * 60 * 1000;
  return _cachedToken;
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code || code.length !== 6) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }
  const normalized = code.toUpperCase();

  try {
    const idToken = await getAnonToken();
    const authHeader = `Bearer ${idToken}`;

    // Query by stored 'code' field
    const queryBody = {
      structuredQuery: {
        from: [{ collectionId: "game_sessions" }],
        where: {
          fieldFilter: {
            field: { fieldPath: "code" },
            op: "EQUAL",
            value: { stringValue: normalized },
          },
        },
        limit: 5,
      },
    };

    const qRes = await fetch(
      `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents:runQuery?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify(queryBody),
      }
    );

    if (qRes.ok) {
      const rows = await qRes.json() as Array<{ document?: { name: string; fields: Record<string, { stringValue?: string }> } }>;
      for (const row of rows) {
        if (!row.document) continue;
        const f = row.document.fields;
        if (f.status?.stringValue === "ended") continue;
        const gameId = f.gameId?.stringValue;
        const sessionId = row.document.name.split("/").pop()!;
        if (gameId && sessionId) {
          return NextResponse.json({ gameId, sessionId });
        }
      }
    } else {
      console.error("[find-session] runQuery", qRes.status, await qRes.text());
    }

    // Fallback: list all sessions and match by document ID prefix
    // (covers sessions created before the 'code' field was added)
    const listRes = await fetch(
      `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/game_sessions?key=${API_KEY}&pageSize=200`,
      { headers: { Authorization: authHeader } }
    );

    if (!listRes.ok) {
      const body = await listRes.text();
      console.error("[find-session] list", listRes.status, body);
      return NextResponse.json({ error: "Szoba nem található" }, { status: 404 });
    }

    const listData = await listRes.json() as {
      documents?: Array<{ name: string; fields: Record<string, { stringValue?: string }> }>;
    };

    for (const doc of listData.documents ?? []) {
      const sessionId = doc.name.split("/").pop()!;
      if (sessionId.slice(0, 6).toUpperCase() !== normalized) continue;
      if (doc.fields.status?.stringValue === "ended") continue;
      const gameId = doc.fields.gameId?.stringValue;
      if (gameId) return NextResponse.json({ gameId, sessionId });
    }

    return NextResponse.json({ error: "Szoba nem található" }, { status: 404 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[find-session] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
