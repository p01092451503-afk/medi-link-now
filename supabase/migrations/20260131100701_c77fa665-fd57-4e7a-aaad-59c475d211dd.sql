-- Add new columns to family_members table for Medical Passport feature
ALTER TABLE public.family_members
ADD COLUMN IF NOT EXISTS birth_date DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(5,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS medications TEXT[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS guardian_contact TEXT DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.family_members.birth_date IS 'Date of birth for age calculation';
COMMENT ON COLUMN public.family_members.weight_kg IS 'Weight in kg, especially important for pediatric patients';
COMMENT ON COLUMN public.family_members.medications IS 'Current medications being taken';
COMMENT ON COLUMN public.family_members.guardian_contact IS 'Emergency contact number for guardian';