import { ArrowLeft, Menu, SquarePen, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { Mascot } from "../components/Brand";
import { useToast } from "../components/Toast";
import { getMaterial } from "../data/materials";
import { useStore } from "../store";
import { AgentChat, type Command } from "../workspace/AgentChat";
import { Reader, type SelAction } from "../workspace/Reader";
import { PanelMenu } from "../workspace/PanelMenu";
import { ToneMenu } from "../workspace/ToneMenu";
import { QuizTab } from "../workspace/QuizTab";

type Tab = "agent" | "review";

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
  const initialTab: Tab = params.get("tab") === "review" ? "review" : "agent";
  const [tab, setTab] = useState<Tab>(initialTab);
  const [open, setOpen] = useState(true);
  const [active, setActive] = useState(params.get("section") ?? "intro");
  const [scrollTo] = useState(() => (params.get("section") ? { id: params.get("section")!, n: 0 } : null));
  const [command, setCommand] = useState<Command | null>(null);
  const [reviewPreset, setReviewPreset] = useState<string | undefined>();
  const [menuOpen, setMenuOpen] = useState(false);
  const n = useRef(0);

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
  const hasChat = (state.chats[material.id] ?? []).length > 0;

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

  const TABS: { k: Tab; label: string }[] = [
    { k: "agent", label: "AI 에이전트" },
    { k: "review", label: "퀴즈" },
  ];

  return (
    <div className="ws">
      <div className="ws-main">
        <header className="ws-top">
          <Link to="/my" className="back-round" aria-label="내 학습으로 돌아가기"><ArrowLeft size={20} /></Link>
          <span className="title">{material.title}</span>
          <span className="chip chip-green">{Math.round((readCount / material.sections.length) * 100)}% 진행 중</span>
          <div className="right">
            {!open && (
              <button className="tbtn" onClick={() => setOpen(true)}>
                <Mascot size={18} /><span className="lbl">AI 패널 열기</span>
              </button>
            )}
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
        </div>
      </div>

      {open && (
        <aside className="panel" aria-label="AI 패널">
          <div className="panel-head">
            <span aria-hidden="true" />
            <div className="seg" role="tablist" aria-label="AI 패널 메뉴">
              {TABS.map(({ k, label }) => (
                <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => { setTab(k); setMenuOpen(false); }}>
                  {label}
                </button>
              ))}
            </div>
            <div className="panel-head-side end">
              <button className="head-icon" aria-label="패널 닫기" title="패널 닫기" onClick={() => setOpen(false)}><X size={18} /></button>
            </div>
          </div>
          {tab === "agent" && (
            <>
              <div className="panel-tools">
                <button className="tool-btn" aria-label="대화 기록" title="대화 기록" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
                  <Menu size={18} />
                </button>
                <div className="panel-tools-end">
                  <button
                    className="tool-btn"
                    aria-label="새 대화"
                    disabled={!hasChat}
                    title={hasChat ? "새 대화" : "지금이 새 대화예요"}
                    onClick={() => {
                      dispatch({ type: "newChat", materialId: material.id });
                      toast("새 대화를 시작했어요. 지난 대화는 대화 기록에 있어요.");
                    }}
                  >
                    <SquarePen size={17} />
                  </button>
                  {hasChat && <ToneMenu />}
                </div>
              </div>
              <AgentChat material={material} section={section} command={command} />
              {menuOpen && <PanelMenu material={material} onClose={() => setMenuOpen(false)} />}
            </>
          )}
          {tab === "review" && <QuizTab key={reviewPreset ?? "quiz"} material={material} section={section} preset={reviewPreset} onAsk={() => setTab("agent")} />}
        </aside>
      )}
    </div>
  );
}
