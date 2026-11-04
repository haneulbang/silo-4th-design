import Anthropic from "@anthropic-ai/sdk";
import type { IncomingMessage, ServerResponse } from "node:http";

const MODEL = "claude-opus-5-5";

let client: Anthropic | null = null;
function getClient() {
  if (!client) client = new Anthropic();
  return client;
}

const SYSTEM = `너는 SQLD 시험을 준비하는 학습자의 "AI 리딩 파트너"다.
원칙:
- 학습자가 지금 읽고 있는 학습 자료(아래 <material>)를 1차 근거로 답한다. 자료 밖 내용을 보충할 땐 "자료 밖 보충"이라고 밝힌다.
- 짧고 쉬운 한국어로, 3~6문장 안에서 답한다. 새 전문용어는 쓰기 전에 풀어 설명한다.
- 정답을 바로 알려주지 말고, 문제 관련 질문에는 힌트부터 단계적으로 준다.
- 설명을 마친 뒤엔 "이해했는지 짧은 문제로 확인해볼까요?" 같은 다음 학습 행동을 한 줄로 제안한다.
- 학습자의 취약 개념(<weak>)이 질문과 관련 있으면 자연스럽게 연결한다.
- 마크다운은 **굵게**와 줄바꿈, "- " 목록만 쓴다.`;

type Body = {
  mode: "chat" | "explain" | "diagnose";
  material: string;
  weak?: string[];
  history?: { role: "user" | "assistant"; content: string }[];
  prompt: string;
};

function readJson(req: IncomingMessage): Promise<Body> {
  // Vercel's Node runtime may already have parsed the body.
  const pre = (req as IncomingMessage & { body?: unknown }).body;
  if (pre && typeof pre === "object") return Promise.resolve(pre as Body);
  if (typeof pre === "string") return Promise.resolve(JSON.parse(pre));
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function send(res: ServerResponse, status: number, data: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

export async function handleAgentRequest(req: IncomingMessage, res: ServerResponse) {
  if (req.method === "GET") return send(res, 200, { live: hasCredentials() });
  if (req.method !== "POST") return send(res, 405, { error: "method not allowed" });
  if (!hasCredentials()) return send(res, 503, { error: "no_credentials" });

  try {
    const body = await readJson(req);
    const history = (body.history ?? []).slice(-8);
    const response = await getClient().beta.messages.create({
      model: MODEL,
      max_tokens: 2000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low" },
      system: [
        { type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } },
        {
          type: "text",
          text: `<material>\n${body.material}\n</material>\n<weak>${(body.weak ?? []).join(", ") || "없음"}</weak>`,
        },
      ],
      messages: [...history, { role: "user", content: body.prompt }],
    } as any);

    if (response.stop_reason === "refusal") return send(res, 200, { text: "이 질문에는 답하기 어려워요. 학습 자료와 관련된 질문으로 다시 물어봐 주세요." });
    const text = response.content
      .map((b: { type: string; text?: string }) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim();
    send(res, 200, { text });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) return send(res, 429, { error: "rate_limited" });
    if (err instanceof Anthropic.AuthenticationError) return send(res, 401, { error: "auth" });
    if (err instanceof Anthropic.APIError) return send(res, 502, { error: err.message });
    send(res, 500, { error: String(err) });
  }
}

function hasCredentials() {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

// Vercel serverless entry; the Vite dev server mounts the same handler at /api/agent.
export default function handler(req: IncomingMessage, res: ServerResponse) {
  return handleAgentRequest(req, res);
}
