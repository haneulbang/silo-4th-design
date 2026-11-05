import { BookOpen, ChevronRight, Clock, NotebookPen, Play, RotateCcw, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { Mascot } from "../components/Brand";
import { tagChipClass } from "../components/QuizCard";
import { SideNav } from "../components/SideNav";
import { CONCEPTS, EXAM, MATERIALS, getMaterial } from "../data/materials";
import { getQuestion } from "../data/questions";
import { joinWa } from "../lib/josa";
import { daysUntil, todayKey, useDueReviews, useMastery, useStore, useWeakConcepts } from "../store";

export function barColor(score: number | null) {
  if (score === null) return "var(--line)";
  if (score >= 0.8) return "var(--green)";
  if (score >= 0.5) return "var(--amber)";
  return "var(--red)";
}

export function useExpectedScore() {
  const mastery = useMastery();
  const known = mastery.filter((m) => m.score !== null);
  if (!known.length) return null;
  return Math.round((known.reduce((t, m) => t + (m.score ?? 0), 0) / known.length) * 100);
}

export function Dashboard() {
  const { state } = useStore();
  const due = useDueReviews();
  const weak = useWeakConcepts();
  const mastery = useMastery();
  const expected = useExpectedScore();
  const dday = daysUntil(EXAM.date);
  const minutes = state.setup?.dailyMinutes ?? 30;

  const today = todayKey();
  const todays = state.attempts.filter((a) => todayKey(new Date(a.at)) === today);
  const focus = getMaterial(weak[0] ? CONCEPTS[weak[0].concept].material : state.lastMaterial?.id ?? "groupby")!;
  const unread = focus.sections.find((s) => s.concept && !(state.read[focus.id] ?? []).includes(s.id));
  const weakSection = weak[0] ? focus.sections.find((s) => s.concept === weak[0].concept) : undefined;
  const studySection = weakSection ?? unread ?? focus.sections[1];
  const checks = todays.filter((a) => a.source === "check").length;
  const reviewsToday = todays.filter((a) => a.source === "review").length;

  // Mirrors the desk-research plan shape (concept → weak problems → past mistakes → wrap-up), scaled to the daily time.
  const short = minutes <= 10;
  const plan = [
    !short && {
      t: `핵심 개념 · ${studySection.title.replace(/^\d+\.\s*/, "")}`,
      m: Math.round(minutes * 0.27),
      done: (state.read[focus.id] ?? []).includes(studySection.id) && todays.length > 0,
      to: `/learn/${focus.id}?section=${studySection.id}`,
    },
    !short && { t: `확인 문제 ${minutes >= 30 ? 5 : 3}개`, m: Math.round(minutes * 0.4), done: checks >= (minutes >= 30 ? 5 : 3), to: `/learn/${focus.id}?section=${studySection.id}&ask=check` },
    { t: due.length ? `이전 오답 복습 ${due.length}개` : "이전 오답 복습", m: short ? 8 : Math.round(minutes * 0.23), done: due.length === 0 && (reviewsToday > 0 || state.reviews.length === 0), to: `/learn/${focus.id}?tab=review` },
    { t: "마무리 확인 · 오늘 배운 것 한 줄 정리", m: short ? 2 : Math.round(minutes * 0.1), done: state.notes.some((n) => todayKey(new Date(n.at)) === today), to: `/learn/${focus.id}` },
  ].filter(Boolean) as { t: string; m: number; done: boolean; to: string }[];
  const doneCount = plan.filter((p) => p.done).length;

  const week = weekDays();
  const last = state.lastMaterial ? getMaterial(state.lastMaterial.id) : MATERIALS[0];
  const lastRead = (state.read[last!.id] ?? []).length;
  const wrongs = [...state.attempts].reverse().filter((a) => a.tag).slice(0, 5);

  return (
    <div className="my-wrap">
      <SideNav />
      <main>
        <div className="page-title">
          <h1>내 학습</h1>
          <span className="muted">
            {state.user?.name}님, 오늘도 <span className="green strong">{todays.length}</span>문제 확인했어요
          </span>
        </div>

        <section className="hero" style={{ marginBottom: 16 }}>
          <div className="when">
            <div className="meta">{EXAM.name} {EXAM.round} · 11월 14일</div>
            <div className="dday">{dday > 0 ? `D-${dday}` : "D-DAY"}</div>
          </div>
          <div style={{ borderLeft: "1px solid #34373a", paddingLeft: 24 }}>
            <div className="meta">AI 한 줄 진단</div>
            <div style={{ fontSize: 15, fontWeight: 600, maxWidth: 440, marginTop: 4 }}>
              {weak.length
                ? `${joinWa(weak.slice(0, 2).map((w) => w.name))}에서 점수를 잃고 있어요. 오늘은 여기부터 볼게요.`
                : expected === null
                  ? "진단 기록이 아직 없어요. 자료를 읽고 확인 문제를 풀면 진단이 쌓여요."
                  : "취약 개념 없이 안정적이에요. 복습 간격을 넓혀가며 유지해요."}
            </div>
          </div>
          <div className="score">
            <div className="meta">합격 예상 점수</div>
            <b>{expected ?? "–"}</b>
            <span className="meta"> / 합격선 {EXAM.passLine}</span>
            <div className="hero-bar">
              <i style={{ width: `${expected ?? 0}%` }} />
              <span className="pass" style={{ left: `${EXAM.passLine}%` }} />
            </div>
          </div>
        </section>

        <div className="grid g-12">
          <section className="card span-7">
            <div className="card-head">
              <h3><Target size={16} />오늘의 학습 · {minutes}분</h3>
              <span className="subtle">{doneCount}/{plan.length} 완료</span>
            </div>
            <div className="plan-list">
              {plan.map((p, i) => (
                <Link key={p.t} to={p.to} className={`plan-item ${p.done ? "done" : ""}`}>
                  <span className="num">{i + 1}</span>
                  <span>
                    <span className="t">{p.t}</span>
                    <span className="subtle" style={{ display: "block" }}>{p.m}분</span>
                  </span>
                  <ChevronRight size={16} className="muted" />
                </Link>
              ))}
            </div>
            {short && <p className="subtle" style={{ margin: "10px 0 0" }}>오늘은 시간이 짧아서 새 단원 대신 지난 오답 복습만 담았어요.</p>}
          </section>

          <div className="span-5 grid" style={{ alignContent: "start" }}>
            <section className="card">
              <div className="card-head">
                <h3>최근 학습 자료</h3>
                <Link className="more" to="/my/library">학습 목록<ChevronRight size={14} /></Link>
              </div>
              <Link to={`/learn/${last!.id}${state.lastMaterial ? `?section=${state.lastMaterial.section}` : ""}`} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ width: 40, height: 40, borderRadius: 8, background: "var(--green)", display: "grid", placeItems: "center", flex: "none" }}>
                  <Play size={18} color="#fff" fill="#fff" />
                </span>
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span className="strong ellipsis" style={{ display: "block" }}>{last!.title}</span>
                  <span className="subtle">{lastRead}구간 / {last!.sections.length}구간 ({Math.round((lastRead / last!.sections.length) * 100)}%)</span>
                  <div className="progress" style={{ marginTop: 6 }}><i style={{ width: `${(lastRead / last!.sections.length) * 100}%` }} /></div>
                </span>
              </Link>
            </section>
            <section className="card">
              <div className="card-head">
                <h3>주간 학습</h3>
                <span className="subtle">{week[0].label} 주</span>
              </div>
              <div className="week">
                {week.map((d) => {
                  const n = state.attempts.filter((a) => todayKey(new Date(a.at)) === d.key).length;
                  const lv = n === 0 ? "" : n < 4 ? "l1" : n < 8 ? "l2" : "l3";
                  return (
                    <div key={d.key}>
                      <div className="d">{d.day}</div>
                      <div className={`c ${lv} ${d.key === today ? "today" : ""}`}>{n || ""}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 20, marginTop: 14 }}>
                <div className="stat"><span className="l"><BookOpen size={12} />확인 문제</span><span className="v" style={{ fontSize: 16 }}>{state.attempts.length}</span></div>
                <div className="stat"><span className="l"><Clock size={12} />오늘 학습</span><span className="v" style={{ fontSize: 16 }}>{state.minutes[today] ?? 0}분</span></div>
                <div className="stat"><span className="l"><NotebookPen size={12} />노트</span><span className="v" style={{ fontSize: 16 }}>{state.notes.length}</span></div>
              </div>
            </section>
          </div>

          <section className="card span-6">
            <div className="card-head">
              <h3>개념별 이해도</h3>
              <Link className="more" to="/my/records">전체 보기<ChevronRight size={14} /></Link>
            </div>
            {mastery.map((m) => (
              <div className="mastery-row" key={m.concept}>
                <span className="ellipsis">
                  {m.name}
                  {m.lastTag && m.score !== null && m.score < 0.7 && <span className={`chip ${tagChipClass(m.lastTag)}`} style={{ marginLeft: 6 }}>{m.lastTag}</span>}
                </span>
                <div className="bar"><i style={{ width: `${(m.score ?? 0) * 100}%`, background: barColor(m.score) }} /></div>
                <span className="subtle" style={{ textAlign: "right" }}>{m.score === null ? "미확인" : `${Math.round(m.score * 100)}%`}</span>
              </div>
            ))}
          </section>

          <section className="card span-6">
            <div className="card-head">
              <h3><RotateCcw size={16} />복습 예정</h3>
              <span className="subtle">간격 반복 1 · 3 · 7 · 14일</span>
            </div>
            {state.reviews.length === 0 ? (
              <div className="empty">
                <Mascot size={44} />
                <strong>복습할 문제가 없어요</strong>
                틀리거나 확신이 낮았던 문제가 여기에 쌓여요.
              </div>
            ) : (
              <>
                {[...state.reviews].sort((a, b) => a.due - b.due).slice(0, 5).map((r) => {
                  const q = getQuestion(r.qid)!;
                  const d = Math.ceil((r.due - Date.now()) / 86_400_000);
                  return (
                    <div className="list-row" key={r.qid}>
                      <span className={`chip ${d <= 0 ? "chip-red" : "chip-blue"}`}>{d <= 0 ? "오늘" : `${d}일 뒤`}</span>
                      <span className="grow ellipsis">{q.stem}</span>
                      <span className="subtle">{CONCEPTS[q.concept].name}</span>
                    </div>
                  );
                })}
                {due.length ? (
                  <Link to={`/learn/${focus.id}?tab=review`} className="btn btn-primary btn-sm btn-block" style={{ marginTop: 10 }}>
                    오늘 복습 {due.length}개 시작하기
                  </Link>
                ) : (
                  <div className="subtle" style={{ marginTop: 10, textAlign: "center" }}>오늘 복습할 문제는 없어요. 다음 복습은 예정일에 알려드릴게요.</div>
                )}
              </>
            )}
          </section>

          <section className="card span-6">
            <div className="card-head">
              <h3>최근 오답 · 확신 낮은 문제</h3>
              <Link className="more" to="/my/records">오답노트<ChevronRight size={14} /></Link>
            </div>
            {wrongs.length === 0 ? (
              <div className="empty"><strong>아직 기록이 없어요</strong>확인 문제를 풀면 틀린 이유가 자동으로 분류돼요.</div>
            ) : (
              wrongs.map((a) => (
                <div className="list-row" key={a.id}>
                  <span className={`chip ${tagChipClass(a.tag)}`}>{a.tag}</span>
                  <span className="grow ellipsis">{getQuestion(a.qid)!.stem}</span>
                </div>
              ))
            )}
          </section>

          <section className="card span-6">
            <div className="card-head">
              <h3>최근 내 노트</h3>
              <Link className="more" to="/my/records?tab=notes">전체 보기<ChevronRight size={14} /></Link>
            </div>
            {state.notes.length === 0 ? (
              <div className="empty"><strong>노트가 없어요</strong>학습 중 중요한 문장을 드래그해서 저장해 보세요.</div>
            ) : (
              state.notes.slice(0, 4).map((n) => (
                <Link className="list-row" key={n.id} to={`/learn/${n.materialId}?section=${n.sectionId}`}>
                  <span className="grow">
                    <span className="ellipsis" style={{ display: "block" }}>{n.text}</span>
                    <span className="subtle">{getMaterial(n.materialId)?.title} · {timeAgo(n.at)}</span>
                  </span>
                </Link>
              ))
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function weekDays() {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  return ["월", "화", "수", "목", "금", "토", "일"].map((day, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { day, key: todayKey(d), label: `${d.getMonth() + 1}월 ${Math.ceil(d.getDate() / 7)}주차` };
  });
}

export function timeAgo(t: number) {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return "방금 전";
  if (m < 60) return `${m}분 전`;
  if (m < 1440) return `${Math.round(m / 60)}시간 전`;
  return `${Math.round(m / 1440)}일 전`;
}
