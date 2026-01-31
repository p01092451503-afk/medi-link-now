-- Add gender column to family_members table
ALTER TABLE public.family_members 
ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'unknown';

-- Add constraint for valid gender values
ALTER TABLE public.family_members 
ADD CONSTRAINT family_members_gender_check 
CHECK (gender IN ('male', 'female', 'unknown'));