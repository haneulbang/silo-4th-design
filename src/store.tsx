import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import { CONCEPTS } from "./data/materials";
import { getQuestion, type ErrorTag } from "./data/questions";

export type Confidence = "sure" | "unsure" | "guess";
export type Source = "diagnosis" | "check" | "review";

export type Attempt = {
  id: string;
  qid: string;
  concept: string;
  correct: boolean;
  confidence: Confidence;
  hints: number;
  tag?: ErrorTag;
  source: Source;
  /** Set when a variant question was asked in place of a scheduled review. */
  reviewOf?: string;
  at: number;
};

export type Review = { qid: string; concept: string; due: number; step: number };
export type Note = { id: string; materialId: string; sectionId: string; text: string; quote?: string; at: number };
export type ChatMsg = {
  role: "user" | "assistant";
  content: string;
  quote?: string;
  card?: { kind: "quiz"; qid: string; result?: { correct: boolean; tag?: ErrorTag } };
};

/** How the AI agent talks: plain, playful, teacherly, warm, or straight to the point. */
export type Tone = "기본" | "MZ" | "선생님" | "F감성" | "T감성";

/** A finished conversation, kept so the learner can reopen it from the history list. */
export type SavedChat = { id: string; materialId: string; at: number; messages: ChatMsg[] };

type State = {
  user: { name: string } | null;
  setup: { dailyMinutes: number; diagnosed: boolean } | null;
  attempts: Attempt[];
  reviews: Review[];
  notes: Note[];
  read: Record<string, string[]>;
  chats: Record<string, ChatMsg[]>;
  history: SavedChat[];
  tone: Tone;
  minutes: Record<string, number>;
  lastMaterial?: { id: string; section: string };
};

type Action =
  | { type: "login"; name: string }
  | { type: "logout" }
  | { type: "setup"; dailyMinutes: number; diagnosed: boolean }
  | { type: "attempt"; attempt: Omit<Attempt, "id" | "at" | "tag" | "concept">; picked: number }
  | { type: "note"; note: Omit<Note, "id" | "at"> }
  | { type: "deleteNote"; id: string }
  | { type: "read"; materialId: string; sectionId: string }
  | { type: "chat"; materialId: string; messages: ChatMsg[] }
  | { type: "newChat"; materialId: string }
  | { type: "setTone"; tone: Tone }
  | { type: "openChat"; id: string }
  | { type: "tick"; minutes: number }
  | { type: "reset" };

const KEY = "sprout-state-v1";
const DAY = 86_400_000;
/** Review intervals in days; a correct review moves one step right, a miss goes back to the start. */
export const INTERVALS = [1, 3, 7, 14];

const initial: State = { user: null, setup: null, attempts: [], reviews: [], notes: [], read: {}, chats: {}, history: [], tone: "기본", minutes: {} };

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...initial, ...JSON.parse(raw) } : initial;
  } catch {
    return initial;
  }
}

export const todayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const uid = () => Math.random().toString(36).slice(2, 10);

export function tagFor(correct: boolean, confidence: Confidence, optionTag?: ErrorTag): ErrorTag | undefined {
  if (!correct) return optionTag ?? "개념 부족";
  if (confidence === "guess") return "찍어서 맞힘";
  if (confidence === "unsure") return "낮은 확신";
  return undefined;
}

function schedule(reviews: Review[], a: Attempt): Review[] {
  const key = a.reviewOf ?? a.qid;
  const rest = reviews.filter((r) => r.qid !== key);
  const prev = reviews.find((r) => r.qid === key);
  const solid = a.correct && a.confidence === "sure";
  if (!prev) {
    // Only shaky or wrong answers enter the review queue.
    if (solid) return rest;
    return [...rest, { qid: a.qid, concept: a.concept, due: a.at + DAY, step: 0 }];
  }
  if (!a.correct) return [...rest, { ...prev, due: a.at + DAY, step: 0 }];
  const step = prev.step + 1;
  if (step >= INTERVALS.length) return rest;
  return [...rest, { ...prev, step, due: a.at + INTERVALS[step] * DAY }];
}

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "login":
      return { ...s, user: { name: a.name } };
    case "logout":
      return { ...s, user: null };
    case "setup":
      return { ...s, setup: { dailyMinutes: a.dailyMinutes, diagnosed: a.diagnosed } };
    case "attempt": {
      const q = getQuestion(a.attempt.qid)!;
      const attempt: Attempt = {
        ...a.attempt,
        id: uid(),
        at: Date.now(),
        concept: q.concept,
        tag: tagFor(a.attempt.correct, a.attempt.confidence, q.options[a.picked]?.tag),
      };
      return { ...s, attempts: [...s.attempts, attempt], reviews: schedule(s.reviews, attempt) };
    }
    case "note":
      return { ...s, notes: [{ ...a.note, id: uid(), at: Date.now() }, ...s.notes] };
    case "deleteNote":
      return { ...s, notes: s.notes.filter((n) => n.id !== a.id) };
    case "read": {
      const list = s.read[a.materialId] ?? [];
      return {
        ...s,
        lastMaterial: { id: a.materialId, section: a.sectionId },
        read: list.includes(a.sectionId) ? s.read : { ...s.read, [a.materialId]: [...list, a.sectionId] },
      };
    }
    case "chat":
      return { ...s, chats: { ...s.chats, [a.materialId]: a.messages.slice(-40) } };
    case "setTone":
      return { ...s, tone: a.tone };
    case "newChat": {
      const current = s.chats[a.materialId] ?? [];
      if (!current.length) return s;
      const saved: SavedChat = { id: uid(), materialId: a.materialId, at: Date.now(), messages: current };
      return { ...s, chats: { ...s.chats, [a.materialId]: [] }, history: [saved, ...s.history].slice(0, 30) };
    }
    case "openChat": {
      const target = s.history.find((h) => h.id === a.id);
      if (!target) return s;
      const current = s.chats[target.materialId] ?? [];
      const rest = s.history.filter((h) => h.id !== a.id);
      const kept = current.length ? [{ id: uid(), materialId: target.materialId, at: Date.now(), messages: current }, ...rest] : rest;
      return { ...s, chats: { ...s.chats, [target.materialId]: target.messages }, history: kept.slice(0, 30) };
    }
    case "tick": {
      const k = todayKey();
      return { ...s, minutes: { ...s.minutes, [k]: (s.minutes[k] ?? 0) + a.minutes } };
    }
    case "reset":
      return { ...initial, user: s.user };
  }
}

const Ctx = createContext<{ state: State; dispatch: (a: Action) => void } | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable — state stays in memory */
    }
  }, [state]);
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore outside provider");
  return ctx;
}

const WEIGHT: Record<Confidence, number> = { sure: 1, unsure: 0.6, guess: 0.3 };

export type Mastery = { concept: string; name: string; score: number | null; tries: number; lastTag?: ErrorTag };

/** Mastery from the last four attempts: a correct answer counts by confidence, a miss counts zero. */
export function useMastery(): Mastery[] {
  const { state } = useStore();
  return useMemo(
    () =>
      Object.entries(CONCEPTS).map(([concept, c]) => {
        const list = state.attempts.filter((a) => a.concept === concept);
        const recent = list.slice(-4);
        const score = recent.length ? recent.reduce((t, a) => t + (a.correct ? WEIGHT[a.confidence] : 0), 0) / recent.length : null;
        return { concept, name: c.name, score, tries: list.length, lastTag: [...list].reverse().find((a) => a.tag)?.tag };
      }),
    [state.attempts],
  );
}

export function useWeakConcepts() {
  return useMastery()
    .filter((m) => m.score !== null && m.score < 0.7)
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
}

export function useDueReviews() {
  const { state } = useStore();
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return state.reviews.filter((r) => r.due <= end.getTime()).sort((a, b) => a.due - b.due);
}

export function daysUntil(date: string) {
  const t = new Date(date + "T00:00:00").getTime();
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((t - now.getTime()) / DAY);
}
