import { MessageSquareQuote } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useToast } from "../components/Toast";
import { TONES } from "../lib/agent";
import { useStore, type Tone } from "../store";

/** 기본으로, MZ로, 선생님으로 … — the particle depends on the last sound of the name. */
const WITH_RO: Record<Tone, string> = { 기본: "기본으로", MZ: "MZ로", 선생님: "선생님으로", F감성: "F감성으로", T감성: "T감성으로" };

/** Icon button in the agent toolbar that picks how the AI talks. */
export function ToneMenu() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="tone" ref={box}>
      <button
        className={`tool-btn ${open ? "is-open" : ""}`}
        aria-label={`말투 바꾸기, 지금은 ${state.tone}`}
        title={`말투 · ${state.tone}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <MessageSquareQuote size={17} />
      </button>
      {open && (
        <div className="tone-menu" role="menu" aria-label="AI 말투">
          <div className="tone-menu-head">AI 말투</div>
          {TONES.map((t) => (
            <button
              key={t.k}
              role="menuitemradio"
              aria-checked={state.tone === t.k}
              className={`tone-item ${state.tone === t.k ? "on" : ""}`}
              onClick={() => {
                setOpen(false);
                if (state.tone === t.k) return;
                dispatch({ type: "setTone", tone: t.k });
                toast(`말투를 ${WITH_RO[t.k]} 바꿨어요. 다음 답변부터 적용돼요.`);
              }}
            >
              <span className="tone-name">{t.k}<span className="tone-desc">{t.desc}</span></span>
              <span className="tone-sample">{t.sample}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
