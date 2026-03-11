
CREATE OR REPLACE FUNCTION public.sync_has_pediatric_from_bed_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.pediatric_beds > 0 THEN
    UPDATE public.hospitals
    SET has_pediatric = true, updated_at = now()
    WHERE id = NEW.hospital_id AND (has_pediatric IS NULL OR has_pediatric = false);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_has_pediatric
AFTER INSERT OR UPDATE OF pediatric_beds ON public.hospital_status_cache
FOR EACH ROW
EXECUTE FUNCTION public.sync_has_pediatric_from_bed_status();
