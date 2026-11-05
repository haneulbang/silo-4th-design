import { CONCEPTS, type Material, type Section, materialToText } from "../data/materials";

export type AgentReply = { text: string; concept?: string; live: boolean };

const KEYWORDS: Record<string, string[]> = {
  agg_null: ["count", "avg", "sum", "집계", "null", "평균", "널"],
  groupby_rule: ["group by", "groupby", "그룹", "별칭", "alias", "select에"],
  where_having: ["having", "where", "해빙", "처리 순서", "거르"],
  empty_agg: ["공집합", "행이 없", "없을 때", "99"],
  inner_join: ["inner"],
  outer_join: ["outer", "left join", "left outer"],
  join_order: ["on 조건", "on과", " on "],
};

/** Picks the concept a question is about, falling back to the section the learner is reading. */
export function detectConcept(text: string, section?: Section): string | undefined {
  const t = ` ${text.toLowerCase()} `;
  let best: string | undefined;
  let hits = 0;
  for (const [c, words] of Object.entries(KEYWORDS)) {
    const n = words.filter((w) => t.includes(w)).length;
    if (n > hits) [best, hits] = [c, n];
  }
  return best ?? section?.concept;
}

let liveCache: boolean | null = null;
export async function isLive() {
  if (liveCache !== null) return liveCache;
  try {
    const r = await fetch("/api/agent");
    liveCache = r.ok && (await r.json()).live === true;
  } catch {
    liveCache = false;
  }
  return liveCache;
}

export async function askAgent(opts: {
  material: Material;
  section?: Section;
  prompt: string;
  history: { role: "user" | "assistant"; content: string }[];
  weak: string[];
}): Promise<AgentReply> {
  const concept = detectConcept(opts.prompt, opts.section);
  if (await isLive()) {
    try {
      const r = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "chat",
          material: materialToText(opts.material),
          weak: opts.weak,
          history: opts.history,
          prompt: opts.section ? `[지금 읽는 구간: ${opts.section.title}]\n${opts.prompt}` : opts.prompt,
        }),
      });
      if (r.ok) return { text: (await r.json()).text, concept, live: true };
    } catch {
      /* fall through to the offline tutor */
    }
  }
  await new Promise((res) => setTimeout(res, 650));
  return { text: offline(opts.prompt, opts.material, opts.section, concept, opts.weak), concept, live: false };
}

const EXPLAIN: Record<string, { easy: string; example: string; point: string; confuse: string }> = {
  agg_null: {
    easy: "출석부를 떠올려 보세요. **COUNT(*)**는 출석부에 적힌 사람 수를 세고, **COUNT(COMM)**은 그중 수당 칸에 뭔가 적힌 사람만 세요. 빈칸(NULL)은 '값이 없음'이라 집계에서 빠져요.",
    example: "EMP에서 COUNT(*)는 6, COUNT(COMM)은 2예요. AVG(COMM)은 (500+300)/**2** = 400이에요. 분모에서도 NULL 행이 빠지는 게 포인트예요.",
    point: "AVG(COMM) 계산에서 분모를 6으로 잡는 선지가 단골 함정이에요.",
    confuse: "COUNT(*)와 COUNT(컬럼)",
  },
  groupby_rule: {
    easy: "GROUP BY는 같은 값끼리 **바구니에 담는 것**이에요. 결과는 바구니마다 한 줄이라, SELECT에는 바구니 이름(GROUP BY 컬럼)이나 바구니 요약(집계 함수)만 쓸 수 있어요.",
    example: "부서 10 바구니에는 김대표·이개발·최코드가 들어 있어요. 여기서 ENAME 하나를 고를 수 없으니 SELECT DEPTNO, ENAME ... GROUP BY DEPTNO는 오류예요.",
    point: "GROUP BY에는 SELECT 별칭을 못 써요. GROUP BY가 SELECT보다 먼저 처리되기 때문이에요.",
    confuse: "GROUP BY 컬럼과 SELECT 컬럼",
  },
  where_having: {
    easy: "**WHERE는 바구니에 담기 전에** 사람을 고르고, **HAVING은 담은 뒤에** 바구니를 골라요. 그래서 SUM(SAL) 같은 바구니 요약값으로 거르려면 HAVING을 써야 해요.",
    example: "WHERE JOB <> 'CEO'로 대표를 먼저 빼고, 부서별로 묶은 뒤, HAVING SUM(SAL) > 9000으로 부서를 걸러요. 결과는 10번(10000)과 20번(10500) 두 줄이에요.",
    point: "처리 순서 FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY를 외워두면 대부분의 선지를 거를 수 있어요.",
    confuse: "WHERE와 HAVING",
  },
  empty_agg: {
    easy: "대상 행이 없을 때, **GROUP BY가 없으면** 빈 바구니 하나를 요약해서 한 줄이 나오고, **GROUP BY가 있으면** 바구니 자체가 없어서 아무 줄도 안 나와요.",
    example: "WHERE DEPTNO = 99로 거르면 COUNT(*)는 0, SUM(SAL)은 NULL인 한 줄이 나와요. 여기에 GROUP BY DEPTNO를 붙이면 결과가 0행이에요.",
    point: "'공집합에서 COUNT는 0, 나머지 집계는 NULL'은 매 회차 나오는 선지예요.",
    confuse: "COUNT의 0과 SUM의 NULL",
  },
  inner_join: {
    easy: "INNER JOIN은 **양쪽에 짝이 있는 행만** 남겨요. 짝이 없으면 결과에서 사라져요.",
    example: "DEPT 40번(기획)은 소속 사원이 없어서 INNER JOIN 결과에 나오지 않아요.",
    point: "INNER JOIN 결과 행 수를 묻는 문제는 '짝 없는 행'부터 찾으면 빨라요.",
    confuse: "INNER JOIN과 OUTER JOIN",
  },
  outer_join: {
    easy: "LEFT OUTER JOIN은 **왼쪽 테이블은 전부 남기고**, 오른쪽에 짝이 없으면 오른쪽 칸을 NULL로 채워요.",
    example: "DEPT LEFT JOIN EMP에서 기획(40) 행은 남고 ENAME은 NULL이에요.",
    point: "어느 쪽이 '기준(왼쪽)'인지 먼저 표시하고 푸세요.",
    confuse: "LEFT와 RIGHT의 기준 테이블",
  },
  join_order: {
    easy: "OUTER JOIN에서 **ON은 붙일 때의 조건**, **WHERE는 붙인 뒤 거르는 조건**이에요.",
    example: "LEFT JOIN 뒤 WHERE E.JOB = 'DEV'를 쓰면 NULL로 채워진 기획(40) 행도 걸러져서 INNER JOIN처럼 돼요.",
    point: "오른쪽 테이블 조건을 WHERE에 쓰면 OUTER JOIN 효과가 사라진다는 선지를 조심하세요.",
    confuse: "ON 조건과 WHERE 조건",
  },
};

function offline(prompt: string, m: Material, section: Section | undefined, concept: string | undefined, weak: string[]) {
  const p = prompt.replace(/\s/g, "");
  if (/무엇을할수|뭘할수|뭐할수|기능/.test(p))
    return [
      "저는 지금 읽는 자료를 같이 보면서 이렇게 도와요.",
      "- 드래그한 문장을 **쉽게 설명**하거나 예시로 풀어드려요",
      "- 설명이 끝나면 **짧은 확인 문제**로 진짜 이해했는지 같이 확인해요",
      "- 틀린 이유를 분류해서 **오답 기록**과 **복습 일정**에 남겨요",
      "- 다음에 다시 오면 지난번 취약 개념부터 이어서 봐요",
      "",
      "궁금한 문장을 드래그하거나, 아래 질문을 눌러 시작해 보세요.",
    ].join("\n");

  if (/요약/.test(p))
    return [
      `**${m.title}** 핵심만 정리했어요.`,
      ...m.sections.filter((s) => s.concept).map((s) => `- **${CONCEPTS[s.concept!].name}**: ${EXPLAIN[s.concept!].easy.replace(/\*\*/g, "").split(". ")[0]}.`),
      "",
      "자세한 암기 포인트는 상단 **요약** 탭에서 볼 수 있어요.",
    ].join("\n");

  const c = concept && EXPLAIN[concept] ? concept : section?.concept;
  if (!c) {
    if (section?.id === "intro")
      return `지금은 **${m.title}** 인트로예요. 이 단원은 ${m.sections
        .filter((s) => s.concept)
        .map((s) => CONCEPTS[s.concept!].name)
        .join(", ")}을 다뤄요.\n\n${weak.length ? `지난 기록을 보면 **${weak[0]}**이 아직 불안해요. 해당 구간부터 보면 좋아요.` : "첫 구간부터 차근차근 읽어볼까요?"}`;
    return "이 질문은 지금 자료에서 근거를 찾기 어려워요. 자료 속 문장을 드래그해서 물어보면 더 정확하게 설명할 수 있어요.";
  }
  const e = EXPLAIN[c];
  const name = CONCEPTS[c].name;
  const wantsExample = /예시|예를|example/.test(p);
  const wantsPoint = /시험|포인트|출제/.test(p);
  const wantsCompare = /비교|차이|다른/.test(p);
  const lines = [wantsExample ? e.example : wantsPoint ? `**시험 포인트** · ${e.point}` : wantsCompare ? `**${e.confuse}**를 비교하면 이래요.\n${e.easy}` : e.easy];
  if (!wantsExample) lines.push("", `예를 들면, ${e.example}`);
  if (weak.includes(name)) lines.push("", `지난번에 **${name}**에서 틀린 적이 있어요. 이번엔 확인 문제로 꼭 짚고 넘어가요.`);
  lines.push("", "출처: 학습 자료 · " + (m.sections.find((s) => s.concept === c)?.title ?? m.title));
  return lines.join("\n");
}

export function summaryOf(m: Material) {
  return m.sections
    .filter((s) => s.concept && EXPLAIN[s.concept])
    .map((s) => ({ section: s, concept: CONCEPTS[s.concept!].name, ...EXPLAIN[s.concept!] }));
}
