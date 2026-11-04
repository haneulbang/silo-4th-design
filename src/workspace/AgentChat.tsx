import { ArrowUp, BookmarkPlus, CheckCircle2, HelpCircle, Lightbulb, PlayCircle, RefreshCw, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Mascot } from "../components/Brand";
import { QuizCard, tagChipClass, type QuizResult } from "../components/QuizCard";
import { Rich } from "../components/Rich";
import { useToast } from "../components/Toast";
import { CONCEPTS, type Material, type Section } from "../data/materials";
import { getQuestion, questionsFor, variantOf } from "../data/questions";
import { askAgent } from "../lib/agent";
import { useStore, useWeakConcepts, type Attempt, type ChatMsg } from "../store";

export type Command = { n: number } & ({ kind: "ask"; prompt: string; quote?: string } | { kind: "quiz"; concept: string; qid?: string });

/** Chooses the next check question: easier after repeated misses, otherwise one not yet solved with confidence. */
export function pickQuestion(concept: string, attempts: Attempt[]) {
  const pool = questionsFor(concept);
  const mine = attempts.filter((a) => a.concept === concept);
  const solid = new Set(mine.filter((a) => a.correct && a.confidence === "sure").map((a) => a.qid));
  const lastTwo = mine.slice(-2);
  const struggling = lastTwo.length === 2 && lastTwo.every((a) => !a.correct);
  const open = pool.filter((q) => !solid.has(q.id));
  const list = (open.length ? open : pool).slice().sort((a, b) => {
    const seenA = mine.filter((x) => x.qid === a.id).length;
    const seenB = mine.filter((x) => x.qid === b.id).length;
    if (struggling) return a.level - b.level || seenA - seenB;
    return seenA - seenB || a.level - b.level;
  });
  return list[0];
}

export function AgentChat({ material, section, command }: { material: Material; section?: Section; command: Command | null }) {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const weak = useWeakConcepts();
  const msgs = state.chats[material.id] ?? [];
  const [input, setInput] = useState("");
  const [quote, setQuote] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const msgsRef = useRef(msgs);
  const lastConcept = useRef<string | undefined>(section?.concept);
  msgsRef.current = msgs;

  const setMsgs = (next: ChatMsg[]) => {
    msgsRef.current = next;
    dispatch({ type: "chat", materialId: material.id, messages: next });
  };
  const push = (...m: ChatMsg[]) => setMsgs([...msgsRef.current, ...m]);

  useEffect(() => {
    const el = scroller.current;
    if (el) requestAnimationFrame(() => el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }));
  }, [msgs.length, busy]);

  const ask = async (prompt: string, q?: string) => {
    if (!prompt.trim() || busy) return;
    const history = msgsRef.current.filter((m) => !m.card).map((m) => ({ role: m.role, content: m.content }));
    push({ role: "user", content: prompt, quote: q });
    setInput("");
    setQuote(undefined);
    setBusy(true);
    try {
      const full = q ? `다음 문장에 대해: "${q}"\n${prompt}` : prompt;
      const r = await askAgent({ material, section, prompt: full, history, weak: weak.map((w) => w.name) });
      push({ role: "assistant", content: r.text });
      if (r.concept) lastConcept.current = r.concept;
    } finally {
      setBusy(false);
    }
  };
  const quiz = (concept: string, qid?: string, intro?: string) => {
    const q = qid ? getQuestion(qid)! : pickQuestion(concept, state.attempts);
    if (!q) return;
    push({ role: "assistant", content: intro ?? `**${CONCEPTS[concept].name}** 확인 문제예요. 먼저 혼자 풀어보고, 막히면 힌트를 받아요.`, card: { kind: "quiz", qid: q.id } });
  };

  const onAnswered = (index: number, r: QuizResult) => {
    const q = getQuestion(r.qid)!;
    const next = msgsRef.current.map((m, i) => (i === index && m.card ? { ...m, card: { ...m.card, result: { correct: r.correct, tag: r.tag } } } : m));
    const follow = r.correct
      ? r.confidence === "sure"
        ? `좋아요! **${CONCEPTS[q.concept].name}**을 스스로 풀 수 있다는 기록이 남았어요.`
        : `맞혔지만 **${r.tag}**으로 기록했어요. 내일 같은 원리의 다른 문제로 한 번 더 확인할게요.`
      : `이번 실수는 **${r.tag}**이에요.${r.why ? ` ${r.why}` : ""}\n관련 취약점: **${CONCEPTS[q.concept].name}** · 내일 복습 목록에 넣어뒀어요.`;
    setMsgs([...next, { role: "assistant", content: follow }]);
  };

  // Commands from the reader (text selection, check buttons) arrive here.
  const handled = useRef(0);
  useEffect(() => {
    if (!command || handled.current === command.n) return;
    handled.current = command.n;
    if (command.kind === "ask") ask(command.prompt, command.quote);
    else quiz(command.concept, command.qid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [command?.n]);

  const suggestions = ["너가 무엇을 할 수 있어?", "지금 구간 설명해줘", "수업 요약해줘"];
  const concept = lastConcept.current ?? section?.concept ?? weak[0]?.concept ?? "where_having";

  return (
    <>
      <div className="panel-body" ref={scroller}>
        <div className="chat">
          {msgs.length === 0 && (
            <div className="welcome">
              <Mascot size={88} />
              <p>{state.user?.name}님, 어떤 게 궁금하세요? 차근차근 같이 풀어봐요.</p>
              {weak[0] && (
                <div className="explain" style={{ textAlign: "left", margin: "0 auto 14px", maxWidth: 300 }}>
                  <b>지난 학습에서 이어서</b>
                  <span><b style={{ display: "inline" }}>{weak[0].name}</b>에서 {weak[0].lastTag ?? "실수"}가 있었어요. 오늘은 이 부분부터 확인해볼까요?</span>
                </div>
              )}
              <div className="suggest">
                {suggestions.map((s) => (
                  <button key={s} onClick={() => ask(s)}>{s}</button>
                ))}
                <div style={{ height: 1, background: "var(--line)", margin: "8px 0" }} />
                <button onClick={() => quiz(weak[0]?.concept ?? concept)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  확인 문제로 실력 점검 <span className="chip chip-blue">START!</span>
                </button>
              </div>
            </div>
          )}

          {msgs.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="msg user">
                {m.quote && <span className="quote">{m.quote}</span>}
                {m.content}
              </div>
            ) : (
              <div key={i} className="msg bot">
                <div style={{ flex: "none", marginTop: 2 }}><Mascot size={26} /></div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="bubble"><Rich text={m.content} /></div>
                  {m.card?.kind === "quiz" &&
                    (m.card.result ? (
                      <div className="quiz-card" style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                        <CheckCircle2 size={16} color={m.card.result.correct ? "var(--green)" : "var(--red)"} />
                        <span className="grow ellipsis" style={{ flex: 1, fontSize: 13 }}>{getQuestion(m.card.qid)!.stem}</span>
                        <span className={`chip ${tagChipClass(m.card.result.tag)}`}>{m.card.result.tag ?? "정답"}</span>
                      </div>
                    ) : (
                      <QuizCard
                        className="quiz-card"
                        qid={m.card.qid}
                        source="check"
                        onAnswered={(r) => onAnswered(i, r)}
                      />
                    ))}
                  {i === msgs.length - 1 && !busy && (
                    <FollowUps
                      msg={m}
                      prev={msgs[i - 1]}
                      concept={concept}
                      onAsk={ask}
                      onQuiz={quiz}
                      onNote={(t) => {
                        dispatch({ type: "note", note: { materialId: material.id, sectionId: section?.id ?? "intro", text: t.replace(/\*\*/g, "").slice(0, 300) } });
                        toast("노트에 저장했어요");
                      }}
                    />
                  )}
                </div>
              </div>
            ),
          )}
          {busy && (
            <div className="msg bot">
              <Mascot size={26} mood="think" />
              <div className="bubble"><span className="typing"><i /><i /><i /></span></div>
            </div>
          )}
        </div>
      </div>

      <div className="composer">
        <div className="ctx">
          <PlayCircle size={13} />
          {section?.title ?? material.title}
          {quote && (
            <span className="chip quote-chip">
              <span className="ellipsis">“{quote}”</span>
              <button aria-label="인용 제거" onClick={() => setQuote(undefined)}><X size={11} /></button>
            </span>
          )}
        </div>
        <textarea
          value={input}
          maxLength={1000}
          placeholder={quote ? "이 문장에 대해 물어보세요" : "쉽게 설명해줄래?"}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              ask(input, quote);
            }
          }}
        />
        <div className="bar2">
          <span className="subtle">{input.length}/1000</span>
          <button className="send" aria-label="보내기" disabled={!input.trim() || busy} onClick={() => ask(input, quote)}><ArrowUp size={16} /></button>
        </div>
      </div>
      <div className="disclaimer">AI는 실수할 수 있어요. 공식 시험 정보는 시험 안내를 기준으로 확인하세요.</div>
    </>
  );
}

function FollowUps({
  msg,
  prev,
  concept,
  onAsk,
  onQuiz,
  onNote,
}: {
  msg: ChatMsg;
  prev?: ChatMsg;
  concept: string;
  onAsk: (p: string) => void;
  onQuiz: (concept: string, qid?: string, intro?: string) => void;
  onNote: (t: string) => void;
}) {
  if (msg.card) return null;
  // Right after a graded quiz: re-explain, a variant on the same principle, or save to the wrong-answer note.
  const done = prev?.card?.result ? prev.card : undefined;
  if (done) {
    const q = getQuestion(done.qid)!;
    const v = variantOf(q);
    return (
      <div className="bot-actions">
        {!done.result!.correct && <button onClick={() => onAsk(`${CONCEPTS[q.concept].name}를 다시 쉽게 설명해줘`)}><RefreshCw size={12} />다시 설명</button>}
        {v && (
          <button className={done.result!.correct ? "" : "primary"} onClick={() => onQuiz(v.concept, v.id, "같은 원리를 쓰는 **새 문제**예요. 외운 답이 아니라 이해했는지 확인해요.")}>
            <HelpCircle size={12} />변형 문제 풀기
          </button>
        )}
        {!done.result!.correct && <button onClick={() => onNote(`[오답] ${q.stem} → ${q.explanation}`)}><BookmarkPlus size={12} />오답노트 저장</button>}
      </div>
    );
  }
  return <ExplainActions concept={concept} text={msg.content} onAsk={onAsk} onQuiz={onQuiz} onNote={onNote} />;
}

/** Actions shown under a plain explanation: move the learner from reading to self-checking. */
export function ExplainActions({ concept, onAsk, onQuiz, onNote, text }: { concept: string; text: string; onAsk: (p: string) => void; onQuiz: (c: string) => void; onNote: (t: string) => void }) {
  return (
    <div className="bot-actions">
      <button className="primary" onClick={() => onQuiz(concept)}><CheckCircle2 size={12} />이해했어요, 문제로 확인</button>
      <button onClick={() => onAsk("더 쉽게 설명해줘")}><Sparkles size={12} />더 쉽게</button>
      <button onClick={() => onAsk("예시로 보여줘")}><Lightbulb size={12} />예시 보기</button>
      <button onClick={() => onNote(text)}><BookmarkPlus size={12} />노트 저장</button>
    </div>
  );
}
