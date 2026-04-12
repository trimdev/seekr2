import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  console.error("[create-payment-intent] STRIPE_SECRET_KEY env var is not set");
}
const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: "2026-03-25.dahlia" }) : null;

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
  try {
    if (!stripe) {
      return NextResponse.json({ error: "Stripe is not configured (missing STRIPE_SECRET_KEY)" }, { status: 503 });
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const idToken = authHeader.slice(7);
    const decoded = await verifyToken(idToken);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await req.json();
    const { gameId } = body;
    if (!gameId) {
      return NextResponse.json({ error: "Missing gameId" }, { status: 400 });
    }

    // Fetch game price from Firestore REST API
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const gameRes = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/games/${gameId}?key=${apiKey}`
    );
    if (!gameRes.ok) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }
    const gameDoc = await gameRes.json();
    const rawPrice =
      gameDoc.fields?.price?.integerValue ??
      gameDoc.fields?.price?.doubleValue ??
      gameDoc.fields?.price?.numberValue;
    const price = Number(rawPrice);
    console.log("[PI] rawPrice:", rawPrice, "→ parsed:", price);
    if (!rawPrice || isNaN(price) || price <= 0) {
      console.error("[PI] invalid price field:", gameDoc.fields?.price);
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }
    // Stripe minimum for HUF is 175 Ft
    const STRIPE_HUF_MIN = 175;
    if (price < STRIPE_HUF_MIN) {
      console.error("[PI] price", price, "is below Stripe minimum", STRIPE_HUF_MIN);
      return NextResponse.json(
        { error: `Az ár legalább ${STRIPE_HUF_MIN} Ft kell legyen (jelenleg: ${price} Ft). Frissítsd a játék árát az admin felületen.` },
        { status: 400 }
      );
    }

    // Idempotency key: uid + gameId
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest(
      "SHA-256",
      encoder.encode(`pi:${decoded.uid}:${gameId}:${price}`)
    );
    const idempotencyKey = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, 64);

    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: Math.round(price),
        currency: "huf",
        automatic_payment_methods: { enabled: true },
        metadata: { gameId, userId: decoded.uid },
      },
      { idempotencyKey }
    );

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[create-payment-intent] 500:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
