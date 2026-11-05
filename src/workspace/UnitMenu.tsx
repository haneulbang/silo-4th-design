import { Lock, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { MATERIALS, type Material } from "../data/materials";

/** Cover colour per unit. */
const COVER: Record<string, string> = { groupby: "#00a760", join: "#1b1c1d" };

const UPCOMING = [{ title: "서브쿼리와 집합 연산자" }, { title: "윈도우 함수" }, { title: "데이터 모델링의 이해" }];

/** Hamburger in the dark top bar: a dark side rail of unit covers, like page thumbnails, the current one framed. */
export function UnitMenu({ material }: { material: Material }) {
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const closeBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        className={`unit-menu-btn ${open ? "is-open" : ""}`}
        aria-label="강의 목록"
        title="강의 목록"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Menu size={20} />
      </button>
      {open && createPortal(
        <>
          <div className="unit-backdrop" onClick={() => setOpen(false)} />
          <nav className="unit-rail" aria-label="강의 목록">
            <div className="unit-rail-head">
              <span>강의 목록</span>
              <button ref={closeBtn} className="unit-rail-close" aria-label="강의 목록 닫기" onClick={() => setOpen(false)}><X size={18} /></button>
            </div>
            <div className="unit-rail-body">
              {MATERIALS.map((m, n) => {
                const here = m.id === material.id;
                const cover = COVER[m.id] ?? "#3e4042";
                return (
                  <button
                    key={m.id}
                    className={`unit-card ${here ? "on" : ""}`}
                    aria-current={here ? "page" : undefined}
                    onClick={() => {
                      setOpen(false);
                      if (!here) nav(`/learn/${m.id}`);
                    }}
                  >
                    <span className="unit-cover" style={{ background: cover }}>
                      <span className="unit-cover-title">{n + 1}. {m.title}</span>
                      <span className="unit-meta">{m.subject} · 약 {m.minutes}분</span>
                    </span>
                  </button>
                );
              })}
              {UPCOMING.map((u, n) => (
                <div key={u.title} className="unit-card soon" aria-disabled="true">
                  <span className="unit-cover">
                    <span className="unit-cover-title">{MATERIALS.length + n + 1}. {u.title}</span>
                    <span className="unit-meta"><Lock size={11} />자료 준비 중</span>
                  </span>
                </div>
              ))}
            </div>
          </nav>
        </>,
        // On the page root so the dim also covers the AI panel, header and all.
        document.body,
      )}
    </>
  );
}
