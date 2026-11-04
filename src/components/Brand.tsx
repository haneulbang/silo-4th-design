/** Pixel-art sprout buddy used as the AI agent's face. */
export function Mascot({ size = 96, mood = "smile" }: { size?: number; mood?: "smile" | "wow" | "think" }) {
  const px = [
    "....xxxx....",
    "..xxxxxxxx..",
    ".xxxxxxxxxx.",
    "xxxxxxxxxxxx",
    "xxxxxxxxxxxx",
    "xxxxxxxxxxxx",
    "xxxxxxxxxxxx",
    "xxxxxxxxxxxx",
    ".xxxxxxxxxx.",
    "..xxxxxxxx..",
  ];
  const mouth = mood === "wow" ? [[5, 7], [6, 7]] : mood === "think" ? [[5, 7], [6, 7], [7, 7]] : [[4, 6], [5, 7], [6, 7], [7, 6]];
  return (
    <svg width={size} height={size * 1.0} viewBox="-1 -3 14 14" aria-hidden shapeRendering="crispEdges">
      <rect x="5" y="-3" width="1" height="2" fill="#2fae5f" />
      <rect x="6" y="-2" width="2" height="1" fill="#2fae5f" />
      {px.flatMap((row, y) => [...row].map((c, x) => (c === "x" ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={(x + y) % 5 === 0 ? "#6fd66a" : "#7ddc72"} /> : null)))}
      <rect x="3" y="4" width="1" height="1" fill="#1b1c1d" />
      <rect x="8" y="4" width="1" height="1" fill="#1b1c1d" />
      {mouth.map(([x, y]) => (
        <rect key={`m${x}${y}`} x={x} y={y} width="1" height="1" fill="#1b1c1d" />
      ))}
      <rect x="2" y="5" width="1" height="1" fill="#f6a7a0" opacity="0.6" />
      <rect x="9" y="5" width="1" height="1" fill="#f6a7a0" opacity="0.6" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="logo">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.4" />
        <path d="M12 17V10M12 10c0-2.5 2-4 4.5-4 0 2.5-2 4-4.5 4ZM12 12c0-2-1.6-3.2-3.6-3.2 0 2 1.6 3.2 3.6 3.2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      sprout
    </span>
  );
}

export function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
