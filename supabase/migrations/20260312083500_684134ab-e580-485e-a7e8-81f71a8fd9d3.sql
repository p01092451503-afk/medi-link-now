-- Fix 1: Drop overly permissive user_roles UPDATE policy and recreate with role change restriction
DROP POLICY IF EXISTS "Users can update own profile info" ON public.user_roles;

CREATE POLICY "Users can update own profile info"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND role = role);

-- Fix 2: Drop overly permissive hospitals INSERT/UPDATE policies
DROP POLICY IF EXISTS "Authenticated users can insert hospitals" ON public.hospitals;
DROP POLICY IF EXISTS "Authenticated users can update hospitals" ON public.hospitals;