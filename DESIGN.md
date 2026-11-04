---
name: sprout
description: 읽고, 확인하고, 기록하는 AI 리딩 파트너
colors:
  sprout-green: "#00c471"
  sprout-green-deep: "#00a760"
  sprout-green-mist: "#e5f9f0"
  sprout-green-wash: "#f2fcf7"
  ink: "#1b1c1d"
  ink-soft: "#3e4042"
  slate: "#6a7077"
  slate-quiet: "#6e747a"
  slate-faint: "#abb0b5"
  hairline: "#e4e6e8"
  hairline-soft: "#eff1f3"
  study-gray: "#f8f9fa"
  paper: "#ffffff"
  player-black: "#121314"
  signal-blue: "#3e7bfa"
  signal-blue-mist: "#eef4ff"
  mistake-red: "#e5503c"
  mistake-red-mist: "#fdeeec"
  caution-amber: "#f59f00"
  caution-amber-mist: "#fff6e0"
typography:
  display:
    fontFamily: "Pretendard Variable, Pretendard, Noto Sans KR, system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Pretendard Variable, Pretendard, Noto Sans KR, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Pretendard Variable, Pretendard, Noto Sans KR, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: 1.5
  body:
    fontFamily: "Pretendard Variable, Pretendard, Noto Sans KR, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "-0.01em"
  reading:
    fontFamily: "Pretendard Variable, Pretendard, Noto Sans KR, system-ui, sans-serif"
    fontSize: "15.5px"
    fontWeight: 400
    lineHeight: 1.8
  label:
    fontFamily: "Pretendard Variable, Pretendard, Noto Sans KR, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.4
  code:
    fontFamily: "SF Mono, ui-monospace, Menlo, Consolas, monospace"
    fontSize: "13.5px"
    fontWeight: 400
    lineHeight: 1.7
rounded:
  chip: "4px"
  sm: "6px"
  md: "8px"
  lg: "12px"
  pill: "16px"
spacing:
  xs: "6px"
  sm: "10px"
  md: "16px"
  lg: "20px"
  xl: "24px"
  section: "40px"
components:
  button-primary:
    backgroundColor: "{colors.sprout-green}"
    textColor: "{colors.paper}"
    rounded: "{rounded.sm}"
    padding: "0 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.sprout-green-deep}"
  button-default:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0 16px"
    height: "40px"
  button-dark:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.sm}"
    padding: "0 16px"
    height: "40px"
  chip:
    backgroundColor: "{colors.hairline-soft}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.label}"
    rounded: "{rounded.chip}"
    padding: "0 8px"
    height: "22px"
  chip-success:
    backgroundColor: "{colors.sprout-green-mist}"
    textColor: "{colors.sprout-green-deep}"
  chip-mistake:
    backgroundColor: "{colors.mistake-red-mist}"
    textColor: "{colors.mistake-red}"
  chip-shaky:
    backgroundColor: "{colors.caution-amber-mist}"
    textColor: "#b26a00"
  card:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.md}"
    padding: "20px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "44px"
  quiz-option:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "12px 14px"
  quiz-option-right:
    backgroundColor: "{colors.sprout-green-wash}"
  quiz-option-wrong:
    backgroundColor: "{colors.mistake-red-mist}"
  workspace-bar:
    backgroundColor: "{colors.player-black}"
    textColor: "{colors.paper}"
    height: "56px"
---

# Design System: sprout

## Overview

**Creative North Star: "조용한 자습실 (The Quiet Study Room)"**

sprout는 학습자가 자료를 읽는 데 집중하는 조용한 자습실이다. 바탕은 흰 종이와 아주 옅은 회색이고, 초록은 "지금 해야 할 다음 행동"과 "스스로 해냈다는 증거"에만 쓰인다. AI는 방 한가운데가 아니라 옆자리에 앉아 있다: 오른쪽 패널과 아이콘 레일에 머무르다 학습자가 부르면 짧게 돕고, 설명 뒤에는 확인 문제로 넘겨준다.

밀도는 학습 도구답게 중간 이상이다. 대시보드는 카드 격자로 상태를 한눈에 보여주고, 워크스페이스는 읽기 영역에 넉넉한 줄간격(1.8)을 준다. 장식은 거의 없다. 깊이감은 그림자가 아니라 얇은 테두리와 옅은 회색 면으로 만든다.

**Key Characteristics:**
- 흰 바탕 + 절제된 초록(#00c471) 한 가지 강조색
- 의미 색(정답 초록 · 오답 빨강 · 확신 낮음 주황 · 정보 파랑)은 칩과 결과 바에만
- 학습 워크스페이스 상단은 검은 플레이어 바(#121314)로 "학습 모드"를 구분
- 얇은 1px 테두리, 6–12px 모서리, 그림자는 떠 있는 요소에만
- 픽셀 새싹 캐릭터가 AI의 얼굴

## Colors

흰 종이와 회색 잉크 위에 초록 한 가지를 아껴 쓰는 팔레트.

### Primary
- **Sprout Green** (#00c471): 주 버튼, 진행 바, 완료 체크, 현재 탭 표시, 로고. 다음 행동이 무엇인지 알려주는 색.
- **Sprout Green Deep** (#00a760): 주 버튼 hover, 초록 칩 글자.
- **Green Mist / Green Wash** (#e5f9f0 / #f2fcf7): 정답 결과 바, 목표 스트립, 완료된 확인 카드, 시험 포인트 콜아웃의 바탕.

### Neutral
- **Ink** (#1b1c1d): 본문 제목, 선택된 옵션 테두리, 사용자 말풍선, 진한 버튼.
- **Ink Soft** (#3e4042): 읽기 본문.
- **Slate / Slate Quiet** (#6a7077 / #6e747a): 보조 텍스트, 캡션. 흰 바탕에서 4.5:1 이상.
- **Slate Faint** (#abb0b5): 비활성 아이콘과 흐린 옵션 전용. 읽어야 하는 텍스트에는 쓰지 않는다.
- **Hairline / Hairline Soft** (#e4e6e8 / #eff1f3): 카드 테두리, 구분선, 칩 바탕.
- **Study Gray** (#f8f9fa): 계획 항목, 해설 박스, 확인 CTA 같은 2차 면.
- **Player Black** (#121314): 워크스페이스 상단 바.

### Semantic
- **Mistake Red** (#e5503c / mist #fdeeec): 오답, 개념 부족·혼동 칩, 오늘 복습 칩.
- **Caution Amber** (#f59f00 / mist #fff6e0, 글자 #b26a00): 찍어서 맞힘·낮은 확신, 힌트, 이전 오답 알림, 자주 혼동 콜아웃.
- **Signal Blue** (#3e7bfa / mist #eef4ff): 문제 유형 칩, 며칠 뒤 복습 칩, START 배지.

### Named Rules
**The One Green Rule.** 초록은 다음 행동과 성취 증거에만 쓴다. 장식 배경이나 큰 면을 초록으로 칠하지 않는다.
**The Evidence Color Rule.** 빨강·주황은 학습자의 실수 데이터를 표시할 때만 쓴다. 경고 장식이나 강조용으로 빌려 쓰지 않는다.

## Typography

**Body Font:** Pretendard Variable (fallback Noto Sans KR, system-ui)
**Code Font:** SF Mono (fallback ui-monospace, Menlo)

**Character:** 한 가족(Pretendard)의 굵기 차이로 위계를 만든다. 고딕 하나로 단정하게, SQL 코드와 테이블 데이터에만 고정폭을 쓴다.

### Hierarchy
- **Display** (800, 32px, 1.25, -0.03em): 학습 자료 제목, 로그인 헤드라인(28px).
- **Headline** (700, 22px): 페이지 제목, 자료 구간 제목.
- **Title** (700, 15px): 카드 제목, 문제 지문(15–17px).
- **Reading** (400, 15.5px, 1.8): 학습 자료 본문. 최대 폭 760px.
- **Body** (400, 14px, 1.5): UI 본문, 채팅.
- **Label** (600, 12px): 칩, 캡션, 메타 정보.

### Named Rules
**The Keep-All Rule.** 한국어는 단어 중간에서 줄을 바꾸지 않는다(`word-break: keep-all`). 제목은 `text-wrap: balance`.
**The Code Is Data Rule.** 고정폭 글꼴은 SQL·결과값에만. 제목이나 썸네일을 "기술적으로" 보이게 하려고 쓰지 않는다.

## Layout

- 내 학습 영역: 최대 1200px, 왼쪽 180px 사이드 내비 + 본문, 간격 40px. 본문은 12열 격자(카드 간격 16px).
- 워크스페이스: 전체 높이 앱. 검은 상단 바 56px → 읽기 영역(가변) + AI 패널(420px, 1080px 이하 360px) + 아이콘 레일(68px).
- 860px 이하: 사이드 내비는 가로 탭, 카드는 한 열, 워크스페이스는 읽기 위 / 패널 아래(55vh)로 쌓이고 레일은 숨긴다.
- 카드 안쪽 여백 20px, 리스트 행 10px, 버튼 높이 32/40/48px.

## Elevation & Depth

기본은 평평하다. 면의 구분은 1px 테두리와 회색 면(Study Gray)으로 한다. 그림자는 "떠서 움직이는" 요소에만 쓴다.

### Shadow Vocabulary
- **Rest** (`0 2px 8px rgba(0,0,0,0.06)`): 채팅 입력창, 채팅 속 퀴즈 카드.
- **Pop** (`0 8px 24px rgba(0,0,0,0.12)`): 드래그 선택 팝오버, 토스트.

### Named Rules
**The Flat Desk Rule.** 대시보드 카드와 버튼에는 그림자를 넣지 않는다. 떠 있는 것만 그림자를 가진다.

## Shapes

모서리는 작고 일정하다: 칩 4px, 버튼·입력 6px, 카드·옵션 8px, 퀴즈 카드·입력창 12px, 알약형 탭 15–16px, 원형은 아바타·아이콘 버튼·진행 점. 콜아웃은 한쪽 굵은 띠 없이 1px 테두리 + 옅은 바탕.

## Components

### Buttons
- **Shape:** 살짝 둥근 사각형 (6px), 높이 32 / 40 / 48px.
- **Primary:** Sprout Green 바탕 + 흰 글자, hover 시 Green Deep.
- **Default:** 흰 바탕 + Hairline 테두리, hover 시 Study Gray.
- **Dark:** Ink 바탕(답 제출, 노트 저장 등 확정 행동).
- **Disabled:** 불투명도 0.45.

### Chips
- **Style:** 22px 높이, 4px 모서리, 12px/600. 의미 색 mist 바탕 + 진한 글자.
- **Use:** 오답 원인 태그, 문제 유형, 복습 일정, 진행률.

### Cards / Containers
- **Corner Style:** 8px. **Background:** Paper. **Border:** 1px Hairline. **Padding:** 20px. 그림자 없음.

### Inputs
- 44px, 1px Hairline, 6px. Focus 시 테두리 Sprout Green.

### Quiz Option (signature)
- 8px 모서리 카드 형태의 선택지, 왼쪽 22px 원형 키(A/B/C/D 또는 O/X).
- 선택: Ink 테두리 + Ink 키. 정답: Green 테두리 + Green Wash. 오답: Red 테두리 + Red Mist. 나머지는 흐리게.
- 채점 전 "이 답을 어떻게 선택했나요?" 확신도 3단계를 묻고, 결과 바(정답입니다! / 아쉬워요)와 원인 칩을 보여준다.

### Workspace (signature)
- 검은 플레이어 바 + 읽기 영역 상단의 반투명 구간 탭(현재 구간 초록 밑줄) + 오른쪽 AI 패널(세그먼트 탭: AI 에이전트 / 요약 / 복습) + 아이콘 레일(에이전트 · 요약 · 복습 · 노트, 복습은 빨간 배지).

## Do's and Don'ts

### Do:
- **Do** 설명 뒤에 항상 확인 행동(문제로 확인 버튼, 확인 CTA)을 초록으로 붙인다.
- **Do** 학습 상태를 칩과 진행 바로 형태화한다(숫자만 두지 않는다).
- **Do** 보조 텍스트는 Slate(#6a7077) 이상 진하기로 쓴다.
- **Do** 숫자가 줄 맞춰 나오는 곳에 `tabular-nums`.

### Don't:
- **Don't** 카드나 콜아웃에 2px 이상 한쪽 색 띠를 두지 않는다.
- **Don't** 이모지나 ●○ 같은 문자로 아이콘을 대신하지 않는다(lucide 아이콘 + 직접 그린 SVG).
- **Don't** 장식용 그라데이션 블롭, 글래스 효과를 넣지 않는다.
- **Don't** 인프런 이름·로고를 쓰지 않는다. sprout는 독립 브랜드다.
