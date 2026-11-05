import { ChevronLeft, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Mascot } from "../components/Brand";
import { QuizCard, tagChipClass, type QuizResult } from "../components/QuizCard";
import { CONCEPTS, type Material, type Section } from "../data/materials";
import { getQuestion, type QuestionType } from "../data/questions";
import { detectConcept } from "../lib/agent";
import { useStore, useWeakConcepts, type Attempt } from "../store";
import { pickQuestion } from "./AgentChat";
import { ReviewTab } from "./SidePanels";

type Format = "대화형" | "객관식" | "빈칸" | "랜덤";

const SET_SIZE = 5;
/** Asking this many questions in chat is enough to build a set from the conversation. */
const ENOUGH_QUESTIONS = 2;

/** Mixed formats keep a set varied now that there is no format picker. */
const DEFAULT_FORMAT: Format = "랜덤";

const TYPES: Record<Exclude<Format, "랜덤">, QuestionType[]> = {
  대화형: ["대화형"],
  객관식: ["객관식", "OX"],
  빈칸: ["빈칸"],
};

/** Five questions spread across the chosen concepts, never repeating one. */
function buildSet(concepts: string[], format: Format, attempts: Attempt[], fallback: string[]) {
  const order = format === "랜덤" ? shuffle<Exclude<Format, "랜덤">>(["객관식", "빈칸", "대화형", "객관식", "빈칸"]) : Array(SET_SIZE).fill(format);
  const picked: string[] = [];
  const pools = [concepts, fallback];
  for (let i = 0; i < SET_SIZE; i++) {
    const types = TYPES[order[i] as Exclude<Format, "랜덤">];
    let id: string | undefined;
    for (const pool of pools) {
      for (let k = 0; k < pool.length && !id; k++) {
        const concept = pool[(i + k) % pool.length];
        const q = pickQuestion(concept, attempts, types, picked);
        if (q && !picked.includes(q.id)) id = q.id;
      }
      if (id) break;
    }
    if (id) picked.push(id);
  }
  return picked;
}

function shuffle<T>(list: T[]) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Concepts this material's conversations actually touched, from questions asked and quizzes taken in chat. */
function useChatConcepts(material: Material) {
  const { state } = useStore();
  return useMemo(() => {
    const msgs = [...(state.chats[material.id] ?? []), ...state.history.filter((h) => h.materialId === material.id).flatMap((h) => h.messages)];
    const asked = msgs.filter((m) => m.role === "user");
    const found = new Set<string>();
    for (const m of asked) {
      const c = detectConcept(`${m.quote ?? ""} ${m.content}`);
      if (c && CONCEPTS[c]?.material === material.id) found.add(c);
    }
    for (const m of msgs) {
      const c = m.card ? getQuestion(m.card.qid)?.concept : undefined;
      if (c) found.add(c);
    }
    return { concepts: [...found], asked: asked.length };
  }, [state.chats, state.history, material.id]);
}

export function QuizTab({ material, section, preset }: { material: Material; section?: Section; preset?: string }) {
  const { state, dispatch } = useStore();
  const weak = useWeakConcepts();
  const chat = useChatConcepts(material);
  const chatReady = chat.asked >= ENOUGH_QUESTIONS && chat.concepts.length > 0;

  const own = material.sections.filter((s) => s.concept).map((s) => s.concept!);
  // AI picks lead with weak spots, then the section being read, then the rest of the unit.
  const aiConcepts = [...new Set([...weak.map((w) => w.concept).filter((c) => own.includes(c)), ...(section?.concept ? [section.concept] : []), ...own])];

  // No setup step: questions come from what the learner asked when there's enough of it, otherwise the unit's core.
  const pick = () => buildSet(chatReady ? chat.concepts : aiConcepts, DEFAULT_FORMAT, state.attempts, aiConcepts);
  // Coming back to the tab resumes the saved set; a question answered but not yet moved past counts as done.
  const saved = state.quiz[material.id];
  const resumeAt = saved ? Math.max(saved.i, saved.results.length) : 0;
  const [phase, setPhase] = useState<"quiz" | "done">(saved ? (resumeAt >= saved.set.length ? "done" : saved.phase) : "quiz");
  const [reviewing, setReviewing] = useState(!!preset);
  const [set, setSet] = useState<string[]>(() => saved?.set ?? pick());
  const [retry, setRetry] = useState(saved?.retry ?? false);
  const [i, setI] = useState(saved ? Math.min(resumeAt, saved.set.length - 1) : 0);
  const [results, setResults] = useState<QuizResult[]>(saved?.results ?? []);

  useEffect(() => {
    dispatch({ type: "quiz", materialId: material.id, session: { set, i, results, retry, phase } });
  }, [set, i, results, retry, phase, material.id, dispatch]);
  const [answered, setAnswered] = useState(false);
  const [round, setRound] = useState(0);

  if (reviewing) {
    return (
      <>
        <div style={{ padding: "12px 16px 0", flex: "none" }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setReviewing(false)}>
            <ChevronLeft size={14} />확인 문제로 돌아가기
          </button>
        </div>
        <ReviewTab key={preset ?? "list"} preset={preset} />
      </>
    );
  }

  const begin = (ids: string[], isRetry: boolean) => {
    setSet(ids);
    setRetry(isRetry);
    setI(0);
    setResults([]);
    setAnswered(false);
    setRound((r) => r + 1);
    setPhase("quiz");
  };

  if (phase === "done") {
    const ok = results.filter((r) => r.correct).length;
    const sure = results.filter((r) => r.correct && r.confidence === "sure").length;
    const shaky = results.filter((r) => !r.correct || r.confidence !== "sure").map((r) => r.qid);
    return (
      <div className="panel-body" style={{ padding: 20 }}>
        <div className="quiz-done">
          <Mascot size={72} mood={ok === results.length ? "wow" : "smile"} />
          <h3>{retry ? "다시 풀기를 마쳤어요!" : `확인 문제 ${results.length}개를 모두 풀었어요!`}</h3>
          <p className="muted">{ok === results.length ? "전부 맞혔어요. 이 흐름 그대로 다음 단원으로 가도 좋아요." : "헷갈린 문제는 내일 같은 원리의 새 문제로 다시 나와요."}</p>
          <div className="quiz-score">
            <div><span className="subtle">맞힌 문제</span><b>{ok}<small> / {results.length}</small></b></div>
            <div><span className="subtle">확실히 알고 맞힘</span><b>{sure}<small>개</small></b></div>
          </div>
        </div>
        <div className="quiz-log">
          {results.map((r, k) => {
            const q = getQuestion(r.qid)!;
            return (
              <div className="list-row" key={`${r.qid}-${k}`}>
                <span className={`quiz-mark ${r.correct ? "ok" : "no"}`} aria-label={r.correct ? "정답" : "오답"}>{r.correct ? "O" : "X"}</span>
                <span className="grow">
                  <span className="ellipsis" style={{ display: "block", fontSize: 13 }}>{q.stem}</span>
                  <span className="subtle">{CONCEPTS[q.concept].name} · {q.type}</span>
                </span>
                <span className={`chip ${tagChipClass(r.tag)}`}>{r.tag ?? "정답"}</span>
              </div>
            );
          })}
        </div>
        <div className="quiz-actions">
          {shaky.length > 0 && (
            <button className="btn" onClick={() => begin(shaky, true)}>
              <RotateCcw size={14} />헷갈린 문제 다시 풀기
            </button>
          )}
          <button className="btn btn-primary" onClick={() => begin(pick(), false)}>새 문제 풀기</button>
        </div>
      </div>
    );
  }

  const qid = set[i];
  const done = results.length;
  const pct = Math.round((done / set.length) * 100);
  const last = i === set.length - 1;

  return (
    <div className="panel-body" style={{ padding: 20 }}>
      <QuizCard
        key={`${qid}-${round}-${i}`}
        className="quiz-card"
        qid={qid}
        source="check"
        top={
          <>
            <div className="quiz-strip" role="progressbar" aria-label="문제 진행" aria-valuemin={0} aria-valuemax={set.length} aria-valuenow={done}>
              <i style={{ width: `${pct}%` }} />
            </div>
            <span className="quiz-count">{retry && "다시 "}{Math.min(i + 1, set.length)} / {set.length}</span>
          </>
        }
        onAnswered={(r) => {
          setResults((rs) => [...rs, r]);
          setAnswered(true);
        }}
      />
      {answered && (
        <button
          className="btn btn-primary btn-block"
          style={{ marginTop: 12 }}
          onClick={() => {
            setAnswered(false);
            if (last) setPhase("done");
            else setI(i + 1);
          }}
        >
          {last ? "결과 보기" : "다음 문제"}
        </button>
      )}
    </div>
  );
}
