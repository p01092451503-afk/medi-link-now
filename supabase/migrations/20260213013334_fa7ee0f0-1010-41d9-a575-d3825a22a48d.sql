
-- 1. ambulance_dispatch_requests에 예약 관련 컬럼 추가
ALTER TABLE public.ambulance_dispatch_requests
ADD COLUMN IF NOT EXISTS is_scheduled boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS scheduled_time timestamp with time zone,
ADD COLUMN IF NOT EXISTS vehicle_type text DEFAULT 'standard';

-- 2. driver_locations 테이블 (실시간 위치 + 대기 상태)
CREATE TABLE IF NOT EXISTS public.driver_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  last_updated timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_driver_locations_driver_id ON public.driver_locations(driver_id);
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can manage own location" ON public.driver_locations FOR ALL USING (auth.uid() = driver_id) WITH CHECK (auth.uid() = driver_id);
CREATE POLICY "Anyone authenticated can view active drivers" ON public.driver_locations FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage driver locations" ON public.driver_locations FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

-- 3. bids 테이블 (입찰 시스템)
CREATE TABLE IF NOT EXISTS public.bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.ambulance_dispatch_requests(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL,
  bid_amount integer NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can create bids" ON public.bids FOR INSERT WITH CHECK (auth.uid() = driver_id);
CREATE POLICY "Drivers can view own bids" ON public.bids FOR SELECT USING (auth.uid() = driver_id);
CREATE POLICY "Requesters can view bids on their requests" ON public.bids FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.ambulance_dispatch_requests r WHERE r.id = request_id AND r.requester_id = auth.uid())
);
CREATE POLICY "Requesters can update bids on their requests" ON public.bids FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.ambulance_dispatch_requests r WHERE r.id = request_id AND r.requester_id = auth.uid())
);
CREATE POLICY "Admins can manage bids" ON public.bids FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

-- 4. payments 테이블 (결제/정산)
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.ambulance_dispatch_requests(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  platform_fee integer NOT NULL DEFAULT 0,
  driver_net_income integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.ambulance_dispatch_requests r WHERE r.id = request_id AND (r.requester_id = auth.uid() OR r.driver_id = auth.uid()))
);
CREATE POLICY "Service can manage payments" ON public.payments FOR ALL USING (true);
CREATE POLICY "Admins can manage payments" ON public.payments FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

-- 5. reviews 테이블 (리뷰/평점)
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES public.ambulance_dispatch_requests(id) ON DELETE SET NULL,
  driver_id uuid NOT NULL,
  reviewer_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Users can update own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = reviewer_id);
CREATE POLICY "Users can delete own reviews" ON public.reviews FOR DELETE USING (auth.uid() = reviewer_id);
CREATE POLICY "Admins can manage reviews" ON public.reviews FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

-- 6. 운행 완료 시 자동 결제 레코드 생성 + 수수료 계산 트리거
CREATE OR REPLACE FUNCTION public.create_payment_on_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.estimated_fee IS NOT NULL THEN
    INSERT INTO public.payments (request_id, amount, platform_fee, driver_net_income, status)
    VALUES (
      NEW.id,
      NEW.estimated_fee,
      ROUND(NEW.estimated_fee * 0.05),
      NEW.estimated_fee - ROUND(NEW.estimated_fee * 0.05),
      'pending'
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_create_payment_on_completion
BEFORE UPDATE ON public.ambulance_dispatch_requests
FOR EACH ROW
EXECUTE FUNCTION public.create_payment_on_completion();

-- 7. Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bids;
