import { AlertTriangle, BookMarked, ChevronRight, Lightbulb, RotateCcw, Target, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Mascot } from "../components/Brand";
import { QuizCard, type QuizResult } from "../components/QuizCard";
import { useToast } from "../components/Toast";
import { CONCEPTS, type Material, type Section } from "../data/materials";
import { getQuestion, variantOf } from "../data/questions";
import { summaryOf } from "../lib/agent";
import { useDueReviews, useStore, type Review } from "../store";
import { timeAgo } from "../lib/time";

export function SummaryTab({ material, onJump }: { material: Material; onJump: (sectionId: string) => void }) {
  const items = summaryOf(material);
  return (
    <div className="panel-body">
      <div className="sum-block" style={{ background: "var(--bg)" }}>
        <div className="subtle">요약만 보면 예외와 조건을 놓치기 쉬워요. 항목을 누르면 원문 구간으로 이동해요.</div>
      </div>
      <div className="sum-block">
        <h4><BookMarked size={14} />핵심 개념</h4>
        {items.map((it) => (
          <button key={it.section.id} className="sum-item" style={{ textAlign: "left", display: "block" }} onClick={() => onJump(it.section.id)}>
            <b>{it.concept} <ChevronRight size={12} style={{ verticalAlign: -1 }} /></b>
            <span className="muted">{it.easy.replace(/\*\*/g, "")}</span>
          </button>
        ))}
      </div>
      <div className="sum-block">
        <h4><Target size={14} />시험 포인트 · 반드시 암기</h4>
        {items.map((it) => (
          <div key={it.section.id} className="sum-item">· {it.point}</div>
        ))}
        <div className="sum-item">· 처리 순서 FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY</div>
      </div>
      <div className="sum-block">
        <h4><AlertTriangle size={14} />자주 혼동되는 내용</h4>
        <div className="pills">
          {items.map((it) => <span key={it.section.id} className="chip chip-amber">{it.confuse}</span>)}
        </div>
      </div>
    </div>
  );
}

type Item = { review: Review; qid: string };

export function ReviewTab({ preset }: { preset?: string }) {
  const { state } = useStore();
  const due = useDueReviews();
  // A due review is asked as a variant on the same principle when one exists, so the learner can't just recall the answer.
  const build = (list: Review[]): Item[] =>
    list.map((r) => {
      const q = getQuestion(r.qid)!;
      const v = r.step === 0 ? undefined : variantOf(q);
      return { review: r, qid: v?.id ?? r.qid };
    });
  const [session, setSession] = useState<Item[] | null>(() => {
    if (!preset) return null;
    const list = state.reviews.filter((r) => r.concept === preset);
    return list.length ? build(list) : null;
  });
  const [i, setI] = useState(0);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [answered, setAnswered] = useState(false);
  const upcoming = useMemo(() => [...state.reviews].sort((a, b) => a.due - b.due), [state.reviews]);

  const start = (list: Review[]) => {
    setSession(build(list));
    setI(0);
    setResults([]);
    setAnswered(false);
  };

  if (session && i < session.length) {
    const item = session[i];
    return (
      <div className="panel-body" style={{ padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <span className="strong">복습</span>
          <span className="chip chip-green">{Math.round((i / session.length) * 100)}% 진행 중</span>
          <span className="subtle" style={{ marginLeft: "auto" }}>{i + 1} / {session.length}</span>
        </div>
        <div className="progress" style={{ marginBottom: 18 }}><i style={{ width: `${(i / session.length) * 100}%` }} /></div>
        {item.qid !== item.review.qid && <div className="subtle" style={{ marginBottom: 8 }}>지난번 문제와 같은 원리를 쓰는 새 문제예요.</div>}
        <QuizCard
          key={`${item.qid}-${i}`}
          qid={item.qid}
          source="review"
          reviewOf={item.review.qid}
          onAnswered={(r) => {
            setResults((rs) => [...rs, r]);
            setAnswered(true);
          }}
        />
        {answered && (
          <button className="btn btn-primary btn-block" style={{ marginTop: 12 }} onClick={() => { setAnswered(false); setI(i + 1); }}>
            {i + 1 < session.length ? "다음" : "결과 보기"}
          </button>
        )}
      </div>
    );
  }

  if (session) {
    const ok = results.filter((r) => r.correct).length;
    const wrong = session.filter((_, k) => !results[k]?.correct).map((s) => state.reviews.find((r) => r.qid === s.review.qid)).filter(Boolean) as Review[];
    return (
      <div className="panel-body" style={{ padding: 28, textAlign: "center" }}>
        <Mascot size={80} mood={ok === results.length ? "wow" : "smile"} />
        <h3 style={{ margin: "14px 0 18px", fontSize: 18 }}>복습 {session.length}문제를 모두 풀었어요!</h3>
        <div style={{ background: "var(--bg)", borderRadius: 8, padding: 16, margin: "0 auto 18px", maxWidth: 220 }}>
          <div className="subtle">복습 점수</div>
          <div><b style={{ fontSize: 26 }}>{ok}</b> <span className="muted">/{session.length}</span></div>
        </div>
        <p className="muted" style={{ fontSize: 13 }}>맞힌 문제는 복습 간격이 늘어나고, 틀린 문제는 내일 다시 나와요.</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          {wrong.length > 0 && <button className="btn" onClick={() => start(wrong)}><RotateCcw size={14} />오답 풀기</button>}
          <button className="btn btn-primary" onClick={() => setSession(null)}>복습 목록</button>
        </div>
      </div>
    );
  }

  return (
    <div className="panel-body" style={{ padding: 20 }}>
      <div className="card" style={{ background: "var(--green-25)", borderColor: "var(--green-50)" }}>
        <div className="strong" style={{ fontSize: 15 }}>오늘 복습할 문제 {due.length}개</div>
        <div className="subtle" style={{ margin: "4px 0 12px" }}>틀렸거나 확신이 낮았던 문제를 1 · 3 · 7 · 14일 간격으로 다시 확인해요.</div>
        <button className="btn btn-primary btn-block" disabled={!due.length} onClick={() => start(due)}>
          {due.length ? "복습 시작" : "오늘 복습 완료"}
        </button>
        {!due.length && upcoming.length > 0 && (
          <button className="btn btn-ghost btn-block btn-sm" style={{ marginTop: 6 }} onClick={() => start(upcoming)}>예정된 문제 미리 풀기</button>
        )}
      </div>
      <h4 style={{ margin: "20px 0 8px", fontSize: 13, color: "var(--gray)" }}>복습 일정</h4>
      {upcoming.length === 0 && <div className="empty">아직 복습할 문제가 없어요.<br />확인 문제를 풀면 자동으로 쌓여요.</div>}
      {upcoming.map((r) => {
        const d = Math.ceil((r.due - Date.now()) / 86_400_000);
        return (
          <div className="list-row" key={r.qid}>
            <span className={`chip ${d <= 0 ? "chip-red" : "chip-blue"}`}>{d <= 0 ? "오늘" : `${d}일 뒤`}</span>
            <span className="grow">
              <span className="ellipsis" style={{ display: "block", fontSize: 13 }}>{getQuestion(r.qid)!.stem}</span>
              <span className="subtle">{CONCEPTS[r.concept].name} · {r.step + 1}회차</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function NoteTab({ material, section }: { material: Material; section?: Section }) {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const [text, setText] = useState("");
  const notes = state.notes.filter((n) => n.materialId === material.id);
  const save = () => {
    if (!text.trim()) return;
    dispatch({ type: "note", note: { materialId: material.id, sectionId: section?.id ?? "intro", text: text.trim() } });
    setText("");
    toast("노트를 저장했어요");
  };
  return (
    <div className="panel-body" style={{ padding: 20 }}>
      <div className="explain" style={{ marginTop: 0, display: "flex", gap: 8 }}>
        <Lightbulb size={16} style={{ flex: "none" }} />
        <span>AI 설명을 읽고 끝내지 말고, <b style={{ display: "inline" }}>내 말로 한 줄 정리</b>해 보세요. 직접 써보면 이해한 것과 아닌 것이 드러나요.</span>
      </div>
      <div className="field" style={{ marginTop: 14 }}>
        <label>{section?.title ?? material.title}</label>
        <textarea className="input" style={{ height: 96, padding: 12, resize: "none" }} placeholder="예) HAVING은 묶은 뒤 거르는 것, 집계 조건은 무조건 HAVING" value={text} onChange={(e) => setText(e.target.value)} />
      </div>
      <button className="btn btn-dark btn-block" disabled={!text.trim()} onClick={save}>저장</button>
      <h4 style={{ margin: "20px 0 8px", fontSize: 13, color: "var(--gray)" }}>이 자료의 노트 {notes.length}</h4>
      {notes.map((n) => (
        <div className="list-row" key={n.id} style={{ alignItems: "flex-start" }}>
          <div className="grow">
            {n.quote && <div className="subtle" style={{ borderLeft: "2px solid var(--green)", paddingLeft: 8, marginBottom: 4 }}>{n.quote}</div>}
            <div style={{ fontSize: 13.5 }}>{n.text}</div>
            <div className="subtle">{material.sections.find((s) => s.id === n.sectionId)?.title} · {timeAgo(n.at)}</div>
          </div>
          <button className="icon-btn" style={{ width: 28, height: 28 }} aria-label="삭제" onClick={() => dispatch({ type: "deleteNote", id: n.id })}><Trash2 size={12} /></button>
        </div>
      ))}
    </div>
  );
}
