import { ArrowLeftRight, ArrowUp, BookmarkPlus, CheckCircle2, HelpCircle, Lightbulb, MessageCircleQuestion, RefreshCw, ScrollText, Sparkles, SquareCode, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Mascot } from "../components/Brand";
import { QuizCard, tagChipClass, type QuizResult } from "../components/QuizCard";
import { Rich } from "../components/Rich";
import { useToast } from "../components/Toast";
import { CONCEPTS, type Material, type Section } from "../data/materials";
import { getQuestion, questionsFor, variantOf, type QuestionType } from "../data/questions";
import { askAgent } from "../lib/agent";
import { useStore, useWeakConcepts, type Attempt, type ChatMsg } from "../store";

export type Command = { n: number } & ({ kind: "ask"; prompt: string; quote?: string } | { kind: "quiz"; concept: string; qid?: string });

/** Chooses the next check question: easier after repeated misses, otherwise one not yet solved with confidence. */
/** Best next question on a concept: unseen or shaky first, easier ones when the learner is struggling. */
export function pickQuestion(concept: string, attempts: Attempt[], types: QuestionType[] = ["객관식", "OX"], exclude: string[] = []) {
  const typed = questionsFor(concept).filter((q) => types.includes(q.type));
  const fresh = typed.filter((q) => !exclude.includes(q.id));
  const pool = fresh.length ? fresh : typed;
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

/** Quick actions on the empty chat: the title is sent as the question. */
const QUICK = [
  { title: "이 페이지 핵심만 알려줘", desc: "지금 구간을 3줄로", icon: ScrollText },
  { title: "예시로 설명해줘", desc: "SQL 예제와 실행 결과로", icon: SquareCode },
  { title: "내가 이해했는지 확인해줘", desc: "내 말로 답해 보기", icon: MessageCircleQuestion },
  { title: "헷갈리는 개념 비교해줘", desc: "WHERE와 HAVING처럼", icon: ArrowLeftRight },
];

/** "조하늘" → "하늘": a friendlier greeting uses the given name when the full name has a surname in front. */
function firstName(name?: string) {
  if (!name) return "";
  return name.length >= 3 && !/\s/.test(name) ? name.slice(1) : name;
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
  const field = useRef<HTMLTextAreaElement>(null);
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
    if (field.current) field.current.style.height = "";
    setQuote(undefined);
    setBusy(true);
    try {
      const full = q ? `다음 문장에 대해: "${q}"\n${prompt}` : prompt;
      const r = await askAgent({ material, section, prompt: full, history, weak: weak.map((w) => w.name), tone: state.tone });
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

  const concept = lastConcept.current ?? section?.concept ?? weak[0]?.concept ?? "where_having";

  return (
    <>
      <div className="panel-body" ref={scroller}>
        <div className="chat">
          {msgs.length === 0 && (
            <div className="welcome">
              <Mascot size={88} />
              <p className="welcome-hi">{state.user ? `${firstName(state.user.name)}님, ` : "반가워요! "}저와 함께 쉽게 공부해요!</p>
              <h3 className="welcome-title">오늘은 무엇부터 해볼까요?</h3>
              <div className="quick-grid">
                {QUICK.map(({ title, desc, icon: Icon }) => (
                  <button key={title} className="quick-card" onClick={() => ask(title)}>
                    <span className="quick-ico"><Icon size={22} strokeWidth={1.8} /></span>
                    <span className="quick-title">{title}</span>
                    <span className="quick-desc">{desc}</span>
                  </button>
                ))}
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
                      <div className="quiz-card" style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
        {quote && (
          <div className="ctx">
            <span className="chip quote-chip">
              <span className="ellipsis">“{quote}”</span>
              <button aria-label="인용 제거" onClick={() => setQuote(undefined)}><X size={11} /></button>
            </span>
          </div>
        )}
        <textarea
          ref={field}
          value={input}
          maxLength={1000}
          placeholder={quote ? "이 문장에 대해 물어보세요" : "궁금한 건 무엇이든 물어보세요"}
          onChange={(e) => {
            setInput(e.target.value);
            // Grow with the text up to the CSS max, then scroll inside.
            const el = e.target;
            el.style.height = "";
            el.style.height = `${Math.min(el.scrollHeight, 136)}px`;
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              ask(input, quote);
            }
          }}
        />
        <div className="bar2">
          <button className="send" aria-label="보내기" disabled={!input.trim() || busy} onClick={() => ask(input, quote)}><ArrowUp size={16} /></button>
        </div>
      </div>
      <div className="disclaimer">AI는 실수할 수 있어요. 나눈 대화는 내게 맞는 퀴즈를 만드는 데 활용돼요.</div>
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
      <button onClick={() => onAsk("더 쉽게 설명해줘")}><Sparkles size={12} />더 쉽게</button>
      <button onClick={() => onAsk("예시로 보여줘")}><Lightbulb size={12} />예시 보기</button>
      <button onClick={() => onNote(text)}><BookmarkPlus size={12} />노트 저장</button>
    </div>
  );
}
