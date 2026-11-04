import { Bell, Grid3x3, Globe, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "../store";
import { Logo } from "./Brand";

export function Header() {
  const { state, dispatch } = useStore();
  const nav = useNavigate();
  return (
    <header className="gnb">
      <div className="gnb-main">
        <Link to={state.user ? "/my" : "/login"} aria-label="홈">
          <Logo />
        </Link>
        <div className="gnb-right">
          {state.user ? (
            <>
              <button className="icon-btn" aria-label="서비스"><Grid3x3 size={16} /></button>
              <button className="icon-btn" aria-label="언어"><Globe size={16} /></button>
              <button className="icon-btn" aria-label="알림"><Bell size={16} /><span className="dot" /></button>
              <button
                className="avatar"
                title="로그아웃"
                onClick={() => {
                  dispatch({ type: "logout" });
                  nav("/login");
                }}
              >
                {state.user.name[0]}
              </button>
            </>
          ) : (
            <Link className="btn btn-sm" to="/login"><LogOut size={14} />로그인</Link>
          )}
        </div>
      </div>
    </header>
  );
}
