import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Header } from "./components/Header";
import { Dashboard } from "./pages/Dashboard";
import { Library } from "./pages/Library";
import { Login } from "./pages/Login";
import { Records } from "./pages/Records";
import { Setup } from "./pages/Setup";
import { Workspace } from "./pages/Workspace";
import { useStore } from "./store";

function Guard({ children, bare }: { children: ReactNode; bare?: boolean }) {
  const { state } = useStore();
  if (!state.user) return <Navigate to="/login" replace />;
  if (!state.setup) return <Navigate to="/setup" replace />;
  return bare ? <>{children}</> : <><Header />{children}</>;
}

export function App() {
  const { state } = useStore();
  return (
    <Routes>
      <Route path="/login" element={<><Header /><Login /></>} />
      <Route path="/setup" element={state.user ? <><Header /><Setup /></> : <Navigate to="/login" replace />} />
      <Route path="/my" element={<Guard><Dashboard /></Guard>} />
      <Route path="/my/library" element={<Guard><Library /></Guard>} />
      <Route path="/my/records" element={<Guard><Records /></Guard>} />
      <Route path="/learn/:id" element={<Guard bare><Workspace /></Guard>} />
      <Route path="*" element={<Navigate to="/my" replace />} />
    </Routes>
  );
}
