ALTER TABLE public.driver_verifications 
  ADD COLUMN IF NOT EXISTS license_number TEXT,
  ADD COLUMN IF NOT EXISTS business_reg_number TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_reg_number TEXT,
  ADD COLUMN IF NOT EXISTS license_doc_url TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_doc_url TEXT;