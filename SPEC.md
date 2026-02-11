# Find-ER (파인더) — 플랫폼 기술명세서 & 작업명세서

> **버전**: v2.0  
> **최종 수정일**: 2026-02-11  
> **브랜드명**: Find-ER (한글: 파인더)  
> **플랫폼 유형**: 모바일 우선(Mobile-First) 웹 애플리케이션 (PWA)

---

## 📋 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [기술 스택](#2-기술-스택)
3. [디자인 시스템](#3-디자인-시스템)
4. [라우팅 구조](#4-라우팅-구조)
5. [사용자 역할 및 진입점](#5-사용자-역할-및-진입점)
6. [핵심 기능 — 실시간 응급실 지도](#6-핵심-기능--실시간-응급실-지도)
7. [병원 상세 바텀시트](#7-병원-상세-바텀시트)
8. [모드 시스템 — 119 응급 vs 비응급](#8-모드-시스템--119-응급-vs-비응급)
9. [사설 구급차 호출 시스템](#9-사설-구급차-호출-시스템)
10. [가족 의료 카드 시스템](#10-가족-의료-카드-시스템)
11. [구급대원 Pro 대시보드](#11-구급대원-pro-대시보드)
12. [응급 가이드 페이지](#12-응급-가이드-페이지)
13. [소아 약 가이드 페이지](#13-소아-약-가이드-페이지)
14. [요금 계산기](#14-요금-계산기)
15. [관리자 대시보드](#15-관리자-대시보드)
16. [AI 예측 분석 시스템](#16-ai-예측-분석-시스템)
17. [실시간 데이터 아키텍처](#17-실시간-데이터-아키텍처)
18. [인증 및 보안](#18-인증-및-보안)
19. [PWA 및 오프라인 지원](#19-pwa-및-오프라인-지원)
20. [Edge Functions](#20-edge-functions)

---

## 1. 프로젝트 개요

**Find-ER**는 대한민국 전국 응급실의 실시간 병상 가용성을 확인할 수 있는 공익 플랫폼입니다.

### 타겟 사용자

| 사용자 그룹 | 설명 | 진입 경로 |
|:---|:---|:---|
| 보호자/환자 | 응급실을 찾는 일반 시민 | `/guardian` → `/map` |
| 민간 구급차 기사 | 사설 구급차 운전자 | `/driver-intro` → `/login` → `/driver` |
| 119 구급대원 | 소방청 구급대원 | `/paramedic` → `/map?role=paramedic` |
| 관리자 | 시스템 관리자 | `/admin/login` → `/admin` |

### 비즈니스 모델

- **일반인**: 무료 응급 정보 제공
- **기사**: 유료 Pro 도구 (운행 관리, 수익 최적화)

---

## 2. 기술 스택

### Frontend

| 영역 | 기술 |
|:---|:---|
| 프레임워크 | React 18 + TypeScript |
| 빌드 도구 | Vite |
| 스타일링 | Tailwind CSS + shadcn/ui |
| 애니메이션 | Framer Motion |
| 상태 관리 | TanStack Query (서버 상태), React Context (앱 상태) |
| 폼 | React Hook Form + Zod |
| 차트 | Recharts |
| 지도 | Leaflet + react-leaflet (기본), Kakao Maps SDK (한국 전용) |
| 클러스터링 | react-leaflet-cluster |
| PDF | jsPDF + jspdf-autotable |
| 날짜 | date-fns |

### Backend (Lovable Cloud)

| 영역 | 기술 |
|:---|:---|
| 데이터베이스 | PostgreSQL |
| 인증 | Supabase Auth |
| 실시간 | Supabase Realtime |
| Edge Functions | Deno (서버리스) |

---

## 3. 디자인 시스템

### 비주얼 아이덴티티

- **디자인 방향**: Toss 앱 영감의 고대비 모노크롬 미니멀리즘
- **타이포그래피**: Pretendard Variable (본문), Outfit (영문 숫자), Seoul Namsan (브랜드)
- **색상 체계**: HSL 기반 시맨틱 토큰

### 컬러 토큰 (Light Mode)

| 토큰 | HSL 값 | 용도 |
|:---|:---|:---|
| `--background` | 210 20% 98% | 앱 배경 |
| `--foreground` | 220 20% 10% | 주요 텍스트 |
| `--primary` | 220 100% 50% | 의료 블루 (신뢰감) |
| `--secondary` | 210 20% 96% | 카드 배경, 칩 |
| `--success` | 160 84% 39% | 병상 여유 (초록) |
| `--danger` | 0 84% 60% | 만실 (빨강) |
| `--warning` | 38 92% 50% | 제한적 (노랑) |
| `--destructive` | 0 84% 60% | 긴급 액션 |

### 테마 모드

| 모드 | 설명 |
|:---|:---|
| Light | 기본 밝은 테마 |
| Dark | 어두운 테마 (토글 지원) |
| Transfer Mode | 비응급 이송 시 보라색 테마 오버레이 (`--primary: 262 83% 58%`) |

### 브랜드 로고 애니메이션

- 랜딩 페이지 헤더에서 '파인더' ↔ 'Find-ER' 3초 간격 크로스페이드 전환
- `AnimatePresence` + `motion.span` 사용

### 컴포넌트 스타일 규칙

- 모든 카드: `rounded-2xl` 또는 `rounded-3xl`
- 버튼: `rounded-2xl`, 풀 너비 CTA는 `py-4`
- 뱃지/칩: `rounded-full`
- 아이콘 컨테이너: `rounded-xl bg-secondary`
- 간격: `gap-2` ~ `gap-3`, 패딩 `px-5`

---

## 4. 라우팅 구조

| 경로 | 컴포넌트 | 접근 권한 | 설명 |
|:---|:---|:---|:---|
| `/` | Landing | 공개 | 메인 랜딩 (역할 선택) |
| `/guardian` | GuardianLanding | 공개 | 보호자/환자 소개 페이지 |
| `/driver-intro` | DriverLanding | 공개 | 민간 구급차 기사 소개 |
| `/paramedic` | ParamedicLanding | 공개 | 119 구급대원 소개 |
| `/map` | MapPage | 공개 | **핵심 기능** — 실시간 응급실 지도 |
| `/map?role=paramedic` | MapPage | 공개 | 구급대원 모드 지도 |
| `/map?mode=driver` | MapPage | 공개 | 기사 모드 지도 |
| `/family` | FamilyPage | 공개 (로그인 권장) | 가족 응급 카드 |
| `/login` | Login | 공개 | 로그인/회원가입 |
| `/driver` | DriverDashboard | 인증 필요 | 기사 대시보드 |
| `/admin/login` | AdminLogin | 공개 | 관리자 로그인 |
| `/admin` | AdminPage | admin 역할 | 관리자 대시보드 |
| `/fare-calculator` | FareCalculatorPage | 공개 | 구급차 요금 계산기 |
| `/medicine-guide` | MedicineGuidePage | 공개 | 소아 약 가이드 |
| `/emergency-guide` | EmergencyGuidePage | 공개 | 응급 행동 가이드 |
| `/logs` | RejectionLogsPage | 공개 | 병원 거절 이력 |
| `/install` | InstallPage | 공개 | PWA 설치 안내 |
| `/terms` | TermsPage | 공개 | 이용약관 |
| `/privacy` | PrivacyPage | 공개 | 개인정보처리방침 |

### Context Providers (앱 전역)

```
QueryClientProvider
  └─ ThemeProvider (light/dark)
       └─ TransferModeProvider (emergency/transfer 모드)
            └─ TransferRequestProvider (이송 요청 상태)
                 └─ PrivateTrafficProvider (사설 교통 데이터)
```

---

## 5. 사용자 역할 및 진입점

### 랜딩 페이지 (`/`)

#### 구조

1. **히어로 섹션**: 실시간 상태 인디케이터 + 대형 타이틀 + CTA 버튼
2. **실시간 통계 카드**: 전국/내 주변 탭 전환, 4가지 KPI (응급실 수, 총 병상, 여유, 소아)
3. **가까운 응급실 목록**: GPS 기반 상위 3개 (10km 반경)
4. **서비스 선택 그리드**: 보호자/환자, 민간 구급차, 119 구급대원 (3열)
5. **응급 가이드 링크**: 소아 약 가이드, 응급 행동 가이드

#### CTA 버튼 비율

- 응급실 찾기 : 응급 가이드 = **7:3** (`flex-[2.3]` : `flex-1`)

### 보호자 랜딩 (`/guardian`)

- 주요 기능 소개 (AI 증상 검색, 실시간 병상, 가족 카드)
- 타겟 사용자별 정보 모달 (아이 부모, 어르신 보호, 만성질환 가족)
- 퀵 링크: 가족 카드, 요금 계산, 소아 약 가이드
- 하단 119 긴급 전화 배너

### 민간 구급차 랜딩 (`/driver-intro`)

- 기사님 혜택 3가지: 수익 +30%, 시간 5분 절감, 100% 정확 진입
- AI 생성 실제 기사 포트레이트 (driver-kim.jpg, driver-park.jpg)
- 보안 정보 모달 연동

### 119 구급대원 랜딩 (`/paramedic`)

- 골든타임 강조, 주황색 테마 포인트
- 로그인 없이 바로 사용 가능 안내
- 현장 구급대원 후기 (별점 5점)
- 공공데이터(NEDIS) 기반 서비스 신뢰 배지

---

## 6. 핵심 기능 — 실시간 응급실 지도

### 지도 엔진

| 항목 | 스펙 |
|:---|:---|
| 기본 엔진 | Leaflet + OpenStreetMap |
| 보조 엔진 | Kakao Maps SDK (한국 내 정밀 지도) |
| 클러스터링 | react-leaflet-cluster (도넛 클러스터 아이콘) |
| 전환 | 지도 하단 버튼으로 Leaflet ↔ Kakao 토글 |

### 병원 마커 시스템

| 마커 요소 | 설명 |
|:---|:---|
| **색상** | 🟢 여유(3+ 병상), 🟡 제한(1-2), 🔴 만실(0) |
| **등급 링** | 권역센터(빨강), 지역센터(주황), 지역기관(파랑) |
| **소아 뱃지** | 👶 노란색 원형 뱃지 |
| **외상센터 뱃지** | ✚ 보라색 십자가 뱃지 |
| **병상 수** | 마커 중앙에 숫자 표시 |
| **거절 경고** | ⚠️ 최근 거절 이력 시 주의 뱃지 |

### 필터 시스템

| 필터 ID | 라벨 | 설명 |
|:---|:---|:---|
| `all` | 전체 | 모든 병상 합계 |
| `adult` | 일반(성인) | 성인 일반 병상 |
| `pediatric` | 소아 | 소아 전용 병상 |
| `fever` | 음압(발열) | 감염병 음압 병상 |
| `traumaCenter` | 외상센터 | 외상센터만 |
| `pharmacy` | 약국 | 공휴일/야간 약국 |
| `moonlight` | 달빛소아 | 야간/휴일 소아 진료 |

### 반경 필터 (RadiusChips)

- 5km / 10km / 20km / 30km / 전체
- GPS 위치 기반 자동 필터링
- 줌 레벨 연동: 줌 13+ → 5km, 줌 12 → 10km, 줌 11 → 20km

### 지역 선택기 (RegionSelector)

- 17개 시도 대분류
- 구/군 세부 분류
- 선택 시 해당 지역으로 지도 자동 이동

### 외상센터 스마트 추천

- 선택 지역에 외상센터가 없을 경우 가장 가까운 외상센터를 토스트로 추천
- 병원명, 거리(km), 예상 도착 시간 표시
- 5초 후 자동 닫힘 + "바로가기" 버튼

### 소아 SOS 모드 (PediatricSOSToggle)

- 활성화 시 소아 병상 보유 병원만 필터링
- 지도 UI에 붉은 토글 표시

### 지도 경계 제한

```
최소 위도: 33.0°N (제주도 남단)
최대 위도: 38.8°N (북한 접경)
최소 경도: 124.0°E (서해)
최대 경도: 131.0°E (독도)
```

### 추가 지도 레이어

| 레이어 | 아이콘 | 설명 |
|:---|:---|:---|
| 공휴일 약국 | 💊 | 공휴일/야간 운영 약국 |
| 구급차 기사 | 🚑 | 실시간 기사 위치 |
| 이송 중 구급차 | 🚑→ | 병원으로 이동 중인 구급차 |
| 실시간 제보 | 📍 | 사고/교통/응급 제보 |
| 요양병원 | 🏥 | 비응급 이송 모드용 |

---

## 7. 병원 상세 바텀시트

### 기본 구조

```
┌─────────────────────────────────┐
│  [핸들 바]                       │
│                                 │
│  [상태 뱃지] [외상센터] [소아] [달빛] │
│  병원명 (한글)                    │
│  병원명 (영문)                    │
│  등급 카테고리                    │
│                                 │
│  [119 전화하기 버튼] ← 조건부      │
│                                 │
│  ── 119 인증 뱃지 ──             │
│  ── AI 예측 분석 (BETA) ──       │
│  ── 실질 가용 병상 그리드 ──       │
│  ── 대기 시간 예측 ──            │
│  ── 수용/시술 가능 여부 ──        │
│  ── 연락처/주소 ──               │
│  ── 디지털 이송 요청 ──           │
│  ── 액션 버튼 (전화/길찾기/호출) ── │
│                                 │
└─────────────────────────────────┘
```

### 병상 현황 그리드 (3열)

| 항목 | 아이콘 | 설명 |
|:---|:---|:---|
| 성인 | Stethoscope | 일반 응급 병상 (이송 중 구급차 차감) |
| 소아 | Baby | 소아 전용 병상 |
| 열/감염 | Thermometer | 음압 격리 병상 |

### 실질 가용 병상 계산

```
실질 가용 병상 = 공식 병상 수 - 이송 중인 구급차 수
```

### 수용/시술 가능 여부

| 항목 | 아이콘 | 데이터 |
|:---|:---|:---|
| 심근경색 | Heart | `acceptance.heart` |
| 뇌출혈 | Brain | `acceptance.brainBleed` |
| 뇌경색 | Brain | `acceptance.brainStroke` |
| 응급내시경 | Activity | `acceptance.endoscopy` |
| 응급투석 | Droplet | `acceptance.dialysis` |

### 액션 버튼 — 모드별 노출 로직

| 사용자 모드 | 119 전화하기 | 사설구급차 부르기 | 디지털 이송 요청 | 응급실 전화 | 길찾기 |
|:---|:---:|:---:|:---:|:---:|:---:|
| **보호자 — 119 응급** | ✅ (최상단) | ✅ (하단 보조) | ❌ | ✅ | ✅ |
| **보호자 — 비응급(이송)** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **119 구급대원** | ✅ | ❌ | ✅ | ✅ | ✅ |
| **사설구급차 기사** | ✅ | ❌ | ✅ | ✅ | ✅ |

### 119 전화하기 버튼 스펙

```tsx
조건: (isParamedicMode || isDriverMode || !isTransferMode)
색상: bg-destructive text-destructive-foreground
크기: w-full py-4 rounded-2xl
위치: 병원명 직후 (최우선 접근성)
```

### 길찾기 (NavigationSelector)

- 카카오맵 / 네이버맵 선택 모달
- 각 앱의 딥링크로 길안내 시작

### 응급실 입구 로드뷰 (ERRoadviewModal)

- Kakao 로드뷰 연동
- 정확한 ER 진입로 확인

### 핫라인 저장

- ★ 아이콘으로 응급실 번호를 즐겨찾기에 추가
- 기사 대시보드에서 핫라인 관리

---

## 8. 모드 시스템 — 119 응급 vs 비응급

### ModeToggle 컴포넌트

지도 페이지 상단에 위치한 토글 스위치:

| 모드 | 색상 | 아이콘 | 설명 |
|:---|:---|:---|:---|
| 119 응급 | 빨간 그라디언트 (`from-red-500 to-red-600`) | Siren | 긴급 상황, 119 연계 |
| 비응급 | 보라 그라디언트 (`from-violet-600 to-purple-600`) | Truck | 사설 이송, 전원 |

### 모드별 차이점

| 항목 | 119 응급 | 비응급(이송) |
|:---|:---|:---|
| 테마 색상 | 기본 (Medical Blue) | 보라색 오버레이 |
| 병상 정렬 | 거리순 | ICU 병상 우선 → 거리순 |
| 119 버튼 | ✅ 표시 | ❌ 숨김 |
| 이송 요청 | ❌ | ✅ 디지털 이송 요청 가능 |
| 요양병원 | ❌ 숨김 | ✅ 표시 (전체/요양 필터) |
| CSS 클래스 | 없음 | `body.transfer-mode` |

### TransferModeContext

```typescript
type AppMode = "emergency" | "transfer";
type TransferFilterType = "all" | "hospital" | "nursing";
```

---

## 9. 사설 구급차 호출 시스템

### 호출 모달 (AmbulanceCallModal)

| 필드 | 설명 |
|:---|:---|
| 출발지 | 현재 위치 또는 수동 입력 |
| 목적지 | 선택한 병원 |
| 환자 정보 | 가족 카드 연동 또는 수동 입력 |
| 예상 요금 | 거리 기반 자동 계산 |

### 배차 상태 머신

```
searching → found → en_route → arrived
   ↓
cancelled
```

### 배차 요청 DB

```sql
ambulance_dispatch_requests (
  id, requester_id, driver_id,
  pickup_location, pickup_lat, pickup_lng,
  destination, destination_lat, destination_lng,
  patient_name, patient_condition,
  estimated_fee, estimated_distance_km, status
)
```

---

## 10. 가족 의료 카드 시스템

### 저장 필드

| 필드 | 타입 | 설명 |
|:---|:---|:---|
| name | string | 이름 |
| age | number | 나이 |
| gender | string | 성별 |
| relation | string | 관계 (본인, 배우자, 자녀 등) |
| bloodType | string | 혈액형 |
| chronicDiseases | string[] | 만성질환 |
| allergies | string[] | 알레르기 |
| birthDate | string | 생년월일 |
| weightKg | number | 체중 (kg) |
| medications | string[] | 복용약 |
| guardianContact | string | 보호자 연락처 |
| notes | string | 메모 |

### 하이브리드 저장 방식

| 사용자 유형 | 저장소 | 동기화 |
|:---|:---|:---|
| 로그인 사용자 | Supabase `family_members` | 클라우드 실시간 |
| 비로그인 사용자 | localStorage | 기기 로컬 |

### UI 기능

- **의료 여권 카드 UI**: 신용카드 스타일 디자인
- **상세 모달**: 큰 글씨 모드 (의료진용)
- **119 전달용 텍스트 복사**: 한 번에 환자 정보 전달
- **구급차 호출 연동**: "이 환자로 호출" 원탭
- **PIN 잠금**: 가족 정보 접근 시 PIN 인증 (선택)
- **클라우드 동기화 상태 모달**: 마지막 동기화 시간 확인

---

## 11. 구급대원 Pro 대시보드

### 탭 구조

| 탭 | 아이콘 | 내용 |
|:---|:---|:---|
| 지도 | Map | `/map?mode=driver`로 이동 |
| 호출 | Phone | 대기 중인 배차 요청 + 운행 통계 |
| 수익 | DollarSign | 매출 현황 + 귀환 이송 매칭 |
| 운행일지 | FileText | 운행 기록 히스토리 |

### 호출 탭 기능

1. **실시간 거절 티커 피드** (RejectionTickerFeed): 전국 병원 거절 실시간 스트림
2. **운행 통계 요약** (DrivingStatsWidget): 오늘 운행 건수, 거리, 평균 시간
3. **대기 중인 호출**: 근접성 기반 자동 필터 (10km → 20km → 50km → 전국)
4. **호출 수락 → 이송 시작**: 원탭 워크플로우

### 퀵 액션 바 (Sticky)

| 버튼 | 기능 |
|:---|:---|
| 환자 정보 입력 | AI 음성-텍스트 변환 지원 |
| 시뮬레이션 | 가상 운행 테스트 모드 |
| 위치 공유 | 보호자에게 실시간 위치 노출 |

### 플로팅 액션 버튼 (FAB)

| FAB | 기능 |
|:---|:---|
| RejectionLoggerFAB | 병원 거절 사유 빠른 기록 |
| VoiceEmergencyLogFAB | 음성 기반 구급일지 자동 작성 |

### 수익 탭 (RevenueTab)

- 월별 매출 통계 위젯
- 귀환 이송(빈 차 복귀) 매칭 목록
- 건당 예상 수익 표시
- 환자 정보 (이름, 상태, 나이, 성별)

### 운행일지 (DrivingLogHistory)

- 날짜별 운행 기록 목록
- 월 선택 네비게이션
- 수익 정보 기록/수정
- PDF 다운로드 기능

---

## 12. 응급 가이드 페이지

### 5가지 응급 시나리오

| 시나리오 | 아이콘 | 핵심 지시 |
|:---|:---|:---|
| 심정지 (CPR) | Heart | 분당 100~120회 흉부압박 |
| 기도폐쇄 (하임리히) | Wind | 배꼽 위 주먹으로 위쪽 당기기 |
| 뇌졸중 (FAST) | Brain | 얼굴/팔/언어 확인 후 즉시 119 |
| 심한 출혈 | Droplets | 깨끗한 천으로 직접 압박 |
| 화상 | Flame | 15분간 흐르는 물 식히기 |

### UI 특징

- **아코디언 UI**: 시나리오별 단계적 펼침
- **CPR 박동 애니메이션**: Framer Motion으로 심장 박동 리듬 시각화
- **하단 고정 119 버튼**: 항상 접근 가능한 sticky CTA

---

## 13. 소아 약 가이드 페이지

### 탭 구분

| 탭 | 내용 |
|:---|:---|
| 발열 | 아세트아미노펜/이부프로펜 비교, 용량 계산기, 교차 복용 타이머 |
| 복통 | 백초시럽/키즈활명수 정보, 응급실 방문 기준 |

### 용량 계산기

```
아세트아미노펜: 체중(kg) × 10mg = 복용량, 체중 × 0.4ml = 시럽량
이부프로펜: 체중(kg) × 5mg = 복용량, 체중 × 0.25ml = 시럽량
```

- 체중 입력 (3~50kg)
- 실시간 용량 계산 결과

### 교차 복용 타이머 (DoseTimerCard)

- 약 투여 시간 기록
- 다음 투여 가능 시간 카운트다운
- 알림 기능

### 주변 약국 찾기

- GPS 기반 근처 약국 검색
- 약국 상세 정보 바텀시트
- 24시간/야간/공휴일 필터

---

## 14. 요금 계산기

### 요금 체계 (법정 기준)

| 구분 | 일반 구급차 | 특수 구급차 |
|:---|:---|:---|
| 기본요금 (10km) | ₩30,000 | ₩75,000 |
| 추가 1km | ₩1,000 | ₩1,300 |
| 심야 할증 (00~04시) | +20% | +20% |

### 기능

- 거리 입력 → 요금 자동 계산
- 일반/특수 구급차 탭 전환
- 심야 할증 자동 적용
- 견적서 이미지 캡처 (html2canvas)

---

## 15. 관리자 대시보드

### 접근 권한

- `admin` 역할 전용 (`has_role` RPC 함수로 검증)
- `/admin/login` 전용 로그인 경로

### 기능

| 섹션 | 설명 |
|:---|:---|
| 데이터베이스 현황 | 등록 병원 수, 병상 데이터 보유 병원 수 |
| 전체 동기화 | 5개 권역 배치별 병원 메타데이터 동기화 |
| 전국 병상 갱신 | 17개 시도별 실시간 병상 데이터 갱신 |
| 지역별 업데이트 현황 | 마지막 갱신 시간, 데이터 신선도 (15분/30분 기준) |
| 배치별 개별 동기화 | 수도권/영남/호남/충청/강원제주 개별 실행 |

### 동기화 프로세스

```
수도권(서울/인천/경기) → 영남권 → 호남권 → 충청권 → 강원/제주
각 배치: Edge Function 호출 → DB Upsert → 진행률 표시
```

---

## 16. AI 예측 분석 시스템

### 병상 소진율 (BedTrendIndicator)

| 상태 | 뱃지 | 의미 |
|:---|:---|:---|
| 소진 중 | 🔴 | 병상이 줄어드는 추세 |
| 안정 | 🟢 | 병상 유지 중 |
| 증가 중 | 🔵 | 병상이 늘어나는 추세 |

### 혼잡도 예측 (CongestionForecast)

- 시간대별 혼잡도 예측 그래프
- 현재 시점 대비 향후 추이 표시

### Shadow Demand (잠재 수요)

```
실제 가용 병상 = 공식 병상 수 - 이송 중인 구급차 수
```

- 이송 중 구급차 실시간 추적
- 실질 가용 병상 자동 차감 표시

### 안전 도착 확률 (WaitTimePrediction)

| 확률 | 표시 | 의미 |
|:---|:---|:---|
| 95%+ | 🟢 안전 | 병상 확보 가능성 높음 |
| 70-94% | 🟡 주의 | 불확실 |
| <70% | 🔴 위험 | 부족 가능성 |

### AI 수용률 예측 (AIAcceptanceBadge)

- 과거 수용/거절 데이터 기반 확률 표시
- Edge Function(`calculate-acceptance-rate`) 호출

### 119 검증 뱃지 (Fire119VerifiedBadge)

- 소방청 119 데이터로 검증된 실적 표시
- 차트 표시 옵션

---

## 17. 실시간 데이터 아키텍처

### 데이터 소스

| 데이터 | API | 갱신 주기 |
|:---|:---|:---|
| 병원 메타데이터 | 공공데이터포털 | 관리자 수동 동기화 |
| 실시간 병상 | NEDIS API → Edge Function | 5분 |
| 구급차 위치 | Supabase Realtime | 실시간 |
| 거절 이력 | 기사 수동 입력 | 실시간 |
| 약국 정보 | 공공데이터포털 | 일별 |

### 주요 DB 테이블

| 테이블 | 용도 | RLS |
|:---|:---|:---|
| `hospitals` | 전국 응급의료기관 정보 | 공개 읽기 |
| `hospital_status_cache` | 실시간 병상 캐시 | 공개 읽기 |
| `active_ambulance_trips` | 이송 중인 구급차 | 공개 읽기, 인증 쓰기 |
| `ambulance_dispatch_requests` | 배차 요청 | 본인 데이터만 |
| `driving_logs` | 운행 기록 | 본인 데이터만 |
| `family_members` | 가족 의료 카드 | 본인 데이터만 |
| `user_roles` | 사용자 역할 | 본인 읽기 |
| `hospital_rejection_logs` | 병원 거절 이력 | 인증 쓰기 |
| `hospital_acceptance_stats` | 수용률 통계 | 공개 읽기 |
| `return_trip_requests` | 귀환 이송 요청 | 공개 읽기 |
| `pharmacies` | 약국 정보 | 공개 읽기 |
| `location_logs` | 위치 기록 | 본인 데이터만 |
| `system_audit_logs` | 감사 로그 | 관리자만 |

### Hooks 아키텍처

| Hook | 역할 |
|:---|:---|
| `useRealtimeHospitals` | 병원 + 병상 데이터 통합 조회 |
| `useAmbulanceTrips` | 이송 중 구급차 실시간 추적 |
| `useDriverPresence` | 기사 위치 실시간 공유/수신 |
| `useDispatchRequests` | 배차 요청 관리 |
| `useDrivingLogs` | 운행 일지 CRUD |
| `useFamilyMembersSupabase` | 가족 카드 (클라우드) |
| `useFamilyMembers` | 가족 카드 (로컬) |
| `useHolidayPharmacies` | 공휴일 약국 |
| `useNearbyPharmacies` | GPS 기반 주변 약국 |
| `useNursingHospitals` | 요양병원 |
| `useMoonlightHospitals` | 달빛소아 병원 |
| `useRejectionLogs` | 거절 이력 관리 |
| `useSharedRejectionLogs` | 거절 이력 공유/경고 |
| `useAuth` | 인증 상태 관리 |

---

## 18. 인증 및 보안

### 인증 방식

- 이메일/비밀번호 기반 회원가입/로그인
- Supabase Auth 사용

### 사용자 역할

| 역할 | 설명 | 접근 권한 |
|:---|:---|:---|
| `guardian` | 보호자/일반 사용자 | 지도, 가족 카드, 가이드 |
| `driver` | 사설구급차 기사 | 위 + 기사 대시보드 |
| `admin` | 관리자 | 위 + 관리자 페이지 |

### RLS 정책

- 사용자 데이터 (`family_members`, `driving_logs` 등): 본인만 CRUD
- 공공 데이터 (`hospitals`, `hospital_status_cache`): 전체 읽기 허용
- 관리자 데이터 (`system_audit_logs`): admin 역할만 접근

### 가족 카드 보안

- PIN 잠금 기능 (FamilyPinLock)
- 클라우드 저장 시 RLS로 보호
- 비로그인 시 localStorage 폴백 (보안 경고 표시)

---

## 19. PWA 및 오프라인 지원

### PWA 설정

| 항목 | 값 |
|:---|:---|
| manifest | `/manifest.webmanifest` |
| 아이콘 | 192x192, 512x512 |
| 테마 색상 | `#0055FF` |
| 상태 바 | `black-translucent` |

### 오프라인 배너 (OfflineBanner)

- 네트워크 끊김 시 상단에 알림 배너 표시
- 마지막 캐시 데이터로 기본 기능 유지

---

## 20. Edge Functions

| 함수명 | 용도 |
|:---|:---|
| `fetch-er-data` | 도시별 실시간 병상 데이터 조회 (NEDIS API) |
| `sync-hospitals` | 지역별 병원 메타데이터 동기화 |
| `sync-hospitals-nationwide` | 전국 일괄 동기화 |
| `fetch-hospital-details` | 병원 상세 정보 조회 |
| `fetch-holiday-pharmacies` | 공휴일 약국 데이터 |
| `fetch-nearby-pharmacies` | GPS 기반 주변 약국 |
| `fetch-nursing-hospitals` | 요양병원 데이터 |
| `fetch-moonlight-hospitals` | 달빛소아 병원 데이터 |
| `fetch-fire119-stats` | 소방청 119 통계 |
| `calculate-acceptance-rate` | AI 수용률 계산 |
| `parse-patient-info` | 환자 정보 AI 파싱 |
| `sync-pharmacies` | 약국 데이터 동기화 |

---

## 📅 변경 이력

| 날짜 | 변경 사항 |
|:---|:---|
| 2026-02-11 | 전체 플랫폼 기술명세서 v2.0 작성 |
| 2026-02-11 | 모드별 119 버튼 노출 로직 3단계 개선 문서화 |

---

*본 문서는 Find-ER 플랫폼의 전체 기능, UI/UX, 기술 아키텍처를 포괄하는 공식 기술명세서입니다.*
