import { NextRequest, NextResponse } from "next/server";

const PROJECT = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
const API_KEY  = process.env.NEXT_PUBLIC_FIREBASE_API_KEY!;

async function verifyAdmin(idToken: string): Promise<string | null> {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${API_KEY}`,
    { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }) }
  );
  if (!res.ok) return null;
  const uid = (await res.json()).users?.[0]?.localId;
  if (!uid) return null;

  const adminRes = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/users/${uid}?key=${API_KEY}`
  );
  if (!adminRes.ok) return null;
  const doc = await adminRes.json();
  const isAdmin = doc.fields?.roles?.mapValue?.fields?.admin?.booleanValue === true;
  return isAdmin ? uid : null;
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = await verifyAdmin(auth.slice(7));
  if (!uid) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { price } = await req.json();
  if (!price || typeof price !== "number" || price < 175) {
    return NextResponse.json({ error: "Invalid price (min 175)" }, { status: 400 });
  }

  // Get all game IDs
  const listRes = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/games?key=${API_KEY}&pageSize=100`
  );
  const listData = await listRes.json();
  const docs: { name: string }[] = listData.documents ?? [];

  const results: Record<string, string> = {};
  for (const doc of docs) {
    const gameId = doc.name.split("/").pop()!;
    const patchRes = await fetch(
      `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/games/${gameId}?key=${API_KEY}&updateMask.fieldPaths=price`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.slice(7)}`,
        },
        body: JSON.stringify({ fields: { price: { integerValue: String(price) } } }),
      }
    );
    results[gameId] = patchRes.ok ? "ok" : `${patchRes.status}`;
  }

  const ok = Object.values(results).filter(v => v === "ok").length;
  return NextResponse.json({ updated: ok, total: docs.length, results });
}
