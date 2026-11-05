import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Header } from "./components/Header";
import { Login } from "./pages/Login";
import { Setup } from "./pages/Setup";
import { Workspace } from "./pages/Workspace";
import { useStore } from "./store";

/** The study screen is the whole app now; everything else lands here. */
export const HOME = "/learn/groupby";

/** Opening the app goes straight to studying; login and setup stay reachable by their own address. */
function Guard({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function App() {
  const { state } = useStore();
  return (
    <Routes>
      <Route path="/login" element={<><Header /><Login /></>} />
      <Route path="/setup" element={state.user ? <><Header /><Setup /></> : <Navigate to="/login" replace />} />
      <Route path="/learn/:id" element={<Guard><Workspace /></Guard>} />
      <Route path="*" element={<Navigate to={HOME} replace />} />
    </Routes>
  );
}
