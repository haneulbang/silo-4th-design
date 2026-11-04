import { Check, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleMark, Mascot } from "../components/Brand";
import { useStore } from "../store";

export function Login() {
  const { state, dispatch } = useStore();
  const nav = useNavigate();
  const [name, setName] = useState("조하늘");

  const start = () => {
    dispatch({ type: "login", name: name.trim() || "학습자" });
    nav(state.setup ? "/my" : "/setup");
  };

  return (
    <main className="login">
      <section className="login-art" aria-hidden>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 14 }}>
          <Mascot size={72} />
          <div className="preview-card">
            <div className="subtle" style={{ marginBottom: 6 }}>WHERE와 HAVING · 확인 문제</div>
            <div className="strong" style={{ fontSize: 14, marginBottom: 10 }}>WHERE 절에는 집계 함수를 조건으로 사용할 수 없다.</div>
            <div className="opts">
              <div className="opt right"><span className="k"><Check size={12} /></span>O</div>
              <div className="opt dim"><span className="k">X</span>X</div>
            </div>
            <div className="q-result ok">
              <span>정답입니다!</span>
              <span className="chip chip-green">확신하고 맞힘</span>
            </div>
          </div>
        </div>
        <div className="points">
          <div className="strong" style={{ fontSize: 17, marginBottom: 10 }}>읽고, 확인하고, 기록하는 AI 리딩 파트너</div>
          {["모르는 문장은 드래그해서 바로 쉽게 설명받기", "설명 뒤엔 짧은 확인 문제로 진짜 이해했는지 체크", "틀린 이유와 복습 일정이 자동으로 쌓여요"].map((t) => (
            <div key={t} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14, color: "var(--ink-2)", marginTop: 6 }}>
              <CheckCircle2 size={16} color="var(--green)" />
              {t}
            </div>
          ))}
        </div>
      </section>

      <section className="login-form">
        <h1>나만의 학습을 시작해보세요!</h1>
        <p style={{ fontSize: 17, lineHeight: 1.6, color: "var(--ink-2)", margin: "0 0 8px", maxWidth: 420 }}>
          궁금한 내용을 질문하고, 학습 기록을 저장하며 언제든 이어서 공부할 수 있어요.
        </p>
        <p className="muted" style={{ margin: "0 0 28px", maxWidth: 420 }}>AI가 설명만 하고 끝나지 않아요. 내가 혼자 풀 수 있을 때까지 도움을 조금씩 줄여가요.</p>
        <div className="field" style={{ maxWidth: 380 }}>
          <label htmlFor="name">이름</label>
          <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && start()} />
        </div>
        <button className="google-btn" style={{ maxWidth: 380 }} onClick={start}>
          <GoogleMark />
          Google로 계속하기
        </button>
        <p className="subtle" style={{ marginTop: 14, maxWidth: 380 }}>프로토타입이라 실제 Google 계정 연동 없이 이 브라우저에만 학습 기록이 저장돼요.</p>
      </section>
    </main>
  );
}
