-- Enable realtime for hospital_status_cache table
ALTER PUBLICATION supabase_realtime ADD TABLE public.hospital_status_cache;

-- Initialize hospital status cache with mock data
INSERT INTO public.hospital_status_cache (hospital_id, general_beds, pediatric_beds, isolation_beds)
VALUES 
  (1, 5, 3, 2),
  (2, 8, 0, 4),
  (3, 0, 2, 0),
  (4, 3, 1, 1),
  (5, 2, 0, 0),
  (6, 12, 4, 3),
  (7, 0, 0, 2),
  (8, 6, 2, 1),
  (9, 1, 1, 5),
  (10, 4, 0, 1),
  (11, 7, 3, 4),
  (12, 0, 0, 0),
  (13, 3, 1, 0),
  (14, 2, 0, 1),
  (15, 9, 5, 3)
ON CONFLICT (hospital_id) DO UPDATE SET
  general_beds = EXCLUDED.general_beds,
  pediatric_beds = EXCLUDED.pediatric_beds,
  isolation_beds = EXCLUDED.isolation_beds,
  last_updated = now();

-- Add unique constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'hospital_status_cache_hospital_id_key'
  ) THEN
    ALTER TABLE public.hospital_status_cache ADD CONSTRAINT hospital_status_cache_hospital_id_key UNIQUE (hospital_id);
  END IF;
END $$;