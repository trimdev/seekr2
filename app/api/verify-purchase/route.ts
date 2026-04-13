import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-03-25.dahlia" });

// Verify Firebase ID token via Identity Toolkit REST (no Admin SDK needed)
async function verifyToken(idToken: string): Promise<{ uid: string } | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const uid = data.users?.[0]?.localId;
    if (!uid) return null;
    return { uid };
  } catch {
    return null;
  }
}

async function firestorePatch(
  projectId: string,
  apiKey: string,
  path: string,
  fields: Record<string, unknown>
): Promise<void> {
  await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${path}?key=${apiKey}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields }),
    }
  );
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const idToken = authHeader.slice(7);
  const decoded = await verifyToken(idToken);
  if (!decoded) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const { gameId, paymentIntentId } = await req.json();
  if (!gameId || !paymentIntentId) {
    return NextResponse.json({ error: "Missing gameId or paymentIntentId" }, { status: 400 });
  }

  // Fetch PaymentIntent from Stripe
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (pi.status !== "succeeded") {
    return NextResponse.json({ error: "Payment not succeeded" }, { status: 400 });
  }
  if (pi.metadata.gameId !== gameId) {
    return NextResponse.json({ error: "Game mismatch" }, { status: 400 });
  }
  if (pi.metadata.userId !== decoded.uid) {
    return NextResponse.json({ error: "User mismatch" }, { status: 401 });
  }

  // Fetch game price to verify amount
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY!;
  const gameRes = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/games/${gameId}?key=${apiKey}`
  );
  if (!gameRes.ok) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }
  const gameDoc = await gameRes.json();
  const gamePrice =
    gameDoc.fields?.price?.integerValue ||
    gameDoc.fields?.price?.doubleValue;
  if (!gamePrice || Math.round(Number(gamePrice) * 100) !== pi.amount) {
    return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const uid = decoded.uid;

  // Write owned game record
  await firestorePatch(projectId, apiKey, `users/${uid}/owned_games/${gameId}`, {
    purchasedAt: { stringValue: now },
    confirmedBy: { stringValue: "stripe" },
    paymentIntentId: { stringValue: pi.id },
    amountReceived: { integerValue: String(pi.amount_received) },
  });

  // Write purchase record
  await firestorePatch(projectId, apiKey, `purchases/${pi.id}`, {
    userId: { stringValue: uid },
    gameId: { stringValue: gameId },
    createdAt: { stringValue: now },
    confirmedBy: { stringValue: "stripe" },
    paymentIntentId: { stringValue: pi.id },
    amountReceived: { integerValue: String(pi.amount_received) },
  });

  return NextResponse.json({ ok: true });
}
