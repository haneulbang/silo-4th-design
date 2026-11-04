import { ArrowLeft, BookMarked, MessageCircle, NotebookPen, Plus, RotateCcw, Share2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { Mascot } from "../components/Brand";
import { useToast } from "../components/Toast";
import { getMaterial } from "../data/materials";
import { isLive } from "../lib/agent";
import { todayKey, useDueReviews, useStore } from "../store";
import { AgentChat, type Command } from "../workspace/AgentChat";
import { Reader, type SelAction } from "../workspace/Reader";
import { NoteTab, ReviewTab, SummaryTab } from "../workspace/SidePanels";

type Tab = "agent" | "summary" | "review" | "note";

const SEL_PROMPT: Record<Exclude<SelAction, "note" | "check">, string> = {
  easy: "이 부분을 쉽게 설명해줘",
  example: "이 부분을 예시로 보여줘",
  compare: "비슷한 개념과 비교해서 차이를 알려줘",
  point: "이 부분의 시험 포인트를 알려줘",
};

export function Workspace() {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const material = getMaterial(id);
  const { state, dispatch } = useStore();
  const toast = useToast();
  const due = useDueReviews();
  const initialTab = (params.get("tab") as Tab) ?? "agent";
  const [tab, setTab] = useState<Tab>(initialTab);
  const [open, setOpen] = useState(true);
  const [active, setActive] = useState(params.get("section") ?? "intro");
  const [scrollTo] = useState(() => (params.get("section") ? { id: params.get("section")!, n: 0 } : null));
  const [command, setCommand] = useState<Command | null>(null);
  const [reviewPreset, setReviewPreset] = useState<string | undefined>();
  const [live, setLive] = useState<boolean | null>(null);
  const n = useRef(0);

  useEffect(() => {
    isLive().then(setLive);
  }, []);

  // Count study time while the tab is visible.
  useEffect(() => {
    const t = window.setInterval(() => document.visibilityState === "visible" && dispatch({ type: "tick", minutes: 1 }), 60_000);
    return () => window.clearInterval(t);
  }, [dispatch]);

  useEffect(() => {
    if (material) dispatch({ type: "read", materialId: material.id, sectionId: active });
  }, [active, material, dispatch]);

  const send = useCallback((c: Omit<Command, "n"> & Record<string, unknown>) => {
    n.current += 1;
    setTab("agent");
    setOpen(true);
    setCommand({ ...(c as Command), n: n.current });
  }, []);

  const autoAsked = useRef(false);
  useEffect(() => {
    if (params.get("ask") === "check" && material && !autoAsked.current) {
      autoAsked.current = true;
      const s = material.sections.find((x) => x.id === params.get("section"));
      if (s?.concept) window.setTimeout(() => send({ kind: "quiz", concept: s.concept! }), 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!material) return <Navigate to="/my/library" replace />;
  const section = material.sections.find((s) => s.id === active);
  const readCount = (state.read[material.id] ?? []).length;
  const checksToday = state.attempts.filter((a) => a.source === "check" && todayKey(new Date(a.at)) === todayKey()).length;

  const onSelect = (a: SelAction, text: string, sectionId: string) => {
    if (a === "note") {
      dispatch({ type: "note", note: { materialId: material.id, sectionId, text: "(드래그 저장)", quote: text } });
      toast("선택한 문장을 노트에 저장했어요");
      return;
    }
    const s = material.sections.find((x) => x.id === sectionId);
    if (a === "check") return send({ kind: "quiz", concept: s?.concept ?? material.sections.find((x) => x.concept)!.concept! });
    send({ kind: "ask", prompt: SEL_PROMPT[a], quote: text });
  };

  const RAIL: { k: Tab; label: string; icon: typeof MessageCircle; badge?: number }[] = [
    { k: "agent", label: "에이전트", icon: MessageCircle },
    { k: "summary", label: "요약", icon: BookMarked },
    { k: "review", label: "복습", icon: RotateCcw, badge: due.length },
    { k: "note", label: "노트", icon: NotebookPen },
  ];

  return (
    <div className="ws">
      <header className="ws-top">
        <Link to="/my" className="back-round" aria-label="내 학습으로 돌아가기"><ArrowLeft size={20} /></Link>
        <span className="title">{material.title}</span>
        <span className="chip chip-green">{Math.round((readCount / material.sections.length) * 100)}% 진행 중</span>
        <div className="right">
          <span className="tbtn" title={live ? "Claude API에 연결되어 있어요" : "ANTHROPIC_API_KEY가 없어 자료 기반 데모 응답을 써요"}>
            <span className={`live-dot ${live ? "on" : ""}`} />
            <span className="lbl">{live === null ? "연결 확인 중" : live ? "Claude 연결됨" : "데모 모드"}</span>
          </span>
          <button className="tbtn" onClick={() => navigator.clipboard?.writeText(location.href).then(() => toast("링크를 복사했어요"), () => toast("이 화면에서는 링크를 복사할 수 없어요"))}>
            <Share2 size={15} /><span className="lbl">공유</span>
          </button>
        </div>
      </header>

      <div className="ws-body">
        <Reader
          material={material}
          active={active}
          onActive={setActive}
          scrollTo={scrollTo}
          onSelectAction={onSelect}
          onCheck={(sid) => {
            const s = material.sections.find((x) => x.id === sid);
            if (s?.concept) send({ kind: "quiz", concept: s.concept });
          }}
          onQuickReview={(concept) => {
            setReviewPreset(concept);
            setTab("review");
            setOpen(true);
          }}
        />

        {open && (
          <aside className="panel" aria-label="AI 패널">
            <div className="panel-head">
              <div className="seg" role="tablist">
                {(["agent", "summary", "review"] as Tab[]).map((t) => (
                  <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>
                    {t === "agent" ? "AI 에이전트" : t === "summary" ? "요약" : "복습"}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {tab === "agent" && (state.chats[material.id] ?? []).length > 0 && (
                  <button
                    className="new-chat"
                    title="처음 화면으로 돌아가요. 학습 기록은 그대로 남아요."
                    onClick={() => {
                      dispatch({ type: "chat", materialId: material.id, messages: [] });
                      toast("새 대화를 시작했어요");
                    }}
                  >
                    <Plus size={15} />새 대화
                  </button>
                )}
                <button className="icon-btn" style={{ background: "transparent" }} aria-label="패널 닫기" onClick={() => setOpen(false)}><X size={16} /></button>
              </div>
            </div>
            {tab === "agent" && (
              <div className="goal-strip">
                <span className="strong">오늘의 목표</span>
                <span className="muted">현재 단원 + 확인 문제 5개</span>
                <div className="progress"><i style={{ width: `${Math.min(100, (checksToday / 5) * 100)}%` }} /></div>
                <span className="subtle">{Math.min(checksToday, 5)}/5</span>
              </div>
            )}
            {tab === "agent" && <AgentChat material={material} section={section} command={command} />}
            {tab === "summary" && <SummaryTab material={material} onJump={(sid) => document.getElementById(`sec-${sid}`)?.scrollIntoView({ behavior: "smooth" })} />}
            {tab === "review" && <ReviewTab key={reviewPreset ?? "list"} preset={reviewPreset} />}
            {tab === "note" && <NoteTab material={material} section={section} />}
          </aside>
        )}

        <nav className="rail" aria-label="도구">
          {RAIL.map(({ k, label, icon: Icon, badge }) => (
            <button
              key={k}
              className={open && tab === k ? "on" : ""}
              onClick={() => {
                if (open && tab === k) setOpen(false);
                else {
                  setTab(k);
                  setOpen(true);
                }
              }}
            >
              {k === "agent" ? <Mascot size={24} /> : <Icon size={22} />}
              {label}
              {!!badge && <span className="badge">{badge}</span>}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
