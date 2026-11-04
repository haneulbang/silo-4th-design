import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, MemoryRouter } from "react-router-dom";
import { App } from "./App";
import { ToastProvider } from "./components/Toast";
import { StoreProvider } from "./store";
import "./styles.css";

// Artifact builds run in a sandboxed frame whose URL the app doesn't own, so routes live in memory there.
const Router = import.meta.env.MODE === "artifact" ? (p: { children: React.ReactNode }) => <MemoryRouter initialEntries={["/my"]}>{p.children}</MemoryRouter> : BrowserRouter;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Router>
      <StoreProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </StoreProvider>
    </Router>
  </StrictMode>,
);
