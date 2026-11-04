export type Block =
  | { kind: "h2"; text: string }
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
    ["정분석", "DEV", "4500", "300", "20"],
    ["한신입", "DEV", "3000", "NULL", "30"],
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
              ["집계 함수와 NULL", "COUNT(*)만 NULL이 있는 행도 세요. 나머지 집계 함수는 NULL을 빼고 계산해요."],
              ["GROUP BY 규칙", "같은 값끼리 묶어서 그룹마다 한 행을 만들어요. SELECT에는 묶은 컬럼과 집계 함수만 쓸 수 있어요."],
              ["WHERE와 HAVING", "WHERE는 묶기 전에 행을 거르고, HAVING은 묶은 뒤에 그룹을 걸러요."],
              ["공집합 집계", "대상 행이 없을 때, GROUP BY가 없으면 한 행이 나오고 GROUP BY가 있으면 아무 행도 나오지 않아요."],
            ],
          },
          { kind: "h2", text: "이 단원에서 쓰는 데이터" },
          { kind: "p", text: "이 단원의 예제는 모두 사원 테이블 EMP를 써요. 아래는 이 단원에 필요한 컬럼만 뽑은 거예요." },
          EMP_TABLE,
        ],
      },
      {
        id: "agg",
        title: "1. 집계 함수와 NULL",
        concept: "agg_null",
        blocks: [
          { kind: "p", text: "집계 함수는 여러 행을 받아 값 하나를 돌려주는 함수예요. COUNT, SUM, AVG, MAX, MIN이 대표적이에요." },
          { kind: "p", text: "핵심은 NULL 처리예요. COUNT(*)는 행 자체를 세기 때문에 NULL이 있어도 셉니다. 반면 COUNT(COMM), SUM(COMM), AVG(COMM)은 COMM이 NULL인 행을 빼고 계산해요." },
          { kind: "code", text: "SELECT COUNT(*), COUNT(COMM), AVG(COMM)\n  FROM EMP;\n-- 결과: 6, 2, 400" },
          { kind: "callout", text: "시험 포인트 · AVG(COMM)은 (500+300)/6이 아니라 (500+300)/2 = 400이에요. NULL인 행은 분모에서도 빠져요." },
        ],
      },
      {
        id: "group",
        title: "2. GROUP BY 규칙",
        concept: "groupby_rule",
        blocks: [
          { kind: "p", text: "GROUP BY는 지정한 컬럼의 값이 같은 행끼리 묶어서, 그룹마다 결과 한 행을 만들어요." },
          { kind: "code", text: "SELECT DEPTNO, COUNT(*), MAX(SAL)\n  FROM EMP\n GROUP BY DEPTNO;" },
          { kind: "p", text: "그룹마다 한 행만 나오기 때문에, SELECT에는 GROUP BY에 쓴 컬럼이나 집계 함수만 올 수 있어요. 예를 들어 위 쿼리에 ENAME을 추가하면 부서 10에 이름이 세 개인데 어느 이름을 보여줄지 정할 수 없어서 오류가 나요." },
          { kind: "callout", text: "시험 포인트 · GROUP BY 절에는 SELECT의 별칭(ALIAS)을 쓸 수 없어요. GROUP BY가 SELECT보다 먼저 처리되기 때문이에요." },
        ],
      },
      {
        id: "having",
        title: "3. WHERE와 HAVING",
        concept: "where_having",
        blocks: [
          { kind: "p", text: "둘 다 조건으로 거르지만, 거르는 시점이 달라요. SQL은 FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY 순서로 처리돼요." },
          {
            kind: "ul",
            items: [
              "WHERE: 묶기 전에 행 하나하나를 걸러요. 집계 함수를 조건으로 쓸 수 없어요.",
              "HAVING: 묶은 뒤에 그룹을 걸러요. SUM(SAL) > 10000 같은 집계 조건을 쓸 수 있어요.",
            ],
          },
          { kind: "code", text: "SELECT DEPTNO, SUM(SAL)\n  FROM EMP\n WHERE JOB <> 'CEO'\n GROUP BY DEPTNO\nHAVING SUM(SAL) > 9000;" },
          { kind: "p", text: "위 쿼리는 CEO를 먼저 빼고(WHERE), 부서별로 묶은 뒤(GROUP BY), 급여 합이 9000을 넘는 부서만 남겨요(HAVING). 결과는 10번 부서(10000)와 20번 부서(10500)예요." },
          { kind: "callout", text: "자주 혼동 · 집계 함수가 들어간 조건은 반드시 HAVING에 써요. WHERE SUM(SAL) > 9000은 오류예요." },
        ],
      },
      {
        id: "empty",
        title: "4. 공집합 집계",
        concept: "empty_agg",
        blocks: [
          { kind: "p", text: "WHERE 조건에 맞는 행이 하나도 없으면 어떻게 될까요? GROUP BY가 있는지에 따라 달라져요." },
          { kind: "code", text: "SELECT COUNT(*), SUM(SAL) FROM EMP WHERE DEPTNO = 99;\n-- 결과: 한 행 (0, NULL)\n\nSELECT DEPTNO, COUNT(*) FROM EMP WHERE DEPTNO = 99 GROUP BY DEPTNO;\n-- 결과: 행 없음" },
          { kind: "p", text: "GROUP BY가 없으면 전체를 하나의 그룹으로 보기 때문에 결과가 한 행 나와요. 이때 COUNT는 0, SUM·MAX 같은 나머지 함수는 NULL이에요. GROUP BY가 있으면 만들 그룹 자체가 없어서 아무 행도 나오지 않아요." },
          { kind: "callout", text: "시험 포인트 · '공집합에서 COUNT(*)는 0, SUM은 NULL'은 매 회차 단골 선지예요." },
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
          if (b.kind === "table") return [b.caption ?? "", b.head.join(" | "), ...b.rows.map((r) => r.join(" | "))].join("\n");
          return b.text;
        })
        .join("\n");
      return `## ${s.title}\n${body}`;
    })
    .join("\n\n");
}
