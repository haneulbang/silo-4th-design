import { BookmarkPlus, GitCompare, HelpCircle, Lightbulb, Sparkles, Target } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { type Block, type Material } from "../data/materials";

export type SelAction = "easy" | "example" | "compare" | "point" | "check" | "note";

const SEL_ACTIONS: { k: SelAction; label: string; icon: typeof Sparkles }[] = [
  { k: "easy", label: "쉽게 설명", icon: Sparkles },
  { k: "example", label: "예시 보기", icon: Lightbulb },
  { k: "compare", label: "비교하기", icon: GitCompare },
  { k: "point", label: "시험 포인트", icon: Target },
  { k: "check", label: "문제로 확인", icon: HelpCircle },
  { k: "note", label: "노트 저장", icon: BookmarkPlus },
];

export function Reader({
  material,
  active,
  onActive,
  scrollTo,
  onSelectAction,
}: {
  material: Material;
  active: string;
  onActive: (id: string) => void;
  scrollTo: { id: string; n: number } | null;
  onSelectAction: (a: SelAction, text: string, sectionId: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState<{ x: number; y: number; text: string; section: string } | null>(null);

  useEffect(() => {
    if (!scrollTo) return;
    document.getElementById(`sec-${scrollTo.id}`)?.scrollIntoView({ behavior: scrollTo.n === 0 ? "auto" : "smooth", block: "start" });
  }, [scrollTo]);

  // Scroll-spy: the section nearest the top of the reader is the one being read.
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) onActive(vis[0].target.id.replace("sec-", ""));
      },
      { root, rootMargin: "-10% 0px -55% 0px" },
    );
    root.querySelectorAll("[id^=sec-]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [material.id, onActive]);

  const onMouseUp = () => {
    const s = window.getSelection();
    const text = s?.toString().trim() ?? "";
    if (!s || text.length < 2 || !ref.current) return setSel(null);
    const range = s.getRangeAt(0);
    const sec = (range.startContainer.parentElement as HTMLElement | null)?.closest("[id^=sec-]");
    if (!sec) return setSel(null);
    const r = range.getBoundingClientRect();
    const box = ref.current.getBoundingClientRect();
    setSel({ x: r.left + r.width / 2 - box.left, y: r.top - box.top + ref.current.scrollTop - 8, text: text.slice(0, 400), section: sec.id.replace("sec-", "") });
  };

  return (
    <div className="reader" ref={ref} onMouseUp={onMouseUp} onScroll={(e) => {
        if (sel) setSel(null);
        // The last section can never reach the top band, so treat "scrolled to the end" as reading it.
        const el = e.currentTarget;
        if (el.scrollHeight - el.scrollTop - el.clientHeight < 40) onActive(material.sections[material.sections.length - 1].id);
      }}>
      <nav className="toc" aria-label="구간">
        <div className="toc-inner">
          {material.sections.map((s) => (
            <button key={s.id} className={active === s.id ? "on" : ""} onClick={() => document.getElementById(`sec-${s.id}`)?.scrollIntoView({ behavior: "smooth" })}>
              {s.title}
            </button>
          ))}
        </div>
      </nav>

      <article className="reader-inner">
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          <span className="chip">{material.subject}</span>
        </div>
        <h1>{material.title}</h1>

        {material.sections.map((s) => {
          return (
            <section key={s.id} id={`sec-${s.id}`} style={{ scrollMarginTop: 48 }}>
              {s.id !== "intro" && <div className="sec-title">{s.title}</div>}
              {s.blocks.map((b, i) => <BlockView key={i} b={b} />)}
            </section>
          );
        })}
      </article>

      {sel && (
        <div className="sel-pop" style={{ left: sel.x, top: sel.y }} onMouseUp={(e) => e.stopPropagation()}>
          {SEL_ACTIONS.map(({ k, label, icon: Icon }) => (
            <button
              key={k}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onSelectAction(k, sel.text, sel.section);
                setSel(null);
                window.getSelection()?.removeAllRanges();
              }}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Inline marks from the source notes: **bold** and `code`. */
function Inline({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*(?:[^*]|\*(?!\*))+?\*\*|`[^`]+`)/g).map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <b key={i}>{part.slice(2, -2)}</b>
        ) : part.startsWith("`") && part.endsWith("`") ? (
          <code key={i} className="inline-code">{part.slice(1, -1)}</code>
        ) : (
          part
        ),
      )}
    </>
  );
}

function BlockView({ b }: { b: Block }) {
  switch (b.kind) {
    case "h2":
      return <h2>{b.text}</h2>;
    case "h3":
      return <h3 className="reader-h3">{b.text}</h3>;
    case "p":
      return <p><Inline text={b.text} /></p>;
    case "ul":
      return <ul>{b.items.map((i) => <li key={i}><Inline text={i} /></li>)}</ul>;
    case "ol":
      return <ol>{b.items.map((i) => <li key={i}><Inline text={i} /></li>)}</ol>;
    case "code":
      return <pre className="mono">{b.text}</pre>;
    case "callout": {
      // Callouts are written as "라벨 · 본문"; the label becomes the visual anchor.
      const [label, ...rest] = b.text.split(" · ");
      if (!rest.length) return <div className="callout">{b.text}</div>;
      return (
        <div className={`callout ${label === "자주 혼동" ? "warn" : ""}`}>
          <span className="callout-label">{label}</span>
          <span>{rest.join(" · ")}</span>
        </div>
      );
    }
    case "table":
      return (
        <table>
          <thead><tr>{b.head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {b.rows.length === 0 && (
              <tr><td colSpan={b.head.length} className="subtle" style={{ textAlign: "center" }}>결과 없음 (0행)</td></tr>
            )}
            {b.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className={c === "NULL" ? "subtle" : ""}><Inline text={c} /></td>)}</tr>)}
          </tbody>
        </table>
      );
  }
}
