import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-03-25.dahlia" });

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent;
    const { gameId, userId } = pi.metadata;
    if (!gameId || !userId) {
      return NextResponse.json({ ok: true });
    }

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY!;

    // Check if already owned (idempotent)
    const existsRes = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${userId}/owned_games/${gameId}?key=${apiKey}`
    );
    if (existsRes.ok) {
      return NextResponse.json({ ok: true }); // Already owned
    }

    const now = new Date().toISOString();

    await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${userId}/owned_games/${gameId}?key=${apiKey}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: {
            purchasedAt: { stringValue: now },
            confirmedBy: { stringValue: "stripe-webhook" },
            paymentIntentId: { stringValue: pi.id },
            amountReceived: { integerValue: String(pi.amount_received) },
          },
        }),
      }
    );

    await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/purchases/${pi.id}?key=${apiKey}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: {
            userId: { stringValue: userId },
            gameId: { stringValue: gameId },
            createdAt: { stringValue: now },
            confirmedBy: { stringValue: "stripe-webhook" },
            paymentIntentId: { stringValue: pi.id },
            amountReceived: { integerValue: String(pi.amount_received) },
          },
        }),
      }
    );
  }

  return NextResponse.json({ ok: true });
}
