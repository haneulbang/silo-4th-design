import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { tagChipClass } from "../components/QuizCard";
import { SideNav } from "../components/SideNav";
import { CONCEPTS, getMaterial } from "../data/materials";
import { getQuestion, type ErrorTag } from "../data/questions";
import { useMastery, useStore } from "../store";
import { barColor, timeAgo } from "./Dashboard";

const SOURCE = { diagnosis: "진단", check: "확인 문제", review: "복습" } as const;
const CONF = { sure: "확실", unsure: "고민", guess: "추측" } as const;

export function Records() {
  const { state, dispatch } = useStore();
  const [params] = useSearchParams();
  const [tab, setTab] = useState<"overview" | "log" | "notes">(params.get("tab") === "notes" ? "notes" : "overview");
  const mastery = useMastery();
  const A = state.attempts;

  // First try = the first attempt at each question; retry = any later attempt at a question missed before.
  const seen = new Set<string>();
  const missed = new Set<string>();
  let first = 0, firstOk = 0, retry = 0, retryOk = 0;
  for (const a of A) {
    if (!seen.has(a.qid)) {
      seen.add(a.qid);
      first++;
      if (a.correct) firstOk++;
      else missed.add(a.qid);
    } else if (missed.has(a.qid)) {
      retry++;
      if (a.correct) retryOk++;
    }
  }
  const tagCount = A.reduce<Record<string, number>>((acc, a) => (a.tag ? { ...acc, [a.tag]: (acc[a.tag] ?? 0) + 1 } : acc), {});
  const tags = Object.entries(tagCount).sort((a, b) => b[1] - a[1]) as [ErrorTag, number][];
  const maxTag = tags[0]?.[1] ?? 1;
  const repeated = Object.entries(A.filter((a) => !a.correct).reduce<Record<string, number>>((acc, a) => ({ ...acc, [a.concept]: (acc[a.concept] ?? 0) + 1 }), {})).filter(([, n]) => n >= 2);
  const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "–");

  return (
    <div className="my-wrap">
      <SideNav />
      <main>
        <div className="page-title"><h1>학습 기록</h1><span className="muted">AI와 나눈 대화가 아니라, 직접 확인한 증거만 쌓여요</span></div>
        <div className="tabs">
          <button className={tab === "overview" ? "on" : ""} onClick={() => setTab("overview")}>이해도 리포트</button>
          <button className={tab === "log" ? "on" : ""} onClick={() => setTab("log")}>확인 기록 {A.length}</button>
          <button className={tab === "notes" ? "on" : ""} onClick={() => setTab("notes")}>노트 {state.notes.length}</button>
        </div>

        {tab === "overview" && (
          <div className="grid g-12">
            <section className="card span-12" style={{ display: "flex", gap: 40, flexWrap: "wrap" }}>
              <div className="stat"><span className="l">푼 문제</span><span className="v">{A.length}</span></div>
              <div className="stat"><span className="l">최초 정답률</span><span className="v">{pct(firstOk, first)}</span></div>
              <div className="stat"><span className="l">재시도 후 정답률</span><span className="v green">{pct(retryOk, retry)}</span></div>
              <div className="stat"><span className="l">확신하고 맞힌 비율</span><span className="v">{pct(A.filter((a) => a.correct && a.confidence === "sure").length, A.length)}</span></div>
              <div className="stat"><span className="l">힌트 사용</span><span className="v">{A.reduce((t, a) => t + a.hints, 0)}회</span></div>
            </section>

            <section className="card span-7">
              <div className="card-head"><h3>개념별 이해도</h3><span className="subtle">최근 4회 · 확신도 반영</span></div>
              <table className="tbl">
                <thead><tr><th>개념</th><th>이해도</th><th>시도</th><th>최근 원인</th><th /></tr></thead>
                <tbody>
                  {mastery.map((m) => (
                    <tr key={m.concept}>
                      <td>{m.name}</td>
                      <td style={{ width: 160 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div className="bar" style={{ flex: 1 }}><i style={{ width: `${(m.score ?? 0) * 100}%`, background: barColor(m.score) }} /></div>
                          <span className="subtle" style={{ width: 34 }}>{m.score === null ? "–" : `${Math.round(m.score * 100)}%`}</span>
                        </div>
                      </td>
                      <td>{m.tries}</td>
                      <td>{m.lastTag ? <span className={`chip ${tagChipClass(m.lastTag)}`}>{m.lastTag}</span> : <span className="subtle">–</span>}</td>
                      <td>
                        <Link className="more" to={`/learn/${CONCEPTS[m.concept].material}?section=${getMaterial(CONCEPTS[m.concept].material)!.sections.find((s) => s.concept === m.concept)!.id}`}>
                          학습
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="card span-5">
              <div className="card-head"><h3>왜 틀렸을까 · 원인 분포</h3></div>
              {tags.length === 0 ? (
                <div className="empty"><strong>아직 분석할 오답이 없어요</strong></div>
              ) : (
                tags.map(([t, n]) => (
                  <div key={t} style={{ display: "grid", gridTemplateColumns: "96px 1fr 28px", alignItems: "center", gap: 10, padding: "7px 0" }}>
                    <span className={`chip ${tagChipClass(t)}`} style={{ justifySelf: "start" }}>{t}</span>
                    <div className="bar"><i style={{ width: `${(n / maxTag) * 100}%`, background: t === "찍어서 맞힘" || t === "낮은 확신" ? "var(--amber)" : "var(--red)" }} /></div>
                    <span className="subtle" style={{ textAlign: "right" }}>{n}</span>
                  </div>
                ))
              )}
              {repeated.length > 0 && (
                <div className="explain" style={{ marginTop: 14 }}>
                  <b>반복 오답</b>
                  {repeated.map(([c, n]) => `${CONCEPTS[c].name} ${n}회`).join(", ")} · 같은 개념을 두 번 이상 틀렸어요. 더 쉬운 단계 문제부터 다시 확인해요.
                </div>
              )}
            </section>
          </div>
        )}

        {tab === "log" && (
          <section className="card">
            {A.length === 0 ? (
              <div className="empty"><strong>확인 기록이 없어요</strong>학습 워크스페이스에서 확인 문제를 풀어보세요.</div>
            ) : (
              <table className="tbl">
                <thead><tr><th>시간</th><th>구분</th><th>개념</th><th>문제</th><th>결과</th><th>확신</th><th>힌트</th><th>원인</th></tr></thead>
                <tbody>
                  {[...A].reverse().map((a) => (
                    <tr key={a.id}>
                      <td className="subtle" style={{ whiteSpace: "nowrap" }}>{timeAgo(a.at)}</td>
                      <td><span className="chip">{SOURCE[a.source]}</span></td>
                      <td style={{ whiteSpace: "nowrap" }}>{CONCEPTS[a.concept].name}</td>
                      <td style={{ maxWidth: 280 }}><div className="ellipsis">{getQuestion(a.qid)!.stem}</div></td>
                      <td><span className={`chip ${a.correct ? "chip-green" : "chip-red"}`}>{a.correct ? "정답" : "오답"}</span></td>
                      <td>{CONF[a.confidence]}</td>
                      <td>{a.hints}</td>
                      <td>{a.tag ? <span className={`chip ${tagChipClass(a.tag)}`}>{a.tag}</span> : "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        {tab === "notes" && (
          <section className="card">
            {state.notes.length === 0 ? (
              <div className="empty"><strong>노트가 없어요</strong>자료에서 문장을 드래그한 뒤 '노트 저장'을 눌러보세요.</div>
            ) : (
              state.notes.map((n) => (
                <div className="list-row" key={n.id} style={{ alignItems: "flex-start" }}>
                  <div className="grow">
                    {n.quote && <div className="subtle" style={{ borderLeft: "2px solid var(--green)", paddingLeft: 8, marginBottom: 4 }}>{n.quote}</div>}
                    <div>{n.text}</div>
                    <Link className="subtle" to={`/learn/${n.materialId}?section=${n.sectionId}`}>{getMaterial(n.materialId)?.title} · {timeAgo(n.at)}</Link>
                  </div>
                  <button className="icon-btn" aria-label="삭제" onClick={() => dispatch({ type: "deleteNote", id: n.id })}><Trash2 size={14} /></button>
                </div>
              ))
            )}
          </section>
        )}
      </main>
    </div>
  );
}
