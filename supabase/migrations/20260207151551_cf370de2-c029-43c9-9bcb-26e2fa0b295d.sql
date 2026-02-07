
-- 전국 약국 데이터 캐싱용 pharmacies 테이블
CREATE TABLE public.pharmacies (
  id SERIAL PRIMARY KEY,
  hpid TEXT UNIQUE,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  
  -- 운영시간 (HHMM 형식)
  duty_time_1s TEXT, -- 월요일 시작
  duty_time_1c TEXT, -- 월요일 종료
  duty_time_2s TEXT, -- 화요일 시작
  duty_time_2c TEXT, -- 화요일 종료
  duty_time_3s TEXT, -- 수요일 시작
  duty_time_3c TEXT, -- 수요일 종료
  duty_time_4s TEXT, -- 목요일 시작
  duty_time_4c TEXT, -- 목요일 종료
  duty_time_5s TEXT, -- 금요일 시작
  duty_time_5c TEXT, -- 금요일 종료
  duty_time_6s TEXT, -- 토요일 시작
  duty_time_6c TEXT, -- 토요일 종료
  duty_time_7s TEXT, -- 일요일 시작
  duty_time_7c TEXT, -- 일요일 종료
  duty_time_8s TEXT, -- 공휴일 시작
  duty_time_8c TEXT, -- 공휴일 종료
  
  -- 분류 플래그
  is_night_pharmacy BOOLEAN DEFAULT false,
  is_24h BOOLEAN DEFAULT false,
  
  -- 메타데이터
  region TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pharmacies ENABLE ROW LEVEL SECURITY;

-- 누구나 약국 조회 가능 (공공 데이터)
CREATE POLICY "Anyone can view pharmacies"
  ON public.pharmacies FOR SELECT
  USING (true);

-- Edge Function (service role)이 데이터를 삽입/갱신할 수 있도록
CREATE POLICY "Service can manage pharmacies"
  ON public.pharmacies FOR ALL
  USING (true);

-- 인덱스: 좌표 기반 검색 최적화
CREATE INDEX idx_pharmacies_lat_lng ON public.pharmacies (lat, lng);
CREATE INDEX idx_pharmacies_night ON public.pharmacies (is_night_pharmacy) WHERE is_night_pharmacy = true;
CREATE INDEX idx_pharmacies_24h ON public.pharmacies (is_24h) WHERE is_24h = true;
CREATE INDEX idx_pharmacies_region ON public.pharmacies (region);
CREATE INDEX idx_pharmacies_hpid ON public.pharmacies (hpid);

-- updated_at 자동 갱신 트리거
CREATE TRIGGER update_pharmacies_updated_at
  BEFORE UPDATE ON public.pharmacies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
