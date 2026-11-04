import { FileUp, Lock, MoreHorizontal, Search, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { SideNav } from "../components/SideNav";
import { useToast } from "../components/Toast";
import { MATERIALS } from "../data/materials";
import { useStore } from "../store";

const UPCOMING = [
  { title: "서브쿼리와 집합 연산자", chapter: "2장 6절" },
  { title: "윈도우 함수", chapter: "2장 8절" },
  { title: "데이터 모델링의 이해", chapter: "1장 1절" },
];

const THUMB: Record<string, { bg: string; snippet: string }> = {
  groupby: { bg: "#00a760", snippet: "GROUP BY DEPTNO HAVING SUM(SAL) > 9000" },
  join: { bg: "#1b1c1d", snippet: "DEPT D LEFT OUTER JOIN EMP E" },
};

export function Library() {
  const { state } = useStore();
  const toast = useToast();
  const [tab, setTab] = useState<"all" | "doing" | "done">("all");

  const items = MATERIALS.map((m) => {
    const read = (state.read[m.id] ?? []).length;
    return { m, read, pct: Math.round((read / m.sections.length) * 100) };
  }).filter((x) => (tab === "all" ? true : tab === "done" ? x.pct === 100 : x.pct < 100));

  return (
    <div className="my-wrap">
      <SideNav />
      <main>
        <div className="page-title"><h1>강의실</h1></div>
        <div className="banner">
          <Sparkles size={20} color="var(--green)" />
          <div style={{ flex: 1 }}>
            <div className="strong">교재·강의 노트를 올리면 AI가 시험 범위와 연결해요</div>
            <div className="subtle">PDF, 이미지 업로드 시 핵심 개념 지도와 중요도를 자동으로 만들어요.</div>
          </div>
          <button className="btn btn-sm" onClick={() => toast("파일 업로드는 다음 스프린트에 열려요")}>
            <FileUp size={14} />자료 올리기
          </button>
        </div>

        <div className="tabs">
          {(["all", "doing", "done"] as const).map((t) => (
            <button key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>
              {t === "all" ? "전체 자료" : t === "doing" ? "학습 중" : "완료"}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <div className="pills">
            <button className="pill on">SQLD</button>
            <button className="pill">2과목 · SQL 기본 및 활용</button>
            <button className="pill">1과목 · 데이터 모델링</button>
          </div>
          <button className="icon-btn" style={{ marginLeft: "auto" }} aria-label="검색"><Search size={16} /></button>
        </div>

        <div className="grid g-3" style={{ gap: 24 }}>
          {items.map(({ m, read, pct }) => (
            <Link key={m.id} to={`/learn/${m.id}`} className="course">
              <div className="thumb" style={{ background: THUMB[m.id].bg }}>
                <span className="tag chip" style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}>{m.chapter}</span>
                <div className="tt" style={{ fontSize: 22 }}>{m.title}</div>
                <code className="snippet ellipsis">{THUMB[m.id].snippet}</code>
              </div>
              <h4>{m.title}</h4>
              <div className="subtle" style={{ marginBottom: 8 }}>{m.subject} · 약 {m.minutes}분</div>
              <div className="progress"><i style={{ width: `${pct}%` }} /></div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                <span className="subtle">{read} / {m.sections.length}구간 ({pct}%)</span>
                <MoreHorizontal size={16} className="muted" />
              </div>
              <span className="btn btn-sm btn-block" style={{ marginTop: 10 }}>{pct === 0 ? "학습 시작" : pct === 100 ? "다시 보기" : "이어서 학습"}</span>
            </Link>
          ))}
          {tab === "all" &&
            UPCOMING.map((u) => (
              <div key={u.title} className="course soon">
                <div className="thumb soon">
                  <span className="tag chip">{u.chapter}</span>
                  <div className="tt">{u.title}</div>
                </div>
                <h4>{u.title}</h4>
                <div className="subtle" style={{ display: "flex", alignItems: "center", gap: 4 }}><Lock size={12} />자료 분석 준비 중</div>
              </div>
            ))}
        </div>
        {items.length === 0 && <div className="empty"><strong>해당하는 자료가 없어요</strong></div>}
      </main>
    </div>
  );
}
