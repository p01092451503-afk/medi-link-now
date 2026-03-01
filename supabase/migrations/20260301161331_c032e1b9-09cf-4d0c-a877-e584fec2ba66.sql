
-- Payment records table for TossPayments integration
CREATE TABLE public.payment_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES public.ambulance_dispatch_requests(id),
  user_id uuid NOT NULL,
  driver_id uuid,
  amount integer NOT NULL,
  platform_fee integer NOT NULL DEFAULT 0,
  driver_settlement integer NOT NULL DEFAULT 0,
  payment_key text,
  order_id text NOT NULL,
  payment_method text,
  payment_status text NOT NULL DEFAULT 'pending',
  is_deferred boolean NOT NULL DEFAULT false,
  deferred_reason text,
  driver_consent boolean DEFAULT false,
  settled boolean NOT NULL DEFAULT false,
  settled_at timestamptz,
  settlement_week text,
  receipt_url text,
  origin text,
  destination text,
  distance_km double precision,
  vehicle_type text DEFAULT 'general',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own payments"
  ON public.payment_records FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = driver_id);

CREATE POLICY "Users can create payments"
  ON public.payment_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service can manage payments"
  ON public.payment_records FOR ALL
  USING (true);

CREATE POLICY "Admins can manage all payments"
  ON public.payment_records FOR ALL
  USING (has_role(auth.uid(), 'admin'::user_role));

-- Updated_at trigger
CREATE TRIGGER update_payment_records_updated_at
  BEFORE UPDATE ON public.payment_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for settlement queries
CREATE INDEX idx_payment_records_settlement ON public.payment_records(driver_id, settled, payment_status);
CREATE INDEX idx_payment_records_user ON public.payment_records(user_id, created_at DESC);
