import { Check, Lightbulb, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { CONCEPTS } from "../data/materials";
import { getQuestion, type ErrorTag } from "../data/questions";
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
  onAnswered,
}: {
  qid: string;
  source: Source;
  reviewOf?: string;
  hints?: boolean;
  showExplain?: boolean;
  className?: string;
  footer?: (r: QuizResult) => ReactNode;
  onAnswered?: (r: QuizResult) => void;
}) {
  const q = getQuestion(qid)!;
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
      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        <span className="chip">{CONCEPTS[q.concept].name}</span>
        <span className="chip chip-blue">{q.type}</span>
        <span className="chip" aria-label={`난이도 ${q.level} / 3`}>
          난이도
          <span className="level" aria-hidden>{[1, 2, 3].map((l) => <i key={l} className={l <= q.level ? "on" : ""} />)}</span>
        </span>
      </div>
      <p className="q-stem">{q.stem}</p>
      {q.code && <pre className="q-code mono">{q.code}</pre>}

      <div className="opts" role="radiogroup">
        {q.options.map((o, i) => {
          let cls = "opt";
          if (stage === "done") {
            if (i === q.answer) cls += " right";
            else if (i === picked) cls += " wrong";
            else cls += " dim";
          } else if (i === picked) cls += " sel";
          return (
            <button key={i} className={cls} role="radio" aria-checked={i === picked} disabled={stage === "done"} onClick={() => stage === "pick" && setPicked(i)}>
              <span className="k">{stage === "done" && i === q.answer ? <Check size={12} /> : stage === "done" && i === picked ? <X size={12} /> : letters[i]}</span>
              <span className={q.type === "객관식" && o.text.includes("SELECT") ? "mono" : ""} style={{ fontSize: o.text.includes("SELECT") ? 12.5 : undefined }}>
                {o.text}
              </span>
            </button>
          );
        })}
      </div>

      {stage !== "done" &&
        hintN > 0 &&
        q.hints.slice(0, hintN).map((h, i) => (
          <div className="hint" key={i}>
            <Lightbulb size={15} style={{ flex: "none", marginTop: 1 }} />
            <span><b>힌트 {i + 1}</b> · {h}</span>
          </div>
        ))}

      {stage === "pick" && (
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          {hints && (
            <button className="btn btn-sm btn-soft" disabled={hintN >= 2} onClick={() => setHintN((n) => n + 1)}>
              <Lightbulb size={14} />
              {hintN === 0 ? "힌트 받기" : hintN === 1 ? "힌트 하나 더" : "힌트를 모두 봤어요"}
            </button>
          )}
          <button className="btn btn-sm btn-dark" style={{ marginLeft: "auto" }} disabled={picked === null} onClick={() => setStage("confidence")}>
            답 제출
          </button>
        </div>
      )}

      {stage === "confidence" && (
        <>
          <div className="conf-q">이 답을 어떻게 선택했나요?</div>
          <div className="conf">
            {CONF.map((c) => (
              <button key={c.v} className="btn btn-sm" style={{ justifyContent: "flex-start" }} onClick={() => submit(c.v)}>
                {c.label}
              </button>
            ))}
          </div>
          <div className="subtle" style={{ marginTop: 6 }}>확신도는 진짜 이해했는지 판단하는 데 쓰여요.</div>
        </>
      )}

      {stage === "done" && result && (
        <>
          <div className={`q-result ${result.correct ? "ok" : "no"}`}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {result.correct ? <Check size={18} /> : <X size={18} />}
              {result.correct ? "정답입니다!" : "아쉬워요, 오답이에요"}
            </span>
            {result.tag && <span className={`chip ${tagChipClass(result.tag)}`}>{result.tag}</span>}
          </div>
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
