import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { handleAgentRequest } from "./api/agent";

// Serves POST /api/agent from the dev/preview server so the API key never reaches the browser.
function agentApi(): Plugin {
  const mount = (server: { middlewares: { use: (path: string, fn: any) => void } }) => {
    server.middlewares.use("/api/agent", handleAgentRequest);
  };
  return { name: "agent-api", configureServer: mount, configurePreviewServer: mount };
}

// The project sits on an external drive where Vite may not be allowed to write its cache.
export default defineConfig({ plugins: [react(), agentApi()], cacheDir: join(tmpdir(), "sprout-vite-cache") });
