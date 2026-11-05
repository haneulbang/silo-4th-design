export type ErrorTag = "개념 부족" | "개념 혼동" | "조건 누락" | "실행 순서 오류" | "암기 오류" | "찍어서 맞힘" | "낮은 확신";

export type Option = { text: string; tag?: ErrorTag; why?: string };

export type QuestionType = "객관식" | "OX" | "빈칸" | "대화형";

/** A key point a spoken-style answer should cover; any keyword counts as covering it. */
export type TalkPoint = { label: string; keywords: string[] };

export type Question = {
  id: string;
  concept: string;
  type: QuestionType;
  level: 1 | 2 | 3;
  /** Questions in the same family test the same principle with different data — used for 재출제. */
  family: string;
  stem: string;
  code?: string;
  options: Option[];
  answer: number;
  hints: [string, string];
  explanation: string;
  /** 빈칸: accepted answers for the ____ in the stem. */
  blank?: string[];
  /** 대화형: points the learner's own explanation should touch. */
  talk?: TalkPoint[];
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
      { text: "10, 10", tag: "개념 부족", why: "COUNT(컬럼)도 NULL을 센다고 생각했어요." },
      { text: "10, 3" },
      { text: "3, 3", tag: "개념 혼동", why: "COUNT(*)도 NULL 행을 뺀다고 생각했어요." },
      { text: "10, 2", tag: "개념 혼동", why: "수당이 0인 윤세일을 NULL처럼 뺐어요." },
    ],
    answer: 1,
    hints: ["COUNT(*)는 무엇을 세고, COUNT(COMM)은 무엇을 셀까요?", "COMM이 NULL이 아닌 사원은 박영업(500), 한세일(300), 윤세일(0) 세 명이에요. 0도 값이에요."],
    explanation: "COUNT(*)는 행 수 10을 세고, COUNT(COMM)은 NULL을 빼고 3을 셉니다. 수당이 0인 윤세일도 값이 있어서 셉니다.",
  },
  {
    id: "q-agg-2",
    concept: "agg_null",
    type: "객관식",
    level: 2,
    family: "agg-count",
    stem: "EMP의 COMM 값은 500, 300, 0과 NULL 7개다. AVG(COMM)의 결과는? (소수 첫째 자리까지)",
    options: [
      { text: "80", tag: "개념 혼동", why: "NULL 행을 분모에 포함했어요." },
      { text: "NULL", tag: "개념 부족", why: "NULL이 하나라도 있으면 결과가 NULL이라고 생각했어요." },
      { text: "266.7" },
      { text: "400", tag: "개념 혼동", why: "수당이 0인 행을 NULL처럼 빼고 2로 나눴어요." },
    ],
    answer: 2,
    hints: ["AVG는 NULL을 어떻게 다룰까요? 분모도 생각해 보세요.", "NULL이 아닌 값은 500, 300, 0 세 개예요. 0도 값이에요."],
    explanation: "집계 함수는 NULL을 빼고 계산하므로 (500 + 300 + 0) ÷ 3 = 266.7입니다. 0은 NULL이 아니라서 분모에 들어갑니다.",
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
    hints: ["그룹마다 한 행만 나와요. 각 SELECT 항목이 그룹당 값 하나로 정해지나요?", "부서 10에는 ENAME이 여섯 개 있어요."],
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
    hints: ["처리 순서: FROM → WHERE → GROUP BY → HAVING. CEO를 먼저 빼 보세요.", "CEO를 뺀 부서별 합: 10번 17000, 20번 12500, 부서가 NULL인 그룹 2800"],
    explanation: "CEO를 제외한 뒤 합이 9000을 넘는 그룹은 10번(17000), 20번(12500) 두 개입니다. 부서가 NULL인 그룹(2800)은 HAVING에서 빠집니다.",
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
    stem: "EMP에 30번 부서 사원은 한 명도 없다. 아래 SQL의 결과는?",
    code: "SELECT COUNT(*), SUM(SAL) FROM EMP WHERE DEPTNO = 30;",
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
    stem: "SELECT DEPTNO, COUNT(*) FROM EMP WHERE DEPTNO = 30 GROUP BY DEPTNO; 는 (30, 0) 한 행을 반환한다.",
    options: [{ text: "O", tag: "개념 혼동", why: "GROUP BY가 없을 때의 동작과 혼동했어요." }, { text: "X" }],
    answer: 1,
    hints: ["GROUP BY가 있으면 그룹이 만들어져야 행이 나와요.", "30번 부서 사원이 없으니 만들 그룹도 없어요."],
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

/** Fill-in and explain-it-yourself questions, one of each per concept. */
const PRACTICE: Question[] = [
  {
    id: "b-agg-1", concept: "agg_null", type: "빈칸", level: 1, family: "agg-count", options: [], answer: -1,
    stem: "COUNT(*)는 NULL을 포함한 모든 행을 세고, COUNT(컬럼)은 ____이 아닌 값만 센다.",
    blank: ["NULL", "널"],
    hints: ["COMM 컬럼에서 COUNT가 빼고 세는 값은 무엇일까요?", "값이 비어 있는 상태를 SQL에서는 무엇이라고 부를까요?"],
    explanation: "COUNT(컬럼)은 NULL을 빼고 셉니다. 그래서 COUNT(*)는 10, COUNT(COMM)은 3이 나와요.",
  },
  {
    id: "t-agg-1", concept: "agg_null", type: "대화형", level: 2, family: "agg-avg", options: [], answer: -1,
    stem: "AVG(COMM)과 SUM(COMM) / COUNT(*)의 결과가 왜 다른지 내 말로 설명해 보세요.",
    talk: [
      { label: "AVG는 NULL을 빼고 평균을 낸다", keywords: ["null", "널", "제외", "빼"] },
      { label: "COUNT(*)는 NULL 행까지 센다", keywords: ["count(*)", "모든 행", "전체 행", "10"] },
      { label: "그래서 나누는 수(분모)가 달라진다", keywords: ["분모", "나누", "나눠"] },
    ],
    hints: ["두 식에서 나누는 수가 각각 몇인지 세어 보세요.", "AVG(COMM)은 3으로, SUM(COMM)/COUNT(*)는 10으로 나눠요."],
    explanation: "AVG(COMM)은 NULL을 뺀 3건으로 나눠 800 ÷ 3 = 266.7이에요. SUM(COMM)/COUNT(*)는 NULL 행까지 센 10으로 나눠 800 ÷ 10 = 80이 돼요. 분모에 NULL 행이 들어가느냐의 차이예요.",
  },
  {
    id: "b-grp-1", concept: "groupby_rule", type: "빈칸", level: 1, family: "grp-select", options: [], answer: -1,
    stem: "GROUP BY를 쓰면 SELECT 절에는 GROUP BY에 쓴 컬럼이나 ____ 함수만 올 수 있다.",
    blank: ["집계", "그룹", "집계함수", "그룹함수"],
    hints: ["COUNT, SUM, MAX 같은 함수를 묶어서 부르는 이름이에요.", "여러 행을 하나로 모아 계산하는 함수예요."],
    explanation: "GROUP BY 뒤에는 한 그룹이 한 줄이 돼요. 그래서 SELECT에는 그룹 기준 컬럼이나 집계 함수처럼 그룹마다 값이 하나로 정해지는 것만 올 수 있어요.",
  },
  {
    id: "t-grp-1", concept: "groupby_rule", type: "대화형", level: 2, family: "grp-select", options: [], answer: -1,
    stem: "SELECT DEPTNO, ENAME, MAX(SAL) FROM EMP GROUP BY DEPTNO; 가 왜 오류인지 설명해 보세요.",
    talk: [
      { label: "ENAME이 GROUP BY에 없다", keywords: ["ename", "group by에 없", "그룹에 없", "기준에 없"] },
      { label: "한 부서에 이름이 여러 개라 하나로 정할 수 없다", keywords: ["여러", "하나로", "정할 수", "어떤 이름"] },
      { label: "집계 함수로 감싸거나 GROUP BY에 넣어야 한다", keywords: ["집계", "max(ename", "min(ename", "추가", "넣"] },
    ],
    hints: ["DEPTNO 10번 부서에는 사원이 몇 명인가요?", "6명 중 어떤 ENAME을 한 줄에 보여줘야 할까요?"],
    explanation: "부서별로 한 줄이 되는데 10번 부서에는 이름이 여섯 개라 어떤 ENAME을 보여줄지 정할 수 없어요. ENAME을 GROUP BY에 넣거나 MAX(ENAME)처럼 집계 함수로 감싸야 해요.",
  },
  {
    id: "b-hav-1", concept: "where_having", type: "빈칸", level: 1, family: "hav-agg", options: [], answer: -1,
    stem: "그룹으로 묶은 뒤 집계 결과로 거르는 조건은 WHERE가 아니라 ____ 절에 쓴다.",
    blank: ["HAVING", "해빙"],
    hints: ["GROUP BY 바로 뒤에 오는 절이에요.", "H로 시작해요."],
    explanation: "SUM, COUNT 같은 집계 결과로 거르는 조건은 그룹이 만들어진 뒤에 적용되는 HAVING에 써요.",
  },
  {
    id: "t-hav-1", concept: "where_having", type: "대화형", level: 2, family: "hav-order", options: [], answer: -1,
    stem: "WHERE와 HAVING의 차이를 실행 순서와 함께 설명해 보세요.",
    talk: [
      { label: "WHERE는 묶기 전에 행을 거른다", keywords: ["where", "행", "전에", "먼저"] },
      { label: "HAVING은 묶은 뒤 그룹을 거른다", keywords: ["having", "그룹", "뒤", "후"] },
      { label: "집계 조건은 HAVING에만 쓸 수 있다", keywords: ["집계", "sum", "count", "avg"] },
    ],
    hints: ["FROM → WHERE → GROUP BY → HAVING 순서를 떠올려 보세요.", "WHERE가 실행될 때는 아직 그룹이 없어요."],
    explanation: "WHERE는 GROUP BY 전에 행을 하나씩 거르고, HAVING은 GROUP BY로 묶은 뒤 그룹을 걸러요. 그래서 SUM(SAL) > 10000 같은 집계 조건은 HAVING에만 쓸 수 있어요.",
  },
  {
    id: "b-emp-1", concept: "empty_agg", type: "빈칸", level: 2, family: "emp-count", options: [], answer: -1,
    stem: "조건에 맞는 행이 없을 때 GROUP BY 없이 COUNT(*)를 하면 결과는 한 줄로 ____ 이 나온다.",
    blank: ["0", "영", "0건", "0개"],
    hints: ["빈 바구니 하나를 세면 몇 개일까요?", "SUM은 NULL이지만 COUNT는 숫자로 나와요."],
    explanation: "GROUP BY가 없으면 전체를 한 그룹으로 보고 한 줄을 돌려줘요. 센 행이 없으니 COUNT(*)는 0이에요. SUM, AVG는 NULL이 나와요.",
  },
  {
    id: "t-emp-1", concept: "empty_agg", type: "대화형", level: 3, family: "emp-groupby", options: [], answer: -1,
    stem: "WHERE 조건에 맞는 행이 하나도 없을 때, GROUP BY가 있을 때와 없을 때 결과가 어떻게 다른지 설명해 보세요.",
    talk: [
      { label: "GROUP BY가 없으면 한 줄이 나온다", keywords: ["한 줄", "1행", "한 행", "1건"] },
      { label: "GROUP BY가 있으면 아무 줄도 안 나온다", keywords: ["0행", "아무", "결과 없", "빈 결과", "안 나"] },
      { label: "COUNT는 0, SUM은 NULL이다", keywords: ["0", "null", "널"] },
    ],
    hints: ["GROUP BY가 없으면 전체가 그룹 하나예요.", "GROUP BY가 있으면 만들어질 그룹이 하나도 없어요."],
    explanation: "GROUP BY가 없으면 빈 바구니 하나를 요약해서 한 줄이 나오고, 이때 COUNT(*)는 0, SUM은 NULL이에요. GROUP BY가 있으면 바구니 자체가 없어서 아무 줄도 나오지 않아요.",
  },
  {
    id: "b-inner-1", concept: "inner_join", type: "빈칸", level: 1, family: "inner-basic", options: [], answer: -1,
    stem: "INNER JOIN은 두 테이블에서 조인 조건이 ____ 행만 결과에 남긴다.",
    blank: ["일치", "맞는", "같은", "만족"],
    hints: ["짝이 있는 행만 남아요.", "ON 조건이 참이 되는 경우예요."],
    explanation: "INNER JOIN은 ON 조건이 일치하는, 즉 양쪽에 짝이 있는 행만 남겨요. 짝이 없는 행은 결과에서 빠져요.",
  },
  {
    id: "t-inner-1", concept: "inner_join", type: "대화형", level: 2, family: "inner-basic", options: [], answer: -1,
    stem: "INNER JOIN을 하면 왜 일부 행이 결과에서 사라지는지 설명해 보세요.",
    talk: [
      { label: "조인 조건이 맞는 짝이 있어야 남는다", keywords: ["짝", "일치", "맞는", "같은"] },
      { label: "짝이 없는 행은 빠진다", keywords: ["없", "빠", "사라", "제외"] },
      { label: "빠진 행을 남기려면 OUTER JOIN을 쓴다", keywords: ["outer", "left", "아우터"] },
    ],
    hints: ["사원이 없는 부서는 어떻게 될까요?", "양쪽에 모두 있어야 남는 조인이에요."],
    explanation: "INNER JOIN은 ON 조건이 맞는 짝이 양쪽에 모두 있을 때만 행을 남겨요. 사원이 없는 부서처럼 짝이 없는 행은 빠지고, 이런 행까지 보려면 OUTER JOIN을 써야 해요.",
  },
  {
    id: "b-outer-1", concept: "outer_join", type: "빈칸", level: 1, family: "outer-basic", options: [], answer: -1,
    stem: "LEFT OUTER JOIN은 왼쪽 테이블의 행을 모두 남기고, 짝이 없는 오른쪽 컬럼은 ____로 채운다.",
    blank: ["NULL", "널"],
    hints: ["값이 없다는 뜻의 특별한 값이에요.", "COUNT(컬럼)이 빼고 세는 그 값이에요."],
    explanation: "LEFT OUTER JOIN은 왼쪽 행을 모두 남기고, 오른쪽에 짝이 없으면 그 컬럼들을 NULL로 채워요.",
  },
  {
    id: "t-outer-1", concept: "outer_join", type: "대화형", level: 2, family: "outer-basic", options: [], answer: -1,
    stem: "LEFT OUTER JOIN과 INNER JOIN의 결과가 어떻게 다른지 설명해 보세요.",
    talk: [
      { label: "LEFT JOIN은 왼쪽 행을 모두 남긴다", keywords: ["왼쪽", "left", "모두", "전부"] },
      { label: "짝이 없으면 오른쪽 값이 NULL이 된다", keywords: ["null", "널"] },
      { label: "INNER JOIN은 짝 있는 행만 남긴다", keywords: ["inner", "짝", "일치"] },
    ],
    hints: ["사원이 없는 부서는 두 조인에서 각각 어떻게 될까요?", "LEFT JOIN에서 빈 자리는 무엇으로 채워질까요?"],
    explanation: "INNER JOIN은 양쪽에 짝이 있는 행만 남기지만, LEFT OUTER JOIN은 왼쪽 행을 모두 남기고 짝이 없는 오른쪽 컬럼을 NULL로 채워요. 그래서 사원이 없는 부서도 결과에 나와요.",
  },
  {
    id: "b-order-1", concept: "join_order", type: "빈칸", level: 2, family: "order-where", options: [], answer: -1,
    stem: "OUTER JOIN에서 ON 조건은 조인할 때, WHERE 조건은 조인이 끝난 ____에 적용된다.",
    blank: ["뒤", "후", "다음"],
    hints: ["둘 중 어느 쪽이 먼저 실행될까요?", "WHERE는 조인 결과를 다시 걸러요."],
    explanation: "ON 조건은 조인하면서 짝을 찾을 때 쓰이고, WHERE 조건은 조인이 끝난 뒤 결과 전체를 걸러요.",
  },
  {
    id: "t-order-1", concept: "join_order", type: "대화형", level: 3, family: "order-where", options: [], answer: -1,
    stem: "LEFT JOIN에서 오른쪽 테이블 조건을 ON에 쓸 때와 WHERE에 쓸 때 결과가 어떻게 달라지는지 설명해 보세요.",
    talk: [
      { label: "ON에 쓰면 왼쪽 행은 그대로 남는다", keywords: ["on", "남", "유지", "그대로"] },
      { label: "WHERE는 조인 뒤에 걸러진다", keywords: ["where", "뒤", "후", "나중"] },
      { label: "WHERE에서 NULL 행이 빠져 INNER JOIN처럼 된다", keywords: ["null", "널", "inner", "빠"] },
    ],
    hints: ["기획 부서처럼 사원이 없는 행의 E.JOB 값은 무엇일까요?", "NULL = 'DEV'는 참일까요?"],
    explanation: "ON에 쓰면 조인하면서 짝만 걸러져서 왼쪽 행은 모두 남아요. WHERE에 쓰면 조인 뒤에 거르기 때문에 오른쪽이 NULL인 행이 빠지고, 결과가 INNER JOIN처럼 돼요.",
  },
];

QUESTIONS.push(...PRACTICE);

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
