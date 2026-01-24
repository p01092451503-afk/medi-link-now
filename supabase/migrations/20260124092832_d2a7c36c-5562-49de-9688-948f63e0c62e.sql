-- 푸시 알림 구독 테이블
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 병원 모니터링 (알림 받을 병원) 테이블
CREATE TABLE public.hospital_monitors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID NOT NULL REFERENCES public.push_subscriptions(id) ON DELETE CASCADE,
  hospital_id INTEGER NOT NULL,
  hospital_name TEXT NOT NULL,
  bed_type TEXT NOT NULL DEFAULT 'all', -- 'all', 'general', 'pediatric', 'isolation'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(subscription_id, hospital_id, bed_type)
);

-- 병원 가용성 상태 추적 테이블 (변경 감지용)
CREATE TABLE public.hospital_status_cache (
  id SERIAL PRIMARY KEY,
  hospital_id INTEGER NOT NULL UNIQUE,
  general_beds INTEGER NOT NULL DEFAULT 0,
  pediatric_beds INTEGER NOT NULL DEFAULT 0,
  isolation_beds INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_monitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_status_cache ENABLE ROW LEVEL SECURITY;

-- 공개 구독 정책 (익명 사용자도 구독 가능)
CREATE POLICY "Anyone can create push subscription" 
ON public.push_subscriptions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view their own subscription" 
ON public.push_subscriptions 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can delete push subscription" 
ON public.push_subscriptions 
FOR DELETE 
USING (true);

-- 병원 모니터링 정책
CREATE POLICY "Anyone can create monitor" 
ON public.hospital_monitors 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view monitors" 
ON public.hospital_monitors 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can delete monitor" 
ON public.hospital_monitors 
FOR DELETE 
USING (true);

-- 병원 상태 캐시 정책
CREATE POLICY "Anyone can view hospital status" 
ON public.hospital_status_cache 
FOR SELECT 
USING (true);

CREATE POLICY "Service can update hospital status" 
ON public.hospital_status_cache 
FOR ALL 
USING (true);