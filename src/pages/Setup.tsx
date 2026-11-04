import { ArrowRight, CalendarDays, Clock, FileText } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mascot } from "../components/Brand";
import { QuizCard, type QuizResult } from "../components/QuizCard";
import { CONCEPTS, EXAM } from "../data/materials";
import { DIAGNOSIS_SET, getQuestion } from "../data/questions";
import { joinWa } from "../lib/josa";
import { daysUntil, useStore } from "../store";

const TIMES = [10, 20, 30, 60];

export function Setup() {
  const { state, dispatch } = useStore();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [minutes, setMinutes] = useState(30);
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [answered, setAnswered] = useState(false);
  const dday = daysUntil(EXAM.date);

  const finish = (diagnosed: boolean) => {
    dispatch({ type: "setup", dailyMinutes: minutes, diagnosed });
    nav("/my");
  };

  return (
    <main className="setup">
      <div className="steps" aria-hidden>
        {[0, 1, 2, 3].map((i) => <i key={i} className={i <= step ? "on" : ""} />)}
      </div>

      {step === 0 && (
        <>
          <span className="subtle">1 / 4 · 시험과 목표</span>
          <h1>{state.user?.name}님, 어떤 시험을 준비하나요?</h1>
          <p className="muted">시험일과 출제 범위는 공식 안내를 기준으로 정리했어요. AI가 임의로 정하지 않아요.</p>
          <div className="card" style={{ borderColor: "var(--green)", background: "var(--green-25)", marginTop: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span className="strong" style={{ fontSize: 18 }}>{EXAM.name} {EXAM.round}</span>
              <span className="chip chip-green">D-{dday}</span>
            </div>
            <div className="grid g-2" style={{ gap: 10 }}>
              <div className="list-row" style={{ padding: 0 }}><CalendarDays size={16} className="muted" />시험일 2026. 11. 14 (토)</div>
              <div className="list-row" style={{ padding: 0, borderTop: 0 }}><Clock size={16} className="muted" />90분 · 50문항</div>
            </div>
            <table className="tbl" style={{ marginTop: 14, background: "#fff", borderRadius: 8 }}>
              <thead><tr><th>과목</th><th>문항</th><th>배점</th></tr></thead>
              <tbody>
                {EXAM.subjects.map((s) => (
                  <tr key={s.name}><td>{s.name}</td><td>{s.questions}</td><td>{s.weight}점</td></tr>
                ))}
              </tbody>
            </table>
            <div className="subtle" style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 4 }}>
              <FileText size={12} />합격 기준 총점 {EXAM.passLine}점 이상, 과목별 {EXAM.cutLine}% 미만 과락 · 출처: 한국데이터산업진흥원 시험 안내
            </div>
          </div>
          <button className="choice" style={{ marginTop: 10 }} disabled>
            <span className="muted">다른 시험 · 시험 안내나 교재 목차를 올리면 AI가 범위를 구조화해요 (준비 중)</span>
          </button>
          <button className="btn btn-primary btn-lg btn-block" style={{ marginTop: 28 }} onClick={() => setStep(1)}>
            이 시험으로 시작하기
          </button>
        </>
      )}

      {step === 1 && (
        <>
          <span className="subtle">2 / 4 · 공부 시간</span>
          <h1>하루에 얼마나 공부할 수 있나요?</h1>
          <p className="muted">남은 {dday}일 동안 매일 이 시간에 맞춰 오늘의 학습을 구성해요. 언제든 바꿀 수 있어요.</p>
          <div className="grid g-2" style={{ marginTop: 20 }}>
            {TIMES.map((t) => (
              <button key={t} className={`choice ${minutes === t ? "on" : ""}`} onClick={() => setMinutes(t)}>
                <Clock size={18} color={minutes === t ? "var(--green)" : "var(--gray-3)"} />
                <span>
                  <span className="strong">{t}분</span>
                  <span className="subtle" style={{ display: "block" }}>
                    {t === 10 ? "오답 복습 위주" : t === 20 ? "취약 개념 + 복습" : t === 30 ? "개념 + 확인 문제 + 복습" : "새 단원 + 모의 문제"}
                  </span>
                </span>
              </button>
            ))}
          </div>
          <button className="btn btn-primary btn-lg btn-block" style={{ marginTop: 28 }} onClick={() => setStep(2)}>다음</button>
        </>
      )}

      {step === 2 && (
        <>
          <span className="subtle">3 / 4 · 현재 위치 진단 · {idx + 1} / {DIAGNOSIS_SET.length}</span>
          <h1>짧게 실력을 확인해볼게요</h1>
          <p className="muted">단원별 대표 문제 {DIAGNOSIS_SET.length}개예요. 힌트 없이 풀고, 얼마나 확신했는지도 알려주세요.</p>
          <div className="card" style={{ marginTop: 20 }}>
            <QuizCard
              key={DIAGNOSIS_SET[idx]}
              qid={DIAGNOSIS_SET[idx]}
              source="diagnosis"
              hints={false}
              showExplain={false}
              onAnswered={(r) => {
                setResults((rs) => [...rs, r]);
                setAnswered(true);
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button className="btn btn-ghost" onClick={() => finish(false)}>진단 건너뛰기</button>
            <button
              className="btn btn-primary"
              style={{ marginLeft: "auto" }}
              disabled={!answered}
              onClick={() => {
                setAnswered(false);
                if (idx + 1 < DIAGNOSIS_SET.length) setIdx(idx + 1);
                else setStep(3);
              }}
            >
              {idx + 1 < DIAGNOSIS_SET.length ? "다음 문제" : "결과 보기"}
              <ArrowRight size={16} />
            </button>
          </div>
        </>
      )}

      {step === 3 && <DiagnosisResult results={results} minutes={minutes} onStart={() => finish(true)} />}
    </main>
  );
}

function DiagnosisResult({ results, minutes, onStart }: { results: QuizResult[]; minutes: number; onStart: () => void }) {
  const correct = results.filter((r) => r.correct).length;
  const solid = results.filter((r) => r.correct && r.confidence === "sure").length;
  const shaky = correct - solid;
  // Shaky correct answers count for half: they are not yet reliable points.
  const expected = Math.round(((solid + shaky * 0.5) / results.length) * 100);
  const weak = results.filter((r) => !r.correct || r.confidence !== "sure").map((r) => CONCEPTS[getQuestion(r.qid)!.concept].name);
  const pass = expected >= EXAM.passLine;

  return (
    <>
      <span className="subtle">4 / 4 · 진단 결과</span>
      <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "8px 0 20px" }}>
        <Mascot size={64} mood={pass ? "smile" : "think"} />
        <h1 style={{ margin: 0 }}>합격 예상 점수는 {expected}점이에요</h1>
      </div>
      <div className="card" style={{ background: "var(--bg)", border: 0 }}>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7 }}>
          {results.length}문제 중 <b>{correct}문제</b>를 맞혔고, 그중 <b>{shaky}문제</b>는 확신이 낮았어요.{" "}
          {weak.length === 0
            ? "모든 영역을 안정적으로 이해하고 있어요. 기출 위주로 실전 감각을 올려볼게요."
            : `개념 전체가 부족한 건 아니에요. ${joinWa([...new Set(weak)].slice(0, 2))}에서 점수를 잃고 있어요.`}
        </p>
      </div>
      <div className="card" style={{ marginTop: 12 }}>
        <div className="card-head"><h3>진단 상세</h3><span className="subtle">확신도 포함</span></div>
        {results.map((r) => {
          const q = getQuestion(r.qid)!;
          return (
            <div className="list-row" key={r.qid}>
              <span className={`chip ${r.correct ? "chip-green" : "chip-red"}`}>{r.correct ? "정답" : "오답"}</span>
              <span className="grow">{CONCEPTS[q.concept].name}</span>
              {r.tag && <span className={`chip ${r.tag === "찍어서 맞힘" || r.tag === "낮은 확신" ? "chip-amber" : "chip-red"}`}>{r.tag}</span>}
            </div>
          );
        })}
      </div>
      <div className="card" style={{ marginTop: 12 }}>
        <div className="card-head"><h3>내일까지 이렇게 해봐요 · 하루 {minutes}분</h3></div>
        <p className="muted" style={{ margin: 0 }}>
          약한 개념이 있는 <b style={{ color: "var(--ink)" }}>GROUP BY와 HAVING</b> 자료부터 읽고, 구간마다 확인 문제를 풀어요. 틀리거나 확신이 낮았던 문제는 내일 복습 목록에 자동으로 들어가요.
        </p>
      </div>
      <button className="btn btn-primary btn-lg btn-block" style={{ marginTop: 24 }} onClick={onStart}>내 학습으로 가기</button>
    </>
  );
}
