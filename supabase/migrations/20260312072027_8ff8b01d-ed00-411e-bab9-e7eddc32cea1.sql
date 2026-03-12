
-- ============================================
-- PHASE 2: Payment RLS hardening
-- ============================================

-- Fix payment_records: Remove overly permissive "Service can manage payments"
DROP POLICY IF EXISTS "Service can manage payments" ON public.payment_records;

CREATE POLICY "Service role can manage payments"
ON public.payment_records
FOR ALL
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

-- Fix payments: Remove overly permissive "Service can manage payments"
DROP POLICY IF EXISTS "Service can manage payments" ON public.payments;

CREATE POLICY "Service role can manage payments"
ON public.payments
FOR ALL
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

-- Fix hospital_acceptance_stats: Remove overly permissive "Service can manage acceptance stats"
DROP POLICY IF EXISTS "Service can manage acceptance stats" ON public.hospital_acceptance_stats;

CREATE POLICY "Service role can manage acceptance stats"
ON public.hospital_acceptance_stats
FOR ALL
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

-- Fix pharmacies: Remove overly permissive "Service can manage pharmacies"
DROP POLICY IF EXISTS "Service can manage pharmacies" ON public.pharmacies;

CREATE POLICY "Service role can manage pharmacies"
ON public.pharmacies
FOR ALL
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

-- Add terms_agreed_at column to user_roles for tracking consent
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS terms_agreed_at timestamp with time zone;
