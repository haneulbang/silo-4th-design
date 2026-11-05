import { Check, CircleDashed, Lightbulb, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { CONCEPTS } from "../data/materials";
import { getQuestion, type ErrorTag, type Question } from "../data/questions";
import { tagFor, useStore, type Confidence, type Source } from "../store";

export type QuizResult = { qid: string; correct: boolean; confidence: Confidence; tag?: ErrorTag; why?: string };

const CONF: { v: Confidence; label: string }[] = [
  { v: "sure", label: "확실히 알고 풀었어요" },
  { v: "unsure", label: "두 선택지 중 고민했어요" },
  { v: "guess", label: "잘 몰라서 추측했어요" },
];

export function tagChipClass(tag?: ErrorTag) {
  if (!tag) return "chip-green";
  if (tag === "찍어서 맞힘" || tag === "낮은 확신") return "chip-amber";
  return "chip-red";
}

export function QuizCard({
  qid,
  source,
  reviewOf,
  hints = true,
  showExplain = true,
  className = "",
  footer,
  top,
  onAnswered,
}: {
  qid: string;
  source: Source;
  reviewOf?: string;
  hints?: boolean;
  showExplain?: boolean;
  className?: string;
  footer?: (r: QuizResult) => ReactNode;
  /** Shown inside the card above the question, e.g. set progress. */
  top?: ReactNode;
  onAnswered?: (r: QuizResult) => void;
}) {
  const q = getQuestion(qid)!;
  if (q.type === "빈칸" || q.type === "대화형") {
    return <WrittenCard q={q} source={source} reviewOf={reviewOf} hints={hints} showExplain={showExplain} className={className} footer={footer} top={top} onAnswered={onAnswered} />;
  }
  return <ChoiceCard q={q} source={source} reviewOf={reviewOf} hints={hints} showExplain={showExplain} className={className} footer={footer} top={top} onAnswered={onAnswered} />;
}

type CardProps = {
  q: Question;
  source: Source;
  reviewOf?: string;
  hints: boolean;
  showExplain: boolean;
  className: string;
  footer?: (r: QuizResult) => ReactNode;
  /** Shown inside the card above the question, e.g. set progress. */
  top?: ReactNode;
  onAnswered?: (r: QuizResult) => void;
};

function CardHead({ q }: { q: Question }) {
  return (
    <>
      <div className="q-chips" style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        <span className="chip">{CONCEPTS[q.concept].name}</span>
        <span className="chip chip-blue">{q.type}</span>
        <span className="chip" aria-label={`난이도 ${q.level} / 3`}>
          난이도
          <span className="level" aria-hidden>{[1, 2, 3].map((l) => <i key={l} className={l <= q.level ? "on" : ""} />)}</span>
        </span>
      </div>
      {q.type === "빈칸" ? (
        <p className="q-stem">
          {q.stem.split("____").map((part, i, arr) => (
            <span key={i}>{part}{i < arr.length - 1 && <span className="q-blank" aria-label="빈칸">&nbsp;</span>}</span>
          ))}
        </p>
      ) : (
        <>
          <p className="q-stem">{q.stem}</p>
          {q.type === "대화형" && <p className="q-note">정답이 하나로 정해진 문제는 아니에요. 핵심 개념을 넣어 내 말로 설명해 보세요.</p>}
        </>
      )}
      {q.code && <pre className="q-code mono">{q.code}</pre>}
    </>
  );
}

function Hints({ q, n }: { q: Question; n: number }) {
  return (
    <>
      {q.hints.slice(0, n).map((h, i) => (
        <div className="hint" key={i}>
          <Lightbulb size={15} style={{ flex: "none", marginTop: 1 }} />
          <span><b>힌트 {i + 1}</b> · {h}</span>
        </div>
      ))}
    </>
  );
}

function HintButton({ n, onMore }: { n: number; onMore: () => void }) {
  return (
    <button className="btn btn-sm btn-soft" disabled={n >= 2} onClick={onMore}>
      <Lightbulb size={14} />
      {n === 0 ? "힌트 받기" : n === 1 ? "힌트 하나 더" : "힌트를 모두 봤어요"}
    </button>
  );
}

function ResultBanner({ result }: { result: QuizResult }) {
  return (
    <div className={`q-result ${result.correct ? "ok" : "no"}`}>
      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {result.correct ? <Check size={18} /> : <X size={18} />}
        {result.correct ? "정답입니다!" : "아쉬워요, 오답이에요"}
      </span>
      {result.tag && <span className={`chip ${tagChipClass(result.tag)}`}>{result.tag}</span>}
    </div>
  );
}

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, "");

/** 빈칸 grades the typed word; 대화형 compares the learner's explanation with key points, then lets them judge. */
function WrittenCard({ q, source, reviewOf, hints, showExplain, className, footer, top, onAnswered }: CardProps) {
  const { dispatch } = useStore();
  const [text, setText] = useState("");
  const [stage, setStage] = useState<"write" | "check" | "confidence" | "done">("write");
  const [hintN, setHintN] = useState(0);
  const [result, setResult] = useState<QuizResult | null>(null);
  const talk = q.type === "대화형";
  const typedRight = !talk && !!q.blank?.some((a) => norm(text).includes(norm(a)));
  const covered = talk ? (q.talk ?? []).map((p) => p.keywords.some((k) => norm(text).includes(norm(k)))) : [];

  const finish = (correct: boolean, confidence: Confidence) => {
    dispatch({ type: "attempt", attempt: { qid: q.id, correct, confidence, hints: hintN, source, reviewOf }, picked: -1 });
    const r: QuizResult = {
      qid: q.id,
      correct,
      confidence,
      tag: tagFor(correct, confidence, talk ? "개념 부족" : "암기 오류"),
      why: talk ? undefined : `입력한 답 · ${text.trim()}`,
    };
    setResult(r);
    setStage("done");
    onAnswered?.(r);
  };

  return (
    <div className={className}>
      {top}
      <CardHead q={q} />
      {talk ? (
        <textarea
          className="input q-write"
          rows={4}
          placeholder="핵심 개념을 넣어 내 말로 설명해 보세요"
          value={text}
          disabled={stage !== "write"}
          onChange={(e) => setText(e.target.value)}
        />
      ) : (
        <input
          className={`input q-fill ${stage === "done" ? (result?.correct ? "right" : "wrong") : ""}`}
          placeholder="빈칸에 들어갈 말"
          value={text}
          disabled={stage === "done"}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing && text.trim()) setStage("confidence");
          }}
        />
      )}

      {stage === "write" && <Hints q={q} n={hintN} />}

      {stage === "write" && (
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          {hints && <HintButton n={hintN} onMore={() => setHintN((n) => n + 1)} />}
          <button className="btn btn-sm btn-dark" style={{ marginLeft: "auto" }} disabled={!text.trim()} onClick={() => setStage(talk ? "check" : "confidence")}>
            {talk ? "설명 제출" : "답 제출"}
          </button>
        </div>
      )}

      {talk && stage !== "write" && (
        <div className="talk-check">
          <div className="talk-check-head">
            <b>핵심 {q.talk!.length}개 중 {covered.filter(Boolean).length}개를 짚었어요</b>
          </div>
          {q.talk!.map((p, i) => (
            <div key={p.label} className={`talk-point ${covered[i] ? "on" : ""}`}>
              {covered[i] ? <Check size={14} /> : <CircleDashed size={14} />}
              {p.label}
            </div>
          ))}
          <div className="talk-model"><b>모범 답안</b>{q.explanation}</div>
        </div>
      )}

      {talk && stage === "check" && (
        <>
          <div className="conf-q">모범 답안과 비교하면 어땠나요?</div>
          <div className="conf">
            <button className="btn btn-sm" style={{ justifyContent: "flex-start" }} onClick={() => finish(true, "sure")}>핵심을 다 설명했어요</button>
            <button className="btn btn-sm" style={{ justifyContent: "flex-start" }} onClick={() => finish(true, "unsure")}>일부만 설명했어요</button>
            <button className="btn btn-sm" style={{ justifyContent: "flex-start" }} onClick={() => finish(false, "sure")}>잘 설명하지 못했어요</button>
          </div>
        </>
      )}

      {!talk && stage === "confidence" && (
        <>
          <div className="conf-head">
            <div className="conf-q">이 답을 어떻게 떠올렸나요?</div>
            <button className="conf-back" onClick={() => finish(typedRight, "sure")}>이 질문은 건너뛸래요</button>
          </div>
          <div className="conf">
            {[
              { v: "sure" as Confidence, label: "확실히 알고 썼어요" },
              { v: "unsure" as Confidence, label: "헷갈렸지만 떠올렸어요" },
              { v: "guess" as Confidence, label: "잘 몰라서 추측했어요" },
            ].map((c) => (
              <button key={c.v} className="btn btn-sm" style={{ justifyContent: "flex-start" }} onClick={() => finish(typedRight, c.v)}>
                {c.label}
              </button>
            ))}
          </div>
        </>
      )}

      {stage === "done" && result && (
        <>
          <ResultBanner result={result} />
          {showExplain && !talk && (
            <div className="explain">
              <b>정답 · {q.blank![0]}</b>
              {q.explanation}
              {!result.correct && <div style={{ marginTop: 6, color: "var(--red)" }}>{result.why}</div>}
            </div>
          )}
          {footer?.(result)}
        </>
      )}
    </div>
  );
}

function ChoiceCard({ q, source, reviewOf, hints, showExplain, className, footer, top, onAnswered }: CardProps) {
  const qid = q.id;
  const { dispatch } = useStore();
  const [picked, setPicked] = useState<number | null>(null);
  const [stage, setStage] = useState<"pick" | "confidence" | "done">("pick");
  const [hintN, setHintN] = useState(0);
  const [result, setResult] = useState<QuizResult | null>(null);

  const submit = (confidence: Confidence) => {
    if (picked === null) return;
    const correct = picked === q.answer;
    dispatch({ type: "attempt", attempt: { qid, correct, confidence, hints: hintN, source, reviewOf }, picked });
    const r: QuizResult = { qid, correct, confidence, tag: tagFor(correct, confidence, q.options[picked].tag), why: q.options[picked].why };
    setResult(r);
    setStage("done");
    onAnswered?.(r);
  };

  const letters = q.type === "OX" ? ["O", "X"] : ["A", "B", "C", "D"];
  return (
    <div className={className}>
      {top}
      <CardHead q={q} />

      <div className="opts" role="radiogroup">
        {q.options.map((o, i) => {
          let cls = "opt";
          if (stage === "done") {
            if (i === q.answer) cls += " right";
            else if (i === picked) cls += " wrong";
            else cls += " dim";
          } else if (i === picked) cls += " sel";
          return (
            <button key={i} className={cls} role="radio" aria-checked={i === picked} disabled={stage === "done"} onClick={() => stage !== "done" && setPicked(i)}>
              <span className="k">{stage === "done" && i === q.answer ? <Check size={12} /> : stage === "done" && i === picked ? <X size={12} /> : letters[i]}</span>
              <span className={q.type === "객관식" && o.text.includes("SELECT") ? "mono" : ""} style={{ fontSize: o.text.includes("SELECT") ? 12.5 : undefined }}>
                {o.text}
              </span>
            </button>
          );
        })}
      </div>

      {stage !== "done" && <Hints q={q} n={hintN} />}

      {stage === "pick" && (
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          {hints && <HintButton n={hintN} onMore={() => setHintN((n) => n + 1)} />}
          <button className="btn btn-sm btn-dark" style={{ marginLeft: "auto" }} disabled={picked === null} onClick={() => setStage("confidence")}>
            답 제출
          </button>
        </div>
      )}

      {stage === "confidence" && (
        <>
          <div className="conf-head">
            <div className="conf-q">이 답을 어떻게 선택했나요?</div>
            <button className="conf-back" onClick={() => submit("sure")}>이 질문은 건너뛸래요</button>
          </div>
          <div className="conf">
            {CONF.map((c) => (
              <button key={c.v} className="btn btn-sm" style={{ justifyContent: "flex-start" }} onClick={() => submit(c.v)}>
                {c.label}
              </button>
            ))}
          </div>
          <div className="subtle" style={{ marginTop: 6 }}>다른 보기를 눌러도 답을 바꿀 수 있어요. 확신도는 진짜 이해했는지 판단하는 데 쓰여요.</div>
        </>
      )}

      {stage === "done" && result && (
        <>
          <ResultBanner result={result} />
          {showExplain && (
            <div className="explain">
              <b>해설</b>
              {q.explanation}
              {!result.correct && result.why && <div style={{ marginTop: 6, color: "var(--red)" }}>이번 실수 · {result.why}</div>}
              {result.correct && result.confidence !== "sure" && (
                <div style={{ marginTop: 6, color: "#b26a00" }}>맞혔지만 확신이 낮아서, 내일 비슷한 문제로 한 번 더 확인할게요.</div>
              )}
            </div>
          )}
          {footer?.(result)}
        </>
      )}
    </div>
  );
}
