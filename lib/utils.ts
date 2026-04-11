import type { I18nText } from "@/types";

/**
 * Resolves an i18n text field to a plain string.
 * Falls back through hu → en → de → fallback string.
 */
export function getText(
  value: I18nText,
  lang: "hu" | "en" | "de" = "hu",
  fallback = ""
): string {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  return value[lang] ?? value.hu ?? value.en ?? value.de ?? fallback;
}

/** Combine class names (lightweight cn) */
export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

/** Generate a 6-character alphanumeric session code from a Firestore ID */
export function sessionCode(sessionId: string): string {
  return sessionId.slice(0, 6).toUpperCase();
}

/** Pad a number to 2 digits */
export function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

/** Format elapsed seconds as mm:ss */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${pad2(m)}:${pad2(s)}`;
}

/** Pick a colour from a fixed palette based on index (for player avatars) */
export const AVATAR_COLORS = [
  "#00d4ff",
  "#ff6b35",
  "#a855f7",
  "#22d3ee",
  "#f59e0b",
  "#10b981",
];

export function avatarColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

/** Build a share URL for a session */
export function sessionShareUrl(gameId: string, sessionId: string): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/games/${gameId}/play?session=${sessionId}`;
}
