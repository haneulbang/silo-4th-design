import { ChevronLeft, ChevronRight, MessageCircle, RotateCcw, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Mascot } from "../components/Brand";
import { QuizCard, tagChipClass, type QuizResult } from "../components/QuizCard";
import { CONCEPTS, type Material, type Section } from "../data/materials";
import { getQuestion, type QuestionType } from "../data/questions";
import { detectConcept } from "../lib/agent";
import { useStore, useWeakConcepts, type Attempt } from "../store";
import { pickQuestion } from "./AgentChat";
import { ReviewTab } from "./SidePanels";

type Origin = "chat" | "ai";
type Format = "대화형" | "객관식" | "빈칸" | "랜덤";

const SET_SIZE = 5;
/** Asking this many questions in chat is enough to build a set from the conversation. */
const ENOUGH_QUESTIONS = 2;

const FORMATS: { k: Format; desc: string }[] = [
  { k: "대화형", desc: "배운 개념을 내 말로 설명해요" },
  { k: "객관식", desc: "보기 중에서 정답을 골라요" },
  { k: "빈칸", desc: "핵심 단어를 직접 채워요" },
  { k: "랜덤", desc: "세 가지 방식을 골고루 섞어요" },
];

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

export function QuizTab({ material, section, preset, onAsk }: { material: Material; section?: Section; preset?: string; onAsk: () => void }) {
  const { state } = useStore();
  const weak = useWeakConcepts();
  const chat = useChatConcepts(material);
  const chatReady = chat.asked >= ENOUGH_QUESTIONS && chat.concepts.length > 0;

  const own = material.sections.filter((s) => s.concept).map((s) => s.concept!);
  // AI picks lead with weak spots, then the section being read, then the rest of the unit.
  const aiConcepts = [...new Set([...weak.map((w) => w.concept).filter((c) => own.includes(c)), ...(section?.concept ? [section.concept] : []), ...own])];

  const [phase, setPhase] = useState<"setup" | "quiz" | "done">("setup");
  const [reviewing, setReviewing] = useState(!!preset);
  const [origin, setOrigin] = useState<Origin>(chatReady ? "chat" : "ai");
  const [format, setFormat] = useState<Format>("객관식");
  const [set, setSet] = useState<string[]>([]);
  const [retry, setRetry] = useState(false);
  const [i, setI] = useState(0);
  const [results, setResults] = useState<QuizResult[]>([]);
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
    setPhase(ids.length ? "quiz" : "setup");
  };
  const start = () => {
    const concepts = origin === "chat" && chatReady ? chat.concepts : aiConcepts;
    begin(buildSet(concepts, format, state.attempts, aiConcepts), false);
  };

  if (phase === "setup") {
    const useChat = origin === "chat" && chatReady;
    return (
      <div className="panel-body" style={{ padding: 20 }}>
        <div className="qs-intro">
          <Mascot size={40} />
          <div>
            <h3>배운 내용을 확인해 보아요!</h3>
            <p className="muted">읽고 물어본 내용으로 {SET_SIZE}문제를 만들어요.</p>
          </div>
        </div>

        <div className="qs-label" id="qs-origin">어떤 내용으로 풀까요?</div>
        <div className="qs-sources" role="radiogroup" aria-labelledby="qs-origin">
          {chatReady ? (
            <button className={`qs-source ${useChat ? "on" : ""}`} role="radio" aria-checked={useChat} onClick={() => setOrigin("chat")}>
              <span className="grow">
                <span className="qs-source-title"><MessageCircle size={15} />내 대화 기반</span>
                <span className="qs-source-desc">AI 에이전트에게 물어본 개념으로 문제를 만들어요</span>
                <span className="qs-chips">
                  {chat.concepts.map((c) => <span key={c} className="chip">{CONCEPTS[c].name}</span>)}
                </span>
              </span>
            </button>
          ) : (
            <div className="qs-source is-off" role="radio" aria-checked={false} aria-disabled="true">
              <span className="grow">
                <span className="qs-source-title"><MessageCircle size={15} />내 대화 기반</span>
                <span className="qs-source-desc">
                  아직 물어본 내용이 적어요. 질문을 {ENOUGH_QUESTIONS}개 이상 하면 고를 수 있어요.
                </span>
                <button className="qs-ask" onClick={onAsk}>
                  질문하러 가기<ChevronRight size={14} />
                </button>
              </span>
            </div>
          )}
          <button className={`qs-source ${!useChat ? "on" : ""}`} role="radio" aria-checked={!useChat} onClick={() => setOrigin("ai")}>
            <span className="grow">
              <span className="qs-source-title"><Sparkles size={15} />AI 추천 문제</span>
              <span className="qs-source-desc">이 단원의 핵심 개념으로 문제를 만들어요</span>
            </span>
          </button>
        </div>

        <div className="qs-label" id="qs-format">어떤 방식이 좋을까요?</div>
        <div className="qs-formats" role="radiogroup" aria-labelledby="qs-format">
          {FORMATS.map((f) => (
            <button key={f.k} className={`qs-format ${format === f.k ? "on" : ""}`} role="radio" aria-checked={format === f.k} onClick={() => setFormat(f.k)}>
              <span className="qs-format-title">{f.k}</span>
              <span className="qs-format-desc">{f.desc}</span>
            </button>
          ))}
        </div>

        <button className="btn btn-primary btn-block" style={{ marginTop: 20 }} onClick={start}>
          {SET_SIZE}문제 풀어보기
        </button>
      </div>
    );
  }

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
          <button className="btn btn-primary" onClick={() => setPhase("setup")}>새 문제 풀기</button>
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
