export type Block =
  | { kind: "h2"; text: string }
  | { kind: "h3"; text: string }
  | { kind: "ol"; items: string[] }
  | { kind: "p"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "table"; head: string[]; rows: string[][]; caption?: string }
  | { kind: "code"; text: string }
  | { kind: "callout"; text: string };

export type Section = { id: string; title: string; concept?: string; blocks: Block[] };

export type Material = {
  id: string;
  title: string;
  subject: string;
  chapter: string;
  minutes: number;
  sections: Section[];
};

export const EXAM = {
  name: "SQLD",
  round: "제63회",
  date: "2026-11-14",
  passLine: 60,
  cutLine: 40,
  subjects: [
    { name: "1과목 · 데이터 모델링의 이해", questions: 10, weight: 20 },
    { name: "2과목 · SQL 기본 및 활용", questions: 40, weight: 80 },
  ],
};

export const CONCEPTS: Record<string, { name: string; material: string }> = {
  agg_null: { name: "집계 함수와 NULL", material: "groupby" },
  groupby_rule: { name: "GROUP BY 규칙", material: "groupby" },
  where_having: { name: "WHERE와 HAVING", material: "groupby" },
  empty_agg: { name: "공집합 집계", material: "groupby" },
  inner_join: { name: "INNER JOIN", material: "join" },
  outer_join: { name: "OUTER JOIN", material: "join" },
  join_order: { name: "JOIN과 WHERE 적용 순서", material: "join" },
};

const EMP_TABLE: Block = {
  kind: "table",
  caption: "EMP",
  head: ["ENAME (이름)", "JOB (직무)", "SAL (급여)", "COMM (수당)", "DEPTNO (부서)"],
  rows: [
    ["김대표", "CEO", "9000", "NULL", "10"],
    ["이개발", "MANAGER", "6000", "NULL", "10"],
    ["박영업", "MANAGER", "6000", "500", "20"],
    ["최코드", "DEV", "4000", "NULL", "10"],
    ["정코드", "DEV", "4000", "NULL", "10"],
    ["한세일", "SALES", "3500", "300", "20"],
    ["윤세일", "SALES", "3000", "0", "20"],
    ["강신입", "DEV", "3000", "NULL", "10"],
    ["조미정", "SALES", "2800", "NULL", "NULL"],
    ["서인턴", "DEV", "NULL", "NULL", "10"],
  ],
};

export const MATERIALS: Material[] = [
  {
    id: "groupby",
    title: "GROUP BY와 HAVING",
    subject: "2과목 · SQL 기본 및 활용",
    chapter: "2장 3절",
    minutes: 25,
    sections: [
      {
        id: "intro",
        title: "인트로",
        blocks: [
          { kind: "h2", text: "이 단원에서 배우는 것" },
          {
            kind: "ul",
            items: [
              "COUNT(*)와 COUNT(컬럼)이 왜 서로 다른 값을 내는지 설명할 수 있어요.",
              "GROUP BY를 쓸 때 SELECT에 무엇을 쓸 수 있고 무엇을 쓸 수 없는지 구분할 수 있어요.",
              "WHERE와 HAVING이 각각 언제 행을 거르는지 처리 순서로 설명할 수 있어요.",
              "조건에 맞는 행이 하나도 없을 때 결과가 0인지, NULL인지, 아예 나오지 않는지 예측할 수 있어요.",
            ],
          },
          { kind: "h2", text: "개념 한눈에 보기" },
          {
            kind: "table",
            head: ["개념", "한 줄 정리"],
            rows: [
              ["집계 함수와 NULL", "COUNT(*)만 NULL이 있는 행도 세요. 나머지 집계 함수는 NULL을 빼고 계산해요"],
              ["GROUP BY 규칙", "같은 값끼리 묶어서 그룹마다 한 행을 만들어요. SELECT에는 묶은 컬럼과 집계 함수만 쓸 수 있어요"],
              ["WHERE와 HAVING", "WHERE는 묶기 전에 행을 거르고, HAVING은 묶은 뒤에 그룹을 걸러요"],
              ["공집합 집계", "대상 행이 없을 때, GROUP BY가 없으면 한 행이 나오고 GROUP BY가 있으면 아무 행도 나오지 않아요"],
            ],
          },
          { kind: "h2", text: "이 단원에서 쓰는 데이터" },
          { kind: "p", text: "이 단원의 예제는 모두 사원 테이블 `EMP`를 써요. 아래는 이 단원에 필요한 컬럼만 뽑은 거예요." },
          EMP_TABLE,
          { kind: "p", text: "시험에 자주 나오는 함정이 데이터에 일부러 들어 있어요. 아래 세 사람을 기억해 두면 예제를 따라가기 쉬워요." },
          {
            kind: "ul",
            items: [
              "**서인턴**은 급여(SAL)가 NULL이에요. 아직 급여가 정해지지 않았다고 생각하면 돼요.",
              "**윤세일**은 수당(COMM)이 0이에요. NULL과 달리 0은 \"값이 있다\"는 뜻이에요.",
              "**조미정**은 부서(DEPTNO)가 NULL이에요. 아직 부서에 배치되지 않았어요.",
            ],
          },
          { kind: "p", text: "부서 30(기획)도 있지만, 30번 부서에 속한 사원은 한 명도 없어요." },
        ],
      },
      {
        id: "agg",
        title: "1. 집계 함수와 NULL",
        concept: "agg_null",
        blocks: [
          { kind: "p", text: "집계 함수는 여러 행을 받아서 값 하나로 돌려주는 함수예요. COUNT, SUM, AVG, MAX, MIN이 대표적이에요." },
          { kind: "p", text: "규칙은 하나만 기억하면 돼요. **COUNT(*)를 빼면 모든 집계 함수가 NULL을 무시해요.** COUNT(*)는 \"행이 몇 개인가\"를 세기 때문에, 값이 NULL이어도 행이 있으면 세요." },
          { kind: "p", text: "먼저 개수를 세 볼게요." },
          { kind: "code", text: "SELECT COUNT(*)            AS C_ALL,\n       COUNT(SAL)          AS C_SAL,\n       COUNT(COMM)         AS C_COMM,\n       COUNT(DISTINCT JOB) AS C_JOB\nFROM EMP;" },
          { kind: "table", head: ["C_ALL", "C_SAL", "C_COMM", "C_JOB"], rows: [["10", "9", "3", "4"]] },
          { kind: "p", text: "하나씩 따라가 볼게요." },
          {
            kind: "ol",
            items: [
              "`COUNT(*)`는 행 수예요. 사원이 10명이라 10이에요.",
              "`COUNT(SAL)`은 SAL이 NULL이 아닌 행만 세요. 서인턴이 빠져서 9예요.",
              "`COUNT(COMM)`은 COMM이 NULL이 아닌 행만 세요. 박영업(500), 한세일(300), 윤세일(0)이 남아서 3이에요. **0은 NULL이 아니라서 세요.**",
              "`COUNT(DISTINCT JOB)`은 겹치지 않는 직무 수예요. CEO, MANAGER, DEV, SALES로 4예요.",
            ],
          },
          { kind: "p", text: "이번에는 합계와 평균을 구해 볼게요." },
          { kind: "code", text: "SELECT SUM(COMM)            AS S_COMM,\n       ROUND(AVG(COMM), 1)  AS A_COMM,\n       AVG(NVL(COMM, 0))    AS A_NVL\nFROM EMP;" },
          { kind: "table", head: ["S_COMM", "A_COMM", "A_NVL"], rows: [["800", "266.7", "80"]] },
          {
            kind: "ol",
            items: [
              "`SUM(COMM)`은 NULL을 빼고 더해요. 500 + 300 + 0 = 800이에요.",
              "`AVG(COMM)`은 나누는 수에서도 NULL을 빼요. 그래서 10으로 나누지 않고, 값이 있는 3명으로 나눠요. 800 ÷ 3 = 266.7이에요.",
              "`NVL(COMM, 0)`은 NULL을 0으로 바꿔요. 그러면 10명 모두 값이 생겨서 800 ÷ 10 = 80이 돼요. \"수당이 없는 사람도 0으로 치고 평균을 내고 싶다\"면 이렇게 써요.",
            ],
          },
        ],
      },
      {
        id: "group",
        title: "2. GROUP BY 규칙",
        concept: "groupby_rule",
        blocks: [
          { kind: "p", text: "GROUP BY는 지정한 컬럼의 값이 같은 행끼리 묶어서, **그룹마다 한 행**을 만들어요. 부서별 인원과 급여를 구해 볼게요." },
          { kind: "code", text: "SELECT DEPTNO,\n       COUNT(*)            AS CNT,\n       SUM(SAL)            AS SUM_SAL,\n       ROUND(AVG(SAL), 1)  AS AVG_SAL\nFROM EMP\nGROUP BY DEPTNO\nORDER BY DEPTNO;" },
          { kind: "table", head: ["DEPTNO", "CNT", "SUM_SAL", "AVG_SAL"], rows: [["10", "6", "26000", "5200"], ["20", "3", "12500", "4166.7"], ["NULL", "1", "2800", "2800"]] },
          {
            kind: "ol",
            items: [
              "10번 부서는 6명이에요. 그런데 평균은 26000 ÷ 6이 아니라 26000 ÷ 5 = 5200이에요. 서인턴의 급여가 NULL이라서 나누는 수에서 빠졌어요.",
              "부서가 NULL인 조미정은 버려지지 않아요. GROUP BY는 NULL끼리도 같은 그룹으로 묶기 때문에, **NULL 그룹**이 한 행 생겨요.",
              "30번 부서는 결과에 나오지 않아요. EMP에 30번 부서 사원이 한 명도 없어서 묶을 행이 없기 때문이에요.",
            ],
          },
          { kind: "h3", text: "SELECT에 쓸 수 있는 것" },
          { kind: "p", text: "그룹이 한 행으로 줄었기 때문에, SELECT에는 그룹마다 값이 하나로 정해지는 것만 쓸 수 있어요." },
          { kind: "table", head: ["쓸 수 있어요", "쓸 수 없어요"], rows: [["GROUP BY에 쓴 컬럼 (DEPTNO)", "GROUP BY에 쓰지 않은 컬럼 (ENAME)"], ["집계 함수 (COUNT, SUM 등)", ""], ["상수 (예: 'A')", ""]] },
          { kind: "p", text: "예를 들어 아래 SQL은 오류가 나요. 10번 부서에는 김대표, 이개발, 최코드 등 6명이 있는데, 한 행에 이름을 하나만 보여 줄 수는 없기 때문이에요." },
          { kind: "code", text: "-- 오류 (ORA-00979)\nSELECT DEPTNO, ENAME\nFROM EMP\nGROUP BY DEPTNO;" },
          { kind: "p", text: "또 하나 자주 나오는 함정이 있어요. **GROUP BY에는 SELECT에서 붙인 별칭을 쓸 수 없어요.** SQL은 GROUP BY를 SELECT보다 먼저 처리하기 때문에, GROUP BY를 처리하는 시점에는 아직 별칭이 없어요." },
          { kind: "code", text: "-- 오류: D라는 별칭은 아직 없어요\nSELECT DEPTNO AS D, COUNT(*)\nFROM EMP\nGROUP BY D;" },
        ],
      },
      {
        id: "having",
        title: "3. WHERE와 HAVING",
        concept: "where_having",
        blocks: [
          { kind: "p", text: "WHERE와 HAVING은 둘 다 조건을 걸지만, **거르는 시점**이 달라요. SQL은 아래 순서로 처리돼요." },
          { kind: "table", head: ["순서", "절", "하는 일"], rows: [["1", "FROM", "테이블을 가져와요"], ["2", "**WHERE**", "행을 걸러요 (묶기 전)"], ["3", "GROUP BY", "그룹으로 묶어요"], ["4", "**HAVING**", "그룹을 걸러요 (묶은 뒤)"], ["5", "SELECT", "보여 줄 컬럼을 골라요"], ["6", "ORDER BY", "정렬해요"]] },
          { kind: "p", text: "WHERE를 처리하는 시점에는 아직 그룹이 없어서 SUM이나 AVG 값도 없어요. 그래서 **집계 함수를 쓰는 조건은 WHERE에 쓸 수 없고, HAVING에 써야 해요.** WHERE에 쓰면 ORA-00934 오류가 나요." },
          { kind: "p", text: "두 조건을 함께 써 볼게요. \"10번 부서에서, 직무별 평균 급여가 4000 이상인 직무\"를 구하는 SQL이에요." },
          { kind: "code", text: "SELECT JOB, AVG(SAL) AS AVG_SAL\nFROM EMP\nWHERE DEPTNO = 10          -- ① 10번 부서 행만\nGROUP BY JOB               -- ② 직무별로 묶기\nHAVING AVG(SAL) >= 4000    -- ③ 평균 4000 이상만\nORDER BY JOB;" },
          { kind: "table", head: ["JOB", "AVG_SAL"], rows: [["CEO", "9000"], ["MANAGER", "6000"]] },
          {
            kind: "ol",
            items: [
              "**WHERE:** 10번 부서 6명만 남아요. 박영업도 MANAGER지만 20번 부서라서 여기서 빠져요.",
              "**GROUP BY:** 남은 6명을 직무로 묶어요. CEO는 김대표(9000), MANAGER는 이개발(6000), DEV는 최코드(4000), 정코드(4000), 강신입(3000), 서인턴(NULL)이에요.",
              "**HAVING:** DEV의 평균은 서인턴을 빼고 11000 ÷ 3 = 3666.7이에요. 4000보다 작아서 빠지고, CEO와 MANAGER만 남아요.",
            ],
          },
          { kind: "p", text: "**GROUP BY 없이 HAVING만 쓰면** 테이블 전체가 그룹 하나가 돼요." },
          { kind: "code", text: "SELECT COUNT(*) AS CNT, MAX(SAL) AS MX\nFROM EMP\nHAVING MAX(SAL) > 5000;" },
          { kind: "table", head: ["CNT", "MX"], rows: [["10", "9000"]] },
          { kind: "p", text: "전체에서 가장 높은 급여가 9000이라서 조건을 통과하고, 한 행이 나와요. 조건을 `COUNT(*) > 100`으로 바꾸면 그룹 하나가 통째로 빠져서 아무 행도 나오지 않아요." },
        ],
      },
      {
        id: "empty",
        title: "4. 공집합 집계",
        concept: "empty_agg",
        blocks: [
          { kind: "p", text: "공집합은 조건에 맞는 행이 하나도 없는 경우를 말해요. 시험에 자주 나오는 주제예요. 사원이 없는 30번 부서로 확인해 볼게요." },
          { kind: "h3", text: "GROUP BY가 없을 때" },
          { kind: "code", text: "SELECT COUNT(*)   AS CNT,\n       COUNT(SAL) AS CNT_SAL,\n       SUM(SAL)   AS SUM_SAL,\n       MAX(SAL)   AS MAX_SAL\nFROM EMP\nWHERE DEPTNO = 30;" },
          { kind: "table", head: ["CNT", "CNT_SAL", "SUM_SAL", "MAX_SAL"], rows: [["0", "0", "NULL", "NULL"]] },
          { kind: "p", text: "GROUP BY가 없으면 \"전체가 그룹 하나\"예요. 그래서 대상 행이 0개여도 결과는 **한 행**이 나와요. COUNT는 셀 것이 없으니 0이고, SUM과 MAX는 계산할 값이 없으니 NULL이에요." },
          { kind: "h3", text: "GROUP BY가 있을 때" },
          { kind: "code", text: "SELECT DEPTNO, COUNT(*) AS CNT\nFROM EMP\nWHERE DEPTNO = 30\nGROUP BY DEPTNO;" },
          { kind: "table", head: ["DEPTNO", "CNT"], rows: [] },
          { kind: "p", text: "결과가 **0행**이에요. 묶을 행이 없어서 그룹 자체가 만들어지지 않았어요. 그래서 \"CNT가 0인 행\"도 나오지 않아요." },
          { kind: "h3", text: "NULL 대신 0을 받고 싶을 때" },
          { kind: "table", head: ["SQL", "결과", "이유"], rows: [["`NVL(SUM(SAL), 0)`", "0", "SUM 결과인 NULL을 0으로 바꿔요"], ["`SUM(NVL(SAL, 0))`", "NULL", "0으로 바꿀 행 자체가 없어서, SUM은 여전히 NULL이에요"]] },
          { kind: "p", text: "NVL을 SUM의 **바깥**에 써야 0을 받을 수 있어요." },
        ],
      },
      {
        id: "myths",
        title: "자주 하는 오해",
        blocks: [
          {
            kind: "table",
            head: ["오해", "실제"],
            rows: [
              ["AVG(COMM)은 전체 인원으로 나눈다", "값이 있는 행 수로 나눠요. 800 ÷ 10이 아니라 800 ÷ 3 = 266.7이에요"],
              ["COUNT(COMM)은 0도 빼고 센다", "0은 값이에요. NULL만 빠져요. 그래서 윤세일도 세요"],
              ["SUM(SAL + COMM)과 SUM(SAL) + SUM(COMM)은 같다", "달라요. COMM이 NULL인 사원은 SAL + COMM도 NULL이 돼서 통째로 빠져요"],
              ["집계 함수 조건도 WHERE에 쓸 수 있다", "WHERE를 처리할 때는 아직 집계 값이 없어요. HAVING에 써야 해요"],
              ["행이 없으면 SUM은 0이다", "NULL이에요. GROUP BY가 있으면 아예 행이 나오지 않아요"],
            ],
          },
        ],
      },
    ],
  },
  {
    id: "join",
    title: "JOIN 기본",
    subject: "2과목 · SQL 기본 및 활용",
    chapter: "2장 5절",
    minutes: 30,
    sections: [
      {
        id: "intro",
        title: "인트로",
        blocks: [
          { kind: "h2", text: "이 단원에서 배우는 것" },
          {
            kind: "ul",
            items: [
              "INNER JOIN이 어떤 행만 남기는지 설명할 수 있어요.",
              "LEFT OUTER JOIN에서 짝이 없는 행이 어떻게 표시되는지 예측할 수 있어요.",
              "ON 조건과 WHERE 조건의 차이를 OUTER JOIN 결과로 설명할 수 있어요.",
            ],
          },
          {
            kind: "table",
            caption: "DEPT",
            head: ["DEPTNO", "DNAME"],
            rows: [["10", "경영"], ["20", "영업"], ["30", "개발"], ["40", "기획"]],
          },
        ],
      },
      {
        id: "inner",
        title: "1. INNER JOIN",
        concept: "inner_join",
        blocks: [
          { kind: "p", text: "INNER JOIN은 두 테이블에서 조인 조건이 맞는 행끼리만 붙여요. 짝이 없는 행은 결과에서 사라져요." },
          { kind: "code", text: "SELECT E.ENAME, D.DNAME\n  FROM EMP E INNER JOIN DEPT D\n    ON E.DEPTNO = D.DEPTNO;" },
          { kind: "p", text: "DEPT의 40번(기획)은 소속 사원이 없어서 결과에 나오지 않아요." },
        ],
      },
      {
        id: "outer",
        title: "2. OUTER JOIN",
        concept: "outer_join",
        blocks: [
          { kind: "p", text: "LEFT OUTER JOIN은 왼쪽 테이블의 행을 모두 남기고, 오른쪽에 짝이 없으면 오른쪽 컬럼을 NULL로 채워요." },
          { kind: "code", text: "SELECT D.DNAME, E.ENAME\n  FROM DEPT D LEFT OUTER JOIN EMP E\n    ON D.DEPTNO = E.DEPTNO;" },
          { kind: "p", text: "기획(40)은 사원이 없지만 결과에 남고, ENAME은 NULL로 나와요." },
        ],
      },
      {
        id: "order",
        title: "3. ON과 WHERE의 차이",
        concept: "join_order",
        blocks: [
          { kind: "p", text: "OUTER JOIN에서 오른쪽 테이블 조건을 ON에 쓰면 '붙일 때의 조건'이 되고, WHERE에 쓰면 '붙인 뒤에 거르는 조건'이 돼요." },
          { kind: "callout", text: "자주 혼동 · LEFT JOIN 뒤 WHERE E.JOB = 'DEV'를 쓰면 짝이 없어 NULL이 된 행도 걸러져서, 결과가 INNER JOIN과 같아져요." },
        ],
      },
    ],
  },
];

export function getMaterial(id: string) {
  return MATERIALS.find((m) => m.id === id);
}

/** Flattens a material to plain text so the agent can ground its answers in it. */
export function materialToText(m: Material) {
  return m.sections
    .map((s) => {
      const body = s.blocks
        .map((b) => {
          if (b.kind === "ul") return b.items.map((i) => `- ${i}`).join("\n");
          if (b.kind === "ol") return b.items.map((i, n) => `${n + 1}. ${i}`).join("\n");
          if (b.kind === "table") return [b.caption ?? "", b.head.join(" | "), ...b.rows.map((r) => r.join(" | "))].join("\n");
          return b.text;
        })
        .join("\n");
      return `## ${s.title}\n${body}`;
    })
    .join("\n\n");
}
