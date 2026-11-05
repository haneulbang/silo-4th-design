import { MessageCircle, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getMaterial, type Material } from "../data/materials";
import { useStore, type ChatMsg } from "../store";

/** A conversation is named by the first thing the learner asked. */
function titleOf(msgs: ChatMsg[], fallback: string) {
  const first = msgs.find((m) => m.role === "user")?.content ?? msgs.find((m) => m.content)?.content;
  return first ? first.replace(/\*\*/g, "").replace(/\s+/g, " ") : fallback;
}

/** "11월 5일" — the day is what tells conversations apart once the list spans weeks. */
function dateOf(at: number) {
  const d = new Date(at);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

/** Slide-in conversation history: the current chat on top, earlier ones stacked below, newest first. */
export function PanelMenu({ material, onClose }: { material: Material; onClose: () => void }) {
  const { state, dispatch } = useStore();
  const nav = useNavigate();
  const closeBtn = useRef<HTMLButtonElement>(null);
  const current = state.chats[material.id] ?? [];

  useEffect(() => {
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <div className="panel-menu-backdrop" onClick={onClose} />
      <nav className="panel-menu" aria-label="대화 기록">
        <div className="panel-menu-head">
          <span className="strong">대화 기록</span>
          <button ref={closeBtn} className="head-icon" aria-label="대화 기록 닫기" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="panel-menu-body">
          {current.length > 0 && (
            <button className="menu-row on" aria-current="true" onClick={onClose}>
              <MessageCircle size={16} className="menu-ico" />
              <span className="grow">
                <span className="menu-title">{titleOf(current, material.title)}</span>
                <span className="menu-meta">{material.title}</span>
              </span>
              <span className="chip chip-green">지금 대화</span>
            </button>
          )}
          {state.history.map((h) => {
            const m = getMaterial(h.materialId);
            return (
              <button
                key={h.id}
                className="menu-row"
                onClick={() => {
                  dispatch({ type: "openChat", id: h.id });
                  onClose();
                  if (h.materialId !== material.id) nav(`/learn/${h.materialId}`);
                }}
              >
                <MessageCircle size={16} className="menu-ico" />
                <span className="grow">
                  <span className="menu-title">{titleOf(h.messages, m?.title ?? "대화")}</span>
                  <span className="menu-meta">{m?.title ?? "삭제된 자료"}</span>
                </span>
                <span className="menu-date">{dateOf(h.at)}</span>
              </button>
            );
          })}
          {current.length === 0 && state.history.length === 0 && (
            <div className="empty" style={{ padding: "32px 20px" }}>
              아직 대화 기록이 없어요.<br />새 대화를 시작하면 지난 대화가 여기에 쌓여요.
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
