
-- Fix push_subscriptions RLS: remove overly permissive policies
DROP POLICY IF EXISTS "Anyone can view their own subscription" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Anyone can delete push subscription" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Anyone can create push subscription" ON public.push_subscriptions;

CREATE POLICY "Service can manage subscriptions"
  ON public.push_subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- Fix hospital_status_cache RLS: restrict write to service_role
DROP POLICY IF EXISTS "Service can update hospital status" ON public.hospital_status_cache;

CREATE POLICY "Service role only write"
  ON public.hospital_status_cache FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
