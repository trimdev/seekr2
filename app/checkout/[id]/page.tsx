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
import { ArrowLeft, ShoppingCart, AlertCircle, Lock, MapPin, Clock, Users, CheckCircle2 } from "lucide-react";
import { getGame } from "@/lib/firestore";
import { getText } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";
import { Container } from "@/components/ui/Container";
import type { Game } from "@/types";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// ── Embedded payment form ────────────────────────────────────────────────────

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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Stripe PaymentElement */}
      <div style={{ position: "relative", minHeight: ready ? undefined : 180 }}>
        <div
          style={{
            borderRadius: 16,
            overflow: "hidden",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-dim)",
            padding: "18px 16px",
            opacity: ready ? 1 : 0,
            transition: "opacity 0.35s ease",
          }}
        >
          <PaymentElement
            onReady={() => setReady(true)}
            options={{ layout: "accordion" }}
          />
        </div>
        {!ready && (
          <div
            style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: 16,
              background: "var(--bg-surface)",
              border: "1px solid var(--border-dim)",
            }}
          >
            <div
              className="animate-spin"
              style={{
                width: 24, height: 24,
                borderRadius: "50%",
                border: "2px solid rgba(0,212,255,0.2)",
                borderTopColor: "var(--cyan)",
              }}
            />
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            borderRadius: 12, padding: "12px 14px",
            display: "flex", alignItems: "center", gap: 8,
            background: "rgba(255,107,53,0.1)",
            border: "1px solid rgba(255,107,53,0.3)",
            color: "var(--orange)", fontSize: 14,
          }}
        >
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          {error}
        </div>
      )}

      {/* Total row */}
      <div
        style={{
          borderRadius: 12, padding: "12px 16px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "rgba(0,212,255,0.06)",
          border: "1px solid rgba(0,212,255,0.18)",
        }}
      >
        <span style={{ fontSize: 14, color: "var(--text-muted)" }}>Fizetendő összeg</span>
        <span style={{ fontSize: 20, fontWeight: 900, color: "var(--cyan)" }}>
          {price.toLocaleString("hu")} Ft
        </span>
      </div>

      {/* Pay button */}
      <button
        type="submit"
        disabled={!stripe || submitting || !ready}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          width: "100%", minHeight: 54,
          borderRadius: 9999,
          background: (!stripe || submitting || !ready)
            ? "rgba(0,212,255,0.3)"
            : "linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)",
          color: "#020c18",
          fontWeight: 800, fontSize: 15,
          border: "none", cursor: (!stripe || submitting || !ready) ? "not-allowed" : "pointer",
          boxShadow: (!stripe || submitting || !ready)
            ? "none"
            : "0 0 24px rgba(0,212,255,0.4), 0 4px 12px rgba(0,0,0,0.3)",
          transition: "all 0.2s",
        }}
      >
        {submitting ? (
          <>
            <span
              className="animate-spin"
              style={{
                width: 16, height: 16, borderRadius: "50%",
                border: "2px solid rgba(2,12,24,0.3)",
                borderTopColor: "#020c18", flexShrink: 0,
              }}
            />
            Feldolgozás...
          </>
        ) : (
          <>
            <ShoppingCart size={17} />
            Fizetés — {price.toLocaleString("hu")} Ft
          </>
        )}
      </button>

      {/* Trust line */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <Lock size={11} style={{ color: "var(--text-faint)" }} />
        <span style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: "0.02em" }}>
          Biztonságos fizetés — Stripe titkosítással
        </span>
      </div>
    </form>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

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
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
    if (!authLoading && !user) router.replace(`/login?redirect=/checkout/${id}`);
  }, [authLoading, user, id, router]);

  useEffect(() => {
    if (user && game && game.price && game.price > 0 && !clientSecret && !piLoading) {
      createPaymentIntent();
    }
  }, [user, game, clientSecret, piLoading, createPaymentIntent]);

  const loading = gameLoading || authLoading;

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-base)" }}>
        <div className="animate-spin" style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid rgba(0,212,255,0.2)", borderTopColor: "var(--cyan)" }} />
      </div>
    );
  }

  if (!game) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-base)" }}>
        <p style={{ color: "var(--text-muted)" }}>A játék nem található.</p>
      </div>
    );
  }

  const coverSrc = game.image || game.background || `/game-images/${id}.png`;

  const appearance = {
    theme: "night" as const,
    variables: {
      colorPrimary: "#00d4ff",
      colorBackground: "#1c2844",
      colorText: "#f0f6ff",
      colorTextSecondary: "#9db4cc",
      colorDanger: "#ff6b35",
      borderRadius: "12px",
      fontFamily: "DM Sans, Helvetica Neue, system-ui, sans-serif",
      spacingUnit: "4px",
    },
    rules: {
      ".Input": { backgroundColor: "#131c2e", borderColor: "rgba(232,240,254,0.13)" },
      ".Input:focus": { borderColor: "rgba(0,212,255,0.45)", boxShadow: "0 0 0 3px rgba(0,212,255,0.1)" },
      ".Label": { color: "#9db4cc", fontSize: "12px", fontWeight: "600" },
      ".Tab": { backgroundColor: "#131c2e", borderColor: "rgba(232,240,254,0.1)" },
      ".Tab--selected": { backgroundColor: "rgba(0,212,255,0.08)", borderColor: "rgba(0,212,255,0.4)" },
      ".Tab:hover": { backgroundColor: "rgba(0,212,255,0.05)" },
    },
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", paddingBottom: 48 }}>
      <Container>
        {/* Back */}
        <button
          onClick={() => router.back()}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            marginTop: 24, marginBottom: 24,
            color: "var(--text-muted)", fontSize: 14,
            background: "none", border: "none", cursor: "pointer", padding: 0,
          }}
        >
          <ArrowLeft size={16} />
          Vissza
        </button>

        {/* Header label */}
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase", color: "var(--cyan)", marginBottom: 8 }}>
          Vásárlás
        </p>

        {/* Game card — cover + details */}
        <div
          style={{
            borderRadius: 20,
            overflow: "hidden",
            border: "1px solid var(--border-dim)",
            marginBottom: 24,
            background: "var(--bg-surface)",
          }}
        >
          {/* Cover image */}
          <div style={{ position: "relative", height: 160, background: "var(--bg-base)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverSrc}
              alt={getText(game.title) ?? ""}
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%" }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 30%, rgba(28,40,68,0.95) 100%)" }} />
            {/* Price badge */}
            {game.price != null && (
              <div
                style={{
                  position: "absolute", top: 12, right: 12,
                  padding: "4px 12px", borderRadius: 9999,
                  background: "rgba(255,107,53,0.85)",
                  color: "#fff", fontSize: 13, fontWeight: 800,
                  border: "1px solid rgba(255,140,80,0.5)",
                }}
              >
                {game.price === 0 ? "Ingyenes" : `${game.price.toLocaleString("hu")} Ft`}
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ padding: "16px 18px 18px" }}>
            <h1
              style={{
                fontFamily: "var(--font-cinzel), serif",
                fontSize: "clamp(18px, 5vw, 24px)",
                fontWeight: 900, color: "var(--text-primary)",
                margin: "0 0 6px",
              }}
            >
              {getText(game.title)}
            </h1>

            {/* Meta row */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 14 }}>
              {game.city && (
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--text-muted)" }}>
                  <MapPin size={12} style={{ color: "var(--cyan)" }} />
                  {getText(game.city)}
                </span>
              )}
              {game.duration && (
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--text-muted)" }}>
                  <Clock size={12} style={{ color: "var(--cyan)" }} />
                  {game.duration}
                </span>
              )}
              {game.players && (
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--text-muted)" }}>
                  <Users size={12} style={{ color: "var(--cyan)" }} />
                  {game.players}
                </span>
              )}
            </div>

            {/* What you get */}
            <div style={{ borderTop: "1px solid var(--border-dim)", paddingTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                "Korlátlan lejátszás a csapattal",
                "Valós idejű szinkron minden eszközön",
                "Azonnali hozzáférés vásárlás után",
              ].map((item) => (
                <div key={item} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <CheckCircle2 size={14} style={{ color: "var(--cyan)", flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Payment intent error */}
        {piError && (
          <div
            style={{
              borderRadius: 12, padding: "12px 14px",
              display: "flex", alignItems: "center", gap: 8,
              background: "rgba(255,107,53,0.1)",
              border: "1px solid rgba(255,107,53,0.3)",
              color: "var(--orange)", fontSize: 14,
              marginBottom: 16,
            }}
          >
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            {piError}
            <button
              onClick={createPaymentIntent}
              style={{ marginLeft: "auto", fontSize: 13, fontWeight: 700, color: "var(--orange)", background: "none", border: "none", cursor: "pointer" }}
            >
              Újra
            </button>
          </div>
        )}

        {/* Loading PI */}
        {piLoading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 0" }}>
            <div className="animate-spin" style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid rgba(0,212,255,0.2)", borderTopColor: "var(--cyan)" }} />
          </div>
        )}

        {/* Stripe Elements */}
        {clientSecret && (
          <Elements stripe={stripePromise} options={{ clientSecret, appearance, locale: "hu" }}>
            <CheckoutForm gameId={id} price={game.price ?? 0} />
          </Elements>
        )}
      </Container>
    </div>
  );
}
