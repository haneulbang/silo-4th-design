import { NavLink } from "react-router-dom";
import { EXAM } from "../data/materials";
import { daysUntil } from "../store";

export function SideNav() {
  const d = daysUntil(EXAM.date);
  return (
    <aside className="side-nav">
      <NavLink to="/my" end>내 학습</NavLink>
      <NavLink to="/my/library">강의실</NavLink>
      <NavLink to="/my/records">학습 기록</NavLink>
      <div className="divider" />
      <div className="exam-card">
        <div className="subtle">목표 시험</div>
        <div className="strong" style={{ margin: "2px 0 6px" }}>{EXAM.name} {EXAM.round}</div>
        <span className="chip chip-green">{d > 0 ? `D-${d}` : d === 0 ? "D-DAY" : "시험 종료"}</span>
      </div>
    </aside>
  );
}
