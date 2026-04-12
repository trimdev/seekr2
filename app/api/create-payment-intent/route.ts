import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-03-25.dahlia" });

// Verify Firebase ID token via Identity Toolkit REST (no Admin SDK needed)
// Note: oauth2.googleapis.com/tokeninfo only works for Google OAuth2 tokens,
// NOT for Firebase ID tokens. Firebase JWTs must use accounts:lookup.
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

  const { gameId } = await req.json();
  if (!gameId) {
    return NextResponse.json({ error: "Missing gameId" }, { status: 400 });
  }

  // Fetch game from Firestore REST API
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const gameRes = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/games/${gameId}?key=${apiKey}`
  );
  if (!gameRes.ok) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }
  const gameDoc = await gameRes.json();
  const price =
    gameDoc.fields?.price?.integerValue ||
    gameDoc.fields?.price?.doubleValue;
  if (!price || Number(price) <= 0) {
    return NextResponse.json({ error: "Invalid price" }, { status: 400 });
  }

  // Idempotency key based on uid + gameId
  const encoder = new TextEncoder();
  const hashInput = encoder.encode(`pi:${decoded.uid}:${gameId}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", hashInput);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const idempotencyKey = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 64);

  const paymentIntent = await stripe.paymentIntents.create(
    {
      amount: Math.round(Number(price)),
      currency: "huf",
      automatic_payment_methods: { enabled: true },
      metadata: { gameId, userId: decoded.uid },
    },
    { idempotencyKey }
  );

  return NextResponse.json({ clientSecret: paymentIntent.client_secret });
}
