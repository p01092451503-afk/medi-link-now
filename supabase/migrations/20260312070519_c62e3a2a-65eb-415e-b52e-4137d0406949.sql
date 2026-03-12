
-- Add historical acceptance columns to hospital_status_cache
ALTER TABLE public.hospital_status_cache
  ADD COLUMN IF NOT EXISTS last_acceptance_result boolean DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS historical_acceptance_rate double precision DEFAULT NULL;

-- Create trigger function to update acceptance stats on dispatch status change
CREATE OR REPLACE FUNCTION public.update_hospital_acceptance_on_dispatch()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_hospital_id integer;
  v_accepted boolean;
  v_rate double precision;
BEGIN
  -- Only fire when status changes to completed or rejected
  IF NEW.status NOT IN ('completed', 'rejected') THEN
    RETURN NEW;
  END IF;
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get hospital_id from destination_lat/lng match or skip if no destination
  IF NEW.destination_lat IS NULL OR NEW.destination_lng IS NULL THEN
    RETURN NEW;
  END IF;

  -- Find closest hospital within 2km
  SELECT id INTO v_hospital_id
  FROM public.hospitals
  ORDER BY (
    6371000 * 2 * asin(sqrt(
      power(sin(radians(lat - NEW.destination_lat) / 2), 2) +
      cos(radians(NEW.destination_lat)) * cos(radians(lat)) *
      power(sin(radians(lng - NEW.destination_lng) / 2), 2)
    ))
  )
  LIMIT 1;

  IF v_hospital_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_accepted := (NEW.status = 'completed');

  -- Calculate acceptance rate from last 50 completed/rejected dispatches to this hospital
  SELECT
    COALESCE(AVG(CASE WHEN sub.status = 'completed' THEN 1.0 ELSE 0.0 END), 0)
  INTO v_rate
  FROM (
    SELECT status
    FROM public.ambulance_dispatch_requests
    WHERE destination_lat IS NOT NULL
      AND destination_lng IS NOT NULL
      AND status IN ('completed', 'rejected')
      AND (
        6371000 * 2 * asin(sqrt(
          power(sin(radians((SELECT lat FROM public.hospitals WHERE id = v_hospital_id) - destination_lat) / 2), 2) +
          cos(radians(destination_lat)) * cos(radians((SELECT lat FROM public.hospitals WHERE id = v_hospital_id))) *
          power(sin(radians((SELECT lng FROM public.hospitals WHERE id = v_hospital_id) - destination_lng) / 2), 2)
        ))
      ) < 2000
    ORDER BY updated_at DESC
    LIMIT 50
  ) sub;

  -- Upsert into hospital_status_cache
  UPDATE public.hospital_status_cache
  SET last_acceptance_result = v_accepted,
      historical_acceptance_rate = v_rate
  WHERE hospital_id = v_hospital_id;

  RETURN NEW;
END;
$$;

-- Create trigger on ambulance_dispatch_requests
DROP TRIGGER IF EXISTS trg_update_hospital_acceptance ON public.ambulance_dispatch_requests;
CREATE TRIGGER trg_update_hospital_acceptance
  AFTER UPDATE ON public.ambulance_dispatch_requests
  FOR EACH ROW
  WHEN (NEW.status IN ('completed', 'rejected') AND OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.update_hospital_acceptance_on_dispatch();
