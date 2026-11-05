export type ErrorTag = "개념 부족" | "개념 혼동" | "조건 누락" | "실행 순서 오류" | "암기 오류" | "찍어서 맞힘" | "낮은 확신";

export type Option = { text: string; tag?: ErrorTag; why?: string };

export type Question = {
  id: string;
  concept: string;
  type: "객관식" | "OX";
  level: 1 | 2 | 3;
  /** Questions in the same family test the same principle with different data — used for 재출제. */
  family: string;
  stem: string;
  code?: string;
  options: Option[];
  answer: number;
  hints: [string, string];
  explanation: string;
};

export const QUESTIONS: Question[] = [
  {
    id: "q-agg-1",
    concept: "agg_null",
    type: "객관식",
    level: 1,
    family: "agg-count",
    stem: "EMP 테이블에서 아래 쿼리의 결과로 옳은 것은?",
    code: "SELECT COUNT(*), COUNT(COMM) FROM EMP;",
    options: [
      { text: "6, 6", tag: "개념 부족", why: "COUNT(컬럼)도 NULL을 센다고 생각했어요." },
      { text: "6, 2" },
      { text: "2, 2", tag: "개념 혼동", why: "COUNT(*)도 NULL 행을 뺀다고 생각했어요." },
      { text: "6, 4", tag: "조건 누락", why: "NULL이 아닌 COMM 개수를 잘못 셌어요." },
    ],
    answer: 1,
    hints: ["COUNT(*)는 무엇을 세고, COUNT(COMM)은 무엇을 셀까요?", "COMM이 NULL이 아닌 사원은 박영업, 정분석 두 명이에요."],
    explanation: "COUNT(*)는 행 수 6을 세고, COUNT(COMM)은 NULL을 빼고 2를 셉니다.",
  },
  {
    id: "q-agg-2",
    concept: "agg_null",
    type: "객관식",
    level: 2,
    family: "agg-count",
    stem: "COMM 값이 (500, 300, NULL, NULL, NULL, NULL)일 때 AVG(COMM)의 결과는?",
    options: [
      { text: "133.33", tag: "개념 혼동", why: "NULL 행을 분모에 포함했어요." },
      { text: "NULL", tag: "개념 부족", why: "NULL이 하나라도 있으면 결과가 NULL이라고 생각했어요." },
      { text: "400" },
      { text: "800", tag: "개념 혼동", why: "AVG와 SUM을 혼동했어요." },
    ],
    answer: 2,
    hints: ["AVG는 NULL을 어떻게 다룰까요? 분모도 생각해 보세요.", "NULL이 아닌 값은 500, 300 두 개뿐이에요."],
    explanation: "집계 함수는 NULL을 빼고 계산하므로 (500+300)/2 = 400입니다.",
  },
  {
    id: "q-grp-1",
    concept: "groupby_rule",
    type: "객관식",
    level: 1,
    family: "grp-select",
    stem: "다음 중 오류가 발생하는 SQL은?",
    options: [
      { text: "SELECT DEPTNO, COUNT(*) FROM EMP GROUP BY DEPTNO;", tag: "개념 부족" },
      { text: "SELECT DEPTNO, ENAME, MAX(SAL) FROM EMP GROUP BY DEPTNO;" },
      { text: "SELECT COUNT(*) FROM EMP GROUP BY DEPTNO;", tag: "개념 혼동", why: "GROUP BY 컬럼을 SELECT에 꼭 써야 한다고 생각했어요." },
      { text: "SELECT DEPTNO, SUM(SAL) FROM EMP GROUP BY DEPTNO;", tag: "개념 부족" },
    ],
    answer: 1,
    hints: ["그룹마다 한 행만 나와요. 각 SELECT 항목이 그룹당 값 하나로 정해지나요?", "부서 10에는 ENAME이 세 개 있어요."],
    explanation: "ENAME은 GROUP BY에도 없고 집계 함수도 아니라서 그룹당 값을 정할 수 없어 오류입니다.",
  },
  {
    id: "q-grp-2",
    concept: "groupby_rule",
    type: "OX",
    level: 2,
    family: "grp-alias",
    stem: "SELECT DEPTNO AS D, COUNT(*) FROM EMP GROUP BY D; 는 오라클에서 정상 실행된다.",
    options: [{ text: "O", tag: "실행 순서 오류", why: "GROUP BY가 SELECT보다 먼저 처리되는 걸 놓쳤어요." }, { text: "X" }],
    answer: 1,
    hints: ["GROUP BY와 SELECT 중 무엇이 먼저 처리될까요?", "별칭은 SELECT에서 만들어져요."],
    explanation: "GROUP BY가 SELECT보다 먼저 처리되므로 SELECT의 별칭을 GROUP BY에서 쓸 수 없습니다.",
  },
  {
    id: "q-hav-1",
    concept: "where_having",
    type: "객관식",
    level: 1,
    family: "hav-where",
    stem: "부서별 급여 합이 9000을 넘는 부서만 조회하려고 한다. 빈칸에 들어갈 절은?",
    code: "SELECT DEPTNO, SUM(SAL) FROM EMP\n GROUP BY DEPTNO\n ____ SUM(SAL) > 9000;",
    options: [
      { text: "WHERE", tag: "개념 혼동", why: "WHERE와 HAVING의 역할을 혼동했어요." },
      { text: "HAVING" },
      { text: "ORDER BY", tag: "개념 부족" },
      { text: "ON", tag: "개념 부족" },
    ],
    answer: 1,
    hints: ["조건에 집계 함수 SUM이 들어 있어요.", "묶은 뒤에 그룹을 거르는 절은 무엇일까요?"],
    explanation: "집계 함수 조건은 그룹을 만든 뒤에 적용해야 하므로 HAVING을 씁니다.",
  },
  {
    id: "q-hav-2",
    concept: "where_having",
    type: "객관식",
    level: 2,
    family: "hav-where",
    stem: "아래 SQL의 결과 행 수는?",
    code: "SELECT DEPTNO, SUM(SAL)\n  FROM EMP\n WHERE JOB <> 'CEO'\n GROUP BY DEPTNO\nHAVING SUM(SAL) > 9000;",
    options: [
      { text: "1", tag: "실행 순서 오류", why: "WHERE보다 HAVING이 먼저 적용된다고 생각했어요." },
      { text: "2" },
      { text: "3", tag: "조건 누락", why: "HAVING 조건을 놓쳤어요." },
      { text: "0", tag: "개념 혼동" },
    ],
    answer: 1,
    hints: ["처리 순서: FROM → WHERE → GROUP BY → HAVING. CEO를 먼저 빼 보세요.", "CEO를 뺀 부서별 합: 10번 10000, 20번 10500, 30번 3000"],
    explanation: "CEO를 제외한 뒤 합이 9000을 넘는 부서는 10번(10000), 20번(10500) 두 개입니다.",
  },
  {
    id: "q-hav-3",
    concept: "where_having",
    type: "OX",
    level: 1,
    family: "hav-where-ox",
    stem: "WHERE 절에는 집계 함수를 조건으로 사용할 수 없다.",
    options: [{ text: "O" }, { text: "X", tag: "개념 혼동", why: "WHERE도 집계 조건을 쓸 수 있다고 생각했어요." }],
    answer: 0,
    hints: ["WHERE는 묶기 전에 행 하나하나를 걸러요.", "행 하나에는 SUM 같은 그룹 값이 아직 없어요."],
    explanation: "WHERE는 그룹이 만들어지기 전에 실행되므로 집계 함수를 쓸 수 없습니다.",
  },
  {
    id: "q-emp-1",
    concept: "empty_agg",
    type: "객관식",
    level: 2,
    family: "empty",
    stem: "EMP에 DEPTNO = 99인 행은 없다. 아래 SQL의 결과는?",
    code: "SELECT COUNT(*), SUM(SAL) FROM EMP WHERE DEPTNO = 99;",
    options: [
      { text: "결과 행 없음", tag: "개념 혼동", why: "GROUP BY가 있을 때의 동작과 혼동했어요." },
      { text: "0, 0", tag: "암기 오류", why: "SUM도 0이 된다고 기억했어요." },
      { text: "0, NULL" },
      { text: "NULL, NULL", tag: "암기 오류", why: "COUNT도 NULL이 된다고 기억했어요." },
    ],
    answer: 2,
    hints: ["GROUP BY가 없으면 전체를 그룹 하나로 봐요. 결과 행은 몇 개일까요?", "공집합에서 COUNT만 0이고, 나머지 집계 함수는 NULL이에요."],
    explanation: "GROUP BY가 없으면 한 행이 나오고, COUNT(*)는 0, SUM은 NULL입니다.",
  },
  {
    id: "q-emp-2",
    concept: "empty_agg",
    type: "OX",
    level: 2,
    family: "empty",
    stem: "SELECT DEPTNO, COUNT(*) FROM EMP WHERE DEPTNO = 99 GROUP BY DEPTNO; 는 (99, 0) 한 행을 반환한다.",
    options: [{ text: "O", tag: "개념 혼동", why: "GROUP BY가 없을 때의 동작과 혼동했어요." }, { text: "X" }],
    answer: 1,
    hints: ["GROUP BY가 있으면 그룹이 만들어져야 행이 나와요.", "DEPTNO = 99인 행이 없으니 만들 그룹도 없어요."],
    explanation: "GROUP BY가 있으면 만들 그룹이 없어서 아무 행도 반환하지 않습니다.",
  },
  {
    id: "q-inner-1",
    concept: "inner_join",
    type: "객관식",
    level: 1,
    family: "inner",
    stem: "EMP(부서 10, 20, 30)와 DEPT(10, 20, 30, 40)를 DEPTNO로 INNER JOIN 했을 때 결과에 나오지 않는 부서는?",
    options: [{ text: "10", tag: "개념 부족" }, { text: "20", tag: "개념 부족" }, { text: "30", tag: "개념 부족" }, { text: "40" }],
    answer: 3,
    hints: ["INNER JOIN은 양쪽에 짝이 있는 행만 남겨요.", "40번 부서에 속한 사원이 있나요?"],
    explanation: "40번 부서는 EMP에 짝이 없어서 INNER JOIN 결과에서 빠집니다.",
  },
  {
    id: "q-outer-1",
    concept: "outer_join",
    type: "객관식",
    level: 2,
    family: "outer",
    stem: "DEPT LEFT OUTER JOIN EMP 결과에서 기획(40) 부서 행의 ENAME 값은?",
    options: [
      { text: "행이 나오지 않는다", tag: "개념 혼동", why: "INNER JOIN과 혼동했어요." },
      { text: "NULL" },
      { text: "빈 문자열", tag: "개념 부족" },
      { text: "0", tag: "개념 부족" },
    ],
    answer: 1,
    hints: ["LEFT OUTER JOIN은 왼쪽 테이블의 행을 모두 남겨요.", "짝이 없는 오른쪽 컬럼은 무엇으로 채워질까요?"],
    explanation: "왼쪽(DEPT) 행은 모두 남고, 짝이 없는 EMP 컬럼은 NULL로 채워집니다.",
  },
  {
    id: "q-order-1",
    concept: "join_order",
    type: "OX",
    level: 3,
    family: "join-where",
    stem: "DEPT D LEFT JOIN EMP E ON D.DEPTNO = E.DEPTNO WHERE E.JOB = 'DEV' 의 결과에는 기획(40) 부서가 포함된다.",
    options: [{ text: "O", tag: "실행 순서 오류", why: "WHERE가 조인 뒤에 적용되는 걸 놓쳤어요." }, { text: "X" }],
    answer: 1,
    hints: ["WHERE는 조인을 마친 뒤에 적용돼요.", "기획(40) 행의 E.JOB은 NULL이에요. NULL = 'DEV'는 참일까요?"],
    explanation: "조인 후 WHERE에서 E.JOB이 NULL인 행이 걸러지므로 기획 부서는 빠집니다.",
  },
];

export function questionsFor(concept: string) {
  return QUESTIONS.filter((q) => q.concept === concept);
}

export function getQuestion(id: string) {
  return QUESTIONS.find((q) => q.id === id);
}

/** A different question that tests the same principle, preferring the same family. */
export function variantOf(q: Question, exclude: string[] = []) {
  const pool = QUESTIONS.filter((x) => x.id !== q.id && !exclude.includes(x.id));
  return pool.find((x) => x.family === q.family) ?? pool.find((x) => x.concept === q.concept);
}

export const DIAGNOSIS_SET = ["q-agg-1", "q-grp-1", "q-hav-1", "q-emp-1", "q-inner-1", "q-outer-1"];
