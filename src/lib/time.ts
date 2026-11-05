/** "방금 전", "5분 전", "3시간 전", "2일 전". */
export function timeAgo(t: number) {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return "방금 전";
  if (m < 60) return `${m}분 전`;
  if (m < 1440) return `${Math.round(m / 60)}시간 전`;
  return `${Math.round(m / 1440)}일 전`;
}
