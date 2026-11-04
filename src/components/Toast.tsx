import { CheckCircle2 } from "lucide-react";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

const Ctx = createContext<(msg: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const show = useCallback((m: string) => {
    setMsg(m);
    window.setTimeout(() => setMsg((cur) => (cur === m ? null : cur)), 2200);
  }, []);
  return (
    <Ctx.Provider value={show}>
      {children}
      {msg && (
        <div className="toast" role="status">
          <CheckCircle2 size={16} color="#00c471" />
          {msg}
        </div>
      )}
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
