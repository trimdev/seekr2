export type I18nText =
  | string
  | { hu?: string; en?: string; de?: string }
  | null
  | undefined;

export interface Game {
  id: string;
  title: I18nText;
  city: I18nText;
  shortdesc?: I18nText;
  desc?: I18nText;
  story_intro?: I18nText;
  mission?: I18nText;
  theme?: string;
  difficulty?: "easy" | "medium" | "hard";
  category?: "outdoor" | "pub";
  price?: number | null;
  duration?: string;
  players?: string;
  image?: string;
  background?: string;
  startPoint?: { lat: number; lng: number; name?: string };
  endPoint?: { lat: number; lng: number; name?: string } | null;
  startName?: I18nText;
  endName?: I18nText;
  active?: boolean;
}

export interface Station {
  id?: string;
  order: number;
  type?: "text" | "lock" | "puzzle_order" | "puzzle_match" | "qr";
  title: I18nText;
  subtitle?: I18nText;
  riddle?: I18nText;
  task?: I18nText;
  story?: I18nText;
  hint?: I18nText;
  nextHint?: I18nText;
  solution?: I18nText;
  image?: string;
  active?: boolean;
  puzzleOrder?: string[];
  puzzleMatch?: { left: string; right: string }[];
  qrCode?: string;
}

export interface Member {
  uid: string;
  name: string;
  joinedAt: unknown;
}

export interface InputState {
  textValue?: string;
  qrValue?: string;
  lockDigits?: string[];
  orderItems?: string[];
  matchSelections?: Record<string, string>;
}

export interface GameSession {
  id?: string;
  gameId: string;
  createdBy: string;
  createdAt?: unknown;
  code?: string;
  status: "active" | "ended" | "paused";
  currentStep: number;
  started: boolean;
  solved: boolean;
  hintOpen: boolean;
  nextHintOpen: boolean;
  maxMembers?: number;
  members: Member[];
  inputState?: InputState;
}

export interface ChatMessage {
  uid: string;
  name: string;
  text: string;
  emoji?: string;
  createdAt: unknown;
}

export type PlayerRole = "host" | "guest";
