"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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

// ── Field component ──────────────────────────────────────────────────────────

function Field({
  label,
  required,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.03em" }}>
        {label}{required && <span style={{ color: "var(--cyan)", marginLeft: 2 }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        style={{
          background: "#131c2e",
          border: "1px solid rgba(232,240,254,0.13)",
          borderRadius: 12,
          padding: "11px 14px",
          fontSize: 15,
          color: "var(--text-primary)",
          outline: "none",
          width: "100%",
          boxSizing: "border-box",
          transition: "border-color 0.15s",
          opacity: disabled ? 0.6 : 1,
        }}
        onFocus={(e) => { e.target.style.borderColor = "rgba(0,212,255,0.45)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,212,255,0.1)"; }}
        onBlur={(e) => { e.target.style.borderColor = "rgba(232,240,254,0.13)"; e.target.style.boxShadow = "none"; }}
      />
    </div>
  );
}

// ── Embedded payment form ────────────────────────────────────────────────────

interface BillingInfo {
  name: string;
  email: string;
  address: string;
  taxNumber: string;
}

function CheckoutForm({
  gameId,
  price,
  billing,
  onBillingChange,
}: {
  gameId: string;
  price: number;
  billing: BillingInfo;
  onBillingChange: (b: BillingInfo) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    if (!billing.name.trim() || !billing.email.trim() || !billing.address.trim()) {
      setError("Kérjük, töltsd ki az összes kötelező mezőt.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success?gameId=${gameId}`,
        payment_method_data: {
          billing_details: {
            name: billing.name.trim(),
            email: billing.email.trim(),
            address: { line1: billing.address.trim() },
          },
        },
      },
    });
    if (stripeError) {
      setError(stripeError.message ?? "Fizetési hiba történt.");
      setSubmitting(false);
    }
  };

  const set = (key: keyof BillingInfo) => (v: string) =>
    onBillingChange({ ...billing, [key]: v });

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Billing fields */}
      <div
        style={{
          borderRadius: 16,
          background: "var(--bg-surface)",
          border: "1px solid var(--border-dim)",
          padding: "18px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--cyan)", marginBottom: 2 }}>
          Számlázási adatok
        </p>
        <Field
          label="Teljes név"
          required
          value={billing.name}
          onChange={set("name")}
          placeholder="Kovács János"
        />
        <Field
          label="E-mail cím"
          required
          type="email"
          value={billing.email}
          onChange={set("email")}
          placeholder="pelda@email.com"
        />
        <Field
          label="Cím"
          required
          value={billing.address}
          onChange={set("address")}
          placeholder="1234 Budapest, Példa utca 1."
        />
        <Field
          label="Adószám (opcionális)"
          value={billing.taxNumber}
          onChange={set("taxNumber")}
          placeholder="12345678-1-23"
        />
      </div>

      {/* Stripe PaymentElement — always mounted so Stripe initialises immediately */}
      <div style={{ position: "relative", borderRadius: 16, overflow: "hidden" }}>
        {/* Skeleton overlay — fades out once Stripe signals ready */}
        {!ready && (
          <div
            style={{
              position: "absolute", inset: 0, zIndex: 2,
              borderRadius: 16,
              background: "var(--bg-surface)",
              border: "1px solid var(--border-dim)",
              padding: "18px 16px",
              display: "flex", flexDirection: "column", gap: 10,
            }}
          >
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--cyan)", marginBottom: 2 }}>
              Fizetési mód
            </p>
            {[68, 45, 80].map((w, i) => (
              <div key={i} style={{ height: 13, borderRadius: 6, width: `${w}%`, background: "rgba(232,240,254,0.07)" }} />
            ))}
          </div>
        )}
        {/* PaymentElement is always in the DOM so Stripe can initialize in background */}
        <div
          style={{
            borderRadius: 16,
            background: "var(--bg-surface)",
            border: "1px solid var(--border-dim)",
            padding: "18px 16px",
            opacity: ready ? 1 : 0,
            transition: "opacity 0.3s ease",
          }}
        >
          <PaymentElement
            onReady={() => setReady(true)}
            options={{ layout: "accordion" }}
          />
        </div>
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
  const piStarted = useRef(false);

  const [billing, setBilling] = useState<BillingInfo>({
    name: "",
    email: "",
    address: "",
    taxNumber: "",
  });

  // Load game
  useEffect(() => {
    if (!id) return;
    getGame(id).then(setGame).finally(() => setGameLoading(false));
  }, [id]);

  // Pre-fill email once user is known
  useEffect(() => {
    if (user?.email && !billing.email) {
      setBilling((b) => ({ ...b, email: user.email! }));
    }
  }, [user]);

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

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) router.replace(`/login?redirect=/checkout/${id}`);
  }, [authLoading, user, id, router]);

  // Start PI as soon as user is ready — don't wait for game load
  useEffect(() => {
    if (!user || authLoading || piStarted.current) return;
    piStarted.current = true;
    createPaymentIntent();
  }, [user, authLoading, createPaymentIntent]);

  const loading = gameLoading || authLoading;

  if (loading && !game) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-base)" }}>
        <div className="animate-spin" style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid rgba(0,212,255,0.2)", borderTopColor: "var(--cyan)" }} />
      </div>
    );
  }

  const coverSrc = game?.image || game?.background || `/game-images/${id}.jpg`;

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
        {game && (
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
                onError={(e) => {
                  const el = e.target as HTMLImageElement;
                  if (!el.src.includes("/game-images/") || el.src.endsWith(".jpg")) {
                    el.src = `/game-images/${id}.png`;
                  } else {
                    el.style.display = "none";
                  }
                }}
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
        )}

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
            <CheckoutForm
              gameId={id}
              price={game?.price ?? 0}
              billing={billing}
              onBillingChange={setBilling}
            />
          </Elements>
        )}
      </Container>
    </div>
  );
}
