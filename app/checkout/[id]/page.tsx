"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { ArrowLeft, ShoppingCart, AlertCircle } from "lucide-react";
import { getGame } from "@/lib/firestore";
import { getText } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";
import { Container } from "@/components/ui/Container";
import type { Game } from "@/types";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// ── Inner checkout form ──────────────────────────────────────────────────────

function CheckoutForm({ gameId, price }: { gameId: string; price: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success?gameId=${gameId}`,
      },
    });

    if (stripeError) {
      setError(stripeError.message ?? "Fizetési hiba történt.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Section label */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: "var(--border-dim)" }} />
        <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--text-faint)" }}>
          Fizetési adatok
        </span>
        <div className="flex-1 h-px" style={{ background: "var(--border-dim)" }} />
      </div>

      {/* Embedded Stripe PaymentElement */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-glow)",
          padding: "20px 16px",
          opacity: ready ? 1 : 0,
          transition: "opacity 0.3s ease",
          minHeight: ready ? undefined : 160,
        }}
      >
        <PaymentElement
          onReady={() => setReady(true)}
          options={{ layout: "accordion" }}
        />
      </div>

      {!ready && (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--cyan)" }} />
        </div>
      )}

      {error && (
        <div
          className="rounded-xl p-3 flex items-center gap-2 text-sm"
          style={{ background: "rgba(255,107,53,0.1)", border: "1px solid rgba(255,107,53,0.3)", color: "var(--orange)" }}
        >
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {/* Summary row before pay button */}
      <div
        className="rounded-xl p-3 flex items-center justify-between text-sm"
        style={{ background: "rgba(0,212,255,0.06)", border: "1px solid rgba(0,212,255,0.15)" }}
      >
        <span style={{ color: "var(--text-muted)" }}>Fizetendő összeg</span>
        <span className="font-black text-base" style={{ color: "var(--cyan)" }}>
          {price.toLocaleString("hu")} Ft
        </span>
      </div>

      <button
        type="submit"
        disabled={!stripe || submitting || !ready}
        className="btn-primary w-full flex items-center justify-center gap-2"
        style={{ opacity: (!stripe || submitting || !ready) ? 0.6 : 1 }}
      >
        {submitting ? (
          <>
            <span className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--bg-base)" }} />
            Feldolgozás...
          </>
        ) : (
          <>
            <ShoppingCart size={16} />
            Fizetés megerősítése — {price.toLocaleString("hu")} Ft
          </>
        )}
      </button>

      <p className="text-center text-xs" style={{ color: "var(--text-faint)" }}>
        Biztonságos fizetés — Stripe
      </p>
    </form>
  );
}

// ── Main checkout page ───────────────────────────────────────────────────────

export default function CheckoutPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [game, setGame] = useState<Game | null>(null);
  const [gameLoading, setGameLoading] = useState(true);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [piError, setPiError] = useState<string | null>(null);
  const [piLoading, setPiLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    getGame(id).then(setGame).finally(() => setGameLoading(false));
  }, [id]);

  const createPaymentIntent = useCallback(async () => {
    if (!user || !id) return;
    setPiLoading(true);
    setPiError(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ gameId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ismeretlen hiba");
      setClientSecret(data.clientSecret);
    } catch (err: unknown) {
      setPiError(err instanceof Error ? err.message : "Hiba a fizetés előkészítése közben.");
    } finally {
      setPiLoading(false);
    }
  }, [user, id]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/login?redirect=/checkout/${id}`);
    }
  }, [authLoading, user, id, router]);

  useEffect(() => {
    if (user && game && game.price && game.price > 0 && !clientSecret && !piLoading) {
      createPaymentIntent();
    }
  }, [user, game, clientSecret, piLoading, createPaymentIntent]);

  const loading = gameLoading || authLoading;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "var(--cyan)" }}
        />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "var(--bg-base)" }}>
        <p style={{ color: "var(--text-muted)" }}>A játék nem található.</p>
      </div>
    );
  }

  const appearance = {
    theme: "night" as const,
    variables: {
      colorPrimary: "#00d4ff",
      colorBackground: "#0f1628",
      colorText: "#e8f0fe",
      colorDanger: "#ff6b35",
      borderRadius: "12px",
      fontFamily: "DM Sans, Helvetica Neue, system-ui, sans-serif",
    },
  };

  return (
    <div className="min-h-screen py-8" style={{ background: "var(--bg-base)" }}>
      <Container>
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 mb-6 text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          <ArrowLeft size={16} />
          Vissza
        </button>

        {/* Game summary card */}
        <div
          className="glass rounded-2xl p-5 mb-6"
          style={{ borderColor: "var(--border-glow)" }}
        >
          <p className="text-xs font-semibold mb-1" style={{ color: "var(--cyan)" }}>
            VÁSÁRLÁS
          </p>
          <h1
            className="text-2xl font-black mb-1"
            style={{ fontFamily: "var(--font-cinzel), serif" }}
          >
            {getText(game.title)}
          </h1>
          {game.city && (
            <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>
              {getText(game.city)}
            </p>
          )}
          <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid var(--border-dim)" }}>
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>Ár</span>
            <span className="text-xl font-black" style={{ color: "var(--cyan)" }}>
              {game.price != null ? `${game.price.toLocaleString("hu")} Ft` : "—"}
            </span>
          </div>
        </div>

        {/* Payment section */}
        {piError && (
          <div
            className="glass rounded-xl p-4 mb-4 flex items-center gap-2 text-sm"
            style={{ borderColor: "var(--orange)", color: "var(--orange)" }}
          >
            <AlertCircle size={16} />
            {piError}
          </div>
        )}

        {piLoading && (
          <div className="flex items-center justify-center py-12">
            <div
              className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "var(--cyan)" }}
            />
          </div>
        )}

        {clientSecret && (
          <Elements
            stripe={stripePromise}
            options={{ clientSecret, appearance, locale: "hu" }}
          >
            <CheckoutForm gameId={id} price={game.price ?? 0} />
          </Elements>
        )}
      </Container>
    </div>
  );
}
