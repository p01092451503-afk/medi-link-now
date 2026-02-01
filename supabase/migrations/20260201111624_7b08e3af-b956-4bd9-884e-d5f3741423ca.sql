-- Update RLS policy to allow all authenticated drivers to view rejection logs from all drivers
-- This enables the shared "real-time admission signal" feature

-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Drivers can view their own rejection logs" ON public.hospital_rejection_logs;

-- Create a new policy that allows all authenticated users to view all rejection logs
CREATE POLICY "Authenticated users can view all rejection logs" 
ON public.hospital_rejection_logs 
FOR SELECT 
USING (auth.uid() IS NOT NULL);