import { NextRequest, NextResponse } from "next/server";

const PROJECT = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY!;

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code || code.length !== 6) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }
  const normalized = code.toUpperCase();

  // 1. Try querying by stored 'code' field
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

  try {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents:runQuery?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(queryBody),
      }
    );

    if (res.ok) {
      const results: Array<{ document?: { name: string; fields: Record<string, unknown> } }> = await res.json();
      for (const row of results) {
        if (!row.document) continue;
        const fields = row.document.fields as Record<string, { stringValue?: string }>;
        const status = fields.status?.stringValue;
        if (status === "ended") continue;
        const gameId = fields.gameId?.stringValue;
        const sessionId = row.document.name.split("/").pop()!;
        if (gameId && sessionId) {
          return NextResponse.json({ gameId, sessionId });
        }
      }
    }

    // 2. Fallback: list all sessions and match by ID prefix
    const listRes = await fetch(
      `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/game_sessions?key=${API_KEY}&pageSize=200`,
    );
    if (!listRes.ok) {
      return NextResponse.json({ error: "Firestore unavailable" }, { status: 502 });
    }
    const listData = await listRes.json() as { documents?: Array<{ name: string; fields: Record<string, { stringValue?: string }> }> };
    for (const doc of listData.documents ?? []) {
      const sessionId = doc.name.split("/").pop()!;
      if (sessionId.slice(0, 6).toUpperCase() !== normalized) continue;
      const status = doc.fields.status?.stringValue;
      if (status === "ended") continue;
      const gameId = doc.fields.gameId?.stringValue;
      if (gameId) return NextResponse.json({ gameId, sessionId });
    }

    return NextResponse.json({ error: "Szoba nem található" }, { status: 404 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[find-session]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
