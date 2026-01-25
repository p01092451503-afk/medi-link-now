-- Add emergency_grade column to classify legal emergency medical institutions
ALTER TABLE public.hospitals 
ADD COLUMN IF NOT EXISTS emergency_grade text DEFAULT NULL;

-- Add index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_hospitals_emergency_grade ON public.hospitals(emergency_grade);

-- Update column comment for documentation
COMMENT ON COLUMN public.hospitals.emergency_grade IS '법정 응급의료기관 등급: regional_center (권역응급의료센터), local_center (지역응급의료센터), local_institution (지역응급의료기관), null (비지정)';