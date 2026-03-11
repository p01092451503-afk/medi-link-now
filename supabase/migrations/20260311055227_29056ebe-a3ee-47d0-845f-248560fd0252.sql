
-- 1. 기존 Mock 데이터 제거
TRUNCATE TABLE public.hospital_status_cache;

-- 2. data_source 컬럼 추가 (CHECK 대신 트리거로 검증)
ALTER TABLE public.hospital_status_cache
  ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'mock';

-- 3. data_source 값 검증 트리거
CREATE OR REPLACE FUNCTION public.validate_hospital_status_data_source()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.data_source NOT IN ('api', 'cache', 'mock') THEN
    RAISE EXCEPTION 'Invalid data_source: %. Must be api, cache, or mock.', NEW.data_source;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_hospital_status_data_source
  BEFORE INSERT OR UPDATE ON public.hospital_status_cache
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_hospital_status_data_source();

-- 4. 데이터 신선도 뷰
CREATE OR REPLACE VIEW public.hospital_status_with_age AS
SELECT *,
  EXTRACT(EPOCH FROM (now() - last_updated)) / 60 AS age_minutes,
  CASE
    WHEN EXTRACT(EPOCH FROM (now() - last_updated)) / 60 <= 10 THEN 'fresh'
    WHEN EXTRACT(EPOCH FROM (now() - last_updated)) / 60 <= 30 THEN 'stale'
    ELSE 'very_stale'
  END AS freshness
FROM public.hospital_status_cache;

-- 5. Public read 정책 (중복 방지)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'hospital_status_cache'
    AND policyname = 'Public read hospital status'
  ) THEN
    CREATE POLICY "Public read hospital status"
      ON public.hospital_status_cache FOR SELECT
      USING (true);
  END IF;
END $$;
