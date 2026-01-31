# Find-ER (파인더) 기능 명세서

## 📱 프로젝트 개요

**Find-ER**는 대한민국 응급실 병상 가용성을 실시간으로 확인할 수 있는 모바일 우선 플랫폼입니다. 일반 사용자(보호자/환자)와 전문 구급대원(사설구급차 기사) 두 그룹을 타겟으로 합니다.

### 브랜딩
- **영문명**: Find-ER
- **한글명**: 파인더 (Finder 발음)
- **비즈니스 모델**: 사설구급차 기사용 유료 도구/구독 + 일반인용 무료 응급 정보 제공

---

## 🗺️ 핵심 기능: 실시간 응급실 지도

### 1. 병원 마커 시스템

| 항목 | 스펙 |
|------|------|
| **마커 색상** | 🟢 여유(3+병상), 🟡 제한(1-2병상), 🔴 만실(0병상) |
| **응급의료기관 등급 표시** | 권역센터(빨강), 지역센터(주황), 지역기관(파랑) |
| **소아 병상 뱃지** | 👶 노란색 원형 뱃지 (소아 병상 보유 시) |
| **외상센터 뱃지** | ✚ 보라색 십자가 뱃지 |
| **병상 수 표시** | 마커 중앙에 가용 병상 수 숫자 표시 |

### 2. 필터 시스템

| 필터 | 설명 |
|------|------|
| 전체 | 모든 병상 합계 |
| 일반(성인) | 성인용 일반 병상 |
| 소아 | 소아 전용 병상 |
| 음압(발열) | 감염병 환자용 음압 병상 |
| 외상센터 | 외상센터만 표시 |

### 3. 지역 선택기

- **전국**: 17개 시도 선택 가능
- **세부 지역**: 구/군 단위 선택
- **지도 연동**: 지역 선택 시 해당 지역으로 자동 이동

### 4. 외상센터 스마트 추천

선택한 지역에 외상센터가 없을 경우 자동으로 가장 가까운 외상센터를 추천합니다.

| 항목 | 스펙 |
|------|------|
| 트리거 | 외상센터 필터 + 해당 지역에 외상센터 없음 |
| 표시 정보 | 병원명, 거리(km), 예상 도착 시간 |
| 자동 닫힘 | 5초 후 자동 dismiss |
| 액션 | "바로가기" 버튼 → 해당 병원으로 이동 + 상세 정보 |

### 5. 지도 경계 제한

- **영역**: 대한민국 내로 제한
- **경계**: [33.0, 124.0] ~ [38.8, 131.0]
- **동작**: 경계 밖으로 이동 불가

---

## 🏥 병원 상세 정보 (Bottom Sheet)

### 기본 정보

| 필드 | 설명 |
|------|------|
| 병원명 | 한글/영문 |
| 등급 | 권역응급의료센터, 지역응급의료센터, 지역응급의료기관 |
| 전화번호 | 응급실 직통 |
| 주소 | 전체 주소 |
| 거리 | 사용자 위치 기준 (km) |

### 실시간 병상 현황

| 병상 유형 | 설명 |
|----------|------|
| 일반 병상 | 성인 응급환자용 |
| 소아 병상 | 소아 전용 응급 병상 |
| 음압 병상 | 감염병 환자용 격리 병상 |

### 시술 가능 여부 그리드

심장, 뇌, CT, MRI, 혈관조영술 등 주요 시술 가능 여부를 아이콘으로 표시

### 🤖 AI 예측 분석 (Beta)

#### 1. 병상 소진율 예측 (Bed Burn-Rate)
- 트렌드 분석 기반 소진/안정 뱃지
- 표시: "소진 중" / "안정" / "증가 중"

#### 2. Shadow Demand (잠재 수요)
```
실제 가용 병상 = 공식 병상 수 - 이송 중인 구급차 수
```
- 실시간 구급차 추적 데이터 활용
- 더 정확한 병상 가용성 예측

#### 3. 안전 도착 확률 (Safe Arrival Score)

| 확률 | 표시 | 의미 |
|------|------|------|
| 95%+ | 🟢 안전 | 병상 확보 가능성 높음 |
| 70-94% | 🟡 주의 | 병상 확보 불확실 |
| <70% | 🔴 위험 | 병상 부족 가능성 높음 |

### 액션 버튼

| 버튼 | 기능 |
|------|------|
| 📞 전화 | 응급실 직통 전화 연결 |
| 🧭 길찾기 | 카카오맵/네이버맵 연동 |
| 🚑 구급차 호출 | 사설 구급차 배차 요청 |

---

## 🚑 사설 구급차 호출 시스템

### 호출 모달 (AmbulanceCallModal)

| 필드 | 설명 |
|------|------|
| 출발지 | 사용자 현재 위치 또는 수동 입력 |
| 목적지 | 선택한 병원 |
| 환자 정보 | 가족 카드 연동 또는 수동 입력 |
| 예상 요금 | 거리 기반 자동 계산 |

### 배차 상태 머신

```
searching → found → en_route → arrived
   ↓
cancelled
```

| 상태 | 설명 |
|------|------|
| `searching` | 기사 탐색 중 |
| `found` | 기사 배정 완료 |
| `en_route` | 이송 중 |
| `arrived` | 도착 완료 |
| `cancelled` | 취소됨 |

---

## 👨‍👩‍👧‍👦 가족 의료 카드 시스템

### 저장 정보

| 필드 | 타입 | 설명 |
|------|------|------|
| name | string | 이름 |
| age | number | 나이 |
| relation | string | 관계 (본인, 배우자, 자녀 등) |
| blood_type | string | 혈액형 (A+, B-, O+ 등) |
| chronic_diseases | string[] | 만성질환 목록 |
| allergies | string[] | 알레르기 목록 |
| notes | string | 추가 메모 |

### 저장 방식

| 사용자 유형 | 저장소 |
|------------|--------|
| 로그인 사용자 | Supabase `family_members` 테이블 |
| 비로그인 사용자 | localStorage 폴백 |

### 연동 기능

- 구급차 호출 시 "이 환자로 호출" 버튼
- 환자 정보 자동 채움으로 응급 상황 시 시간 절약

---

## 🚗 기사용 Pro 대시보드

### 1. 운행 통계 위젯 (DrivingStatsWidget)

| 지표 | 설명 |
|------|------|
| 오늘 운행 횟수 | 당일 완료된 이송 건수 |
| 총 운행 거리 | 누적 운행 거리 (km) |
| 평균 운행 시간 | 건당 평균 소요 시간 |

### 2. 운행 관리 (TripManagementWidget)

- **"이송 시작" 버튼**: 목적지 병원 선택 후 즉시 운행 시작
- **실시간 위치 추적**: 백그라운드에서 위치 데이터 수집
- **자동 기록 생성**: 도착 시 운행 기록 자동 저장

### 3. 수익 탭 (RevenueTab)

| 기능 | 설명 |
|------|------|
| 귀환 이송 매칭 | 빈 차 복귀 시 환자 매칭 |
| 실시간 요청 목록 | 주변 귀환 이송 요청 표시 |
| 예상 수익 | 건당 예상 수익금 표시 |

### 4. 환자 정보 공유 (PatientInfoModal)

- AI 음성-텍스트 변환 지원
- 구조화된 환자 정보 자동 생성
- 병원 측에 환자 상태 사전 공유

### 5. 운행 기록 히스토리 (DrivingLogHistory)

- 과거 운행 기록 조회
- 날짜별/기간별 필터링
- PDF 다운로드 기능

---

## 📍 실시간 기사 위치 표시

### DriverPresence 시스템

| 필드 | 타입 | 설명 |
|------|------|------|
| id | string | 기사 고유 ID |
| name | string | 기사 이름 |
| lat | number | 위도 |
| lng | number | 경도 |
| status | enum | available, busy, offline |
| vehicle_type | string | 차량 유형 |

### 지도 표시

- 🚑 아이콘으로 기사 위치 실시간 표시
- 클릭 시 기사 정보 팝업 + "호출하기" 버튼

---

## 💊 공휴일 약국 표시

### HolidayPharmacy

| 필드 | 설명 |
|------|------|
| id | 약국 고유 ID |
| name | 약국명 |
| lat, lng | 위치 좌표 |
| phone | 전화번호 |
| hours | 운영 시간 |

- 💊 아이콘으로 지도에 표시
- 공휴일/야간 운영 약국 정보 제공

---

## 🔴 실시간 제보 시스템 (LiveReport)

### 제보 유형

| 유형 | 설명 |
|------|------|
| accident | 사고 현장 |
| traffic | 교통 정체 |
| emergency | 기타 응급 상황 |

### 표시

- 지도에 마커로 표시
- 제보 시간, 내용 팝업
- 실시간 업데이트

---

## 🔐 인증 시스템

### 지원 역할

| 역할 | 설명 |
|------|------|
| `guardian` | 보호자/일반 사용자 |
| `driver` | 사설구급차 기사 |

### 관련 테이블

- `user_roles`: 사용자별 역할 매핑
- `display_name`: 표시 이름 저장

---

## 🗄️ 데이터 아키텍처

### 하이브리드 접근법

| 데이터 유형 | 저장소 | 업데이트 주기 |
|------------|--------|--------------|
| 병원 메타데이터 | Supabase `hospitals` | 정적 (변경 시) |
| 실시간 병상 현황 | `hospital_status_cache` | 5분 |
| 구급차 이송 현황 | `active_ambulance_trips` | 실시간 |

### 주요 테이블

```sql
-- 전국 응급의료기관 정보
hospitals (
  id, hpid, name, name_en, address, phone,
  lat, lng, entrance_lat, entrance_lng,
  category, region, sub_region,
  is_trauma_center, has_pediatric,
  equipment[], emergency_grade
)

-- 실시간 병상 캐시
hospital_status_cache (
  hospital_id, hpid,
  general_beds, pediatric_beds, isolation_beds,
  last_updated
)

-- 이송 중인 구급차
active_ambulance_trips (
  id, driver_id, driver_name,
  destination_hospital_id, destination_hospital_name,
  status, current_lat, current_lng,
  origin_lat, origin_lng,
  patient_condition, estimated_arrival_minutes
)

-- 배차 요청
ambulance_dispatch_requests (
  id, requester_id, driver_id,
  pickup_location, pickup_lat, pickup_lng,
  destination, destination_lat, destination_lng,
  patient_name, patient_condition,
  estimated_fee, estimated_distance_km, status
)

-- 가족 의료 카드
family_members (
  id, user_id, name, age, relation,
  blood_type, chronic_diseases[], allergies[], notes
)

-- 사용자 역할
user_roles (
  id, user_id, role, display_name
)

-- 귀환 이송 요청
return_trip_requests (
  id, patient_name, pickup_location, pickup_city,
  destination, destination_city, distance,
  estimated_fee, patient_condition, status
)
```

---

## 📄 라우팅 구조

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/` | Landing | 랜딩 페이지 (역할 선택) |
| `/guardian` | GuardianLanding | 보호자용 소개 페이지 |
| `/driver-intro` | DriverLanding | 기사용 소개 페이지 |
| `/map` | MapPage | 메인 지도 (핵심 기능) |
| `/family` | FamilyPage | 가족 의료 카드 관리 |
| `/login` | Login | 로그인/회원가입 |
| `/driver` | DriverDashboard | 기사 전용 대시보드 |
| `/admin` | AdminPage | 관리자 페이지 |
| `/install` | InstallPage | PWA 설치 안내 |
| `/terms` | TermsPage | 이용약관 |
| `/privacy` | PrivacyPage | 개인정보처리방침 |

---

## 🛠️ 기술 스택

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Animation**: Framer Motion

### 지도
- **Library**: Leaflet, react-leaflet
- **Clustering**: react-leaflet-cluster

### 상태 관리
- **Server State**: TanStack Query (React Query)
- **Form**: React Hook Form + Zod

### Backend (Lovable Cloud)
- **Database**: PostgreSQL (Supabase)
- **Auth**: Supabase Auth
- **Realtime**: Supabase Realtime
- **Edge Functions**: Deno

### 기타
- **Charts**: Recharts
- **PDF**: jsPDF, jspdf-autotable
- **Date**: date-fns

---

## 📱 PWA 지원

- 홈 화면 추가 가능
- 오프라인 기본 지원
- 푸시 알림 (병상 모니터링)

---

## 🔒 보안

### RLS (Row Level Security)

모든 사용자 데이터 테이블에 RLS 정책 적용:
- 사용자는 본인 데이터만 CRUD 가능
- 병원 데이터는 공개 읽기 허용

---

## 📅 업데이트 이력

| 날짜 | 변경 사항 |
|------|----------|
| 2025-01-31 | 초기 기능 명세서 작성 |

---

## 📞 문의

프로젝트 관련 문의는 관리자에게 연락해주세요.
