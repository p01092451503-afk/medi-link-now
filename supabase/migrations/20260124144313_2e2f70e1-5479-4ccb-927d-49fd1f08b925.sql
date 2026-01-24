-- Create function to update timestamps (if not exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create family_members table for storing patient medical cards
CREATE TABLE public.family_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  relation TEXT NOT NULL,
  blood_type TEXT NOT NULL DEFAULT 'unknown',
  chronic_diseases TEXT[] DEFAULT '{}',
  allergies TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- Users can only view their own family members
CREATE POLICY "Users can view their own family members"
ON public.family_members
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own family members
CREATE POLICY "Users can create their own family members"
ON public.family_members
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own family members
CREATE POLICY "Users can update their own family members"
ON public.family_members
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own family members
CREATE POLICY "Users can delete their own family members"
ON public.family_members
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_family_members_updated_at
BEFORE UPDATE ON public.family_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries by user_id
CREATE INDEX idx_family_members_user_id ON public.family_members(user_id);