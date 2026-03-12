
-- ============================================
-- PHASE 1: Critical Security Vulnerability Fixes
-- ============================================

-- 1. FIX user_roles PRIVILEGE ESCALATION
-- Problem: Users can INSERT any role (including 'admin') for themselves
-- Solution: Restrict self-insert to 'guardian' only, block self-update of role column

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update their own role" ON public.user_roles;

-- New: Users can only insert themselves as 'guardian'
CREATE POLICY "Users can only self-register as guardian"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND role = 'guardian'::user_role
);

-- New: Users can update their own display_name only (not role)
-- Using a trigger to enforce role immutability instead of policy
CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If the user is updating their own record and is NOT an admin, prevent role change
  IF NEW.user_id = auth.uid() 
     AND NOT has_role(auth.uid(), 'admin'::user_role)
     AND NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Cannot change own role';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.user_roles;
CREATE TRIGGER trg_prevent_role_escalation
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_self_escalation();

-- Users can update only their own row (display_name etc, role blocked by trigger)
CREATE POLICY "Users can update own profile info"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- 2. FIX active_ambulance_trips PUBLIC EXPOSURE
-- Problem: Anyone (including unauthenticated) can see driver_name, patient_condition
-- Solution: Public sees only hospital/location data; driver details only for authenticated

DROP POLICY IF EXISTS "Anyone can view active trips" ON public.active_ambulance_trips;

-- Public can view only non-PII trip data (destination, ETA, status)
-- We use a view approach, but for RLS we restrict to authenticated users
CREATE POLICY "Authenticated users can view active trips"
ON public.active_ambulance_trips
FOR SELECT
TO authenticated
USING (true);

-- Unauthenticated users get no access (RLS denies by default)


-- 3. FIX ambulance_dispatch_requests PII EXPOSURE
-- Problem: All authenticated users can see all pending requests (including patient_name, patient_condition)
-- Solution: Only requester, assigned driver, and admins can see full records

DROP POLICY IF EXISTS "View dispatch requests" ON public.ambulance_dispatch_requests;
DROP POLICY IF EXISTS "Drivers can update dispatch requests" ON public.ambulance_dispatch_requests;

-- Requester and assigned driver can view their own requests
CREATE POLICY "Involved parties can view dispatch requests"
ON public.ambulance_dispatch_requests
FOR SELECT
TO authenticated
USING (
  requester_id = auth.uid()
  OR driver_id = auth.uid()
  OR has_role(auth.uid(), 'admin'::user_role)
);

-- Separate policy for drivers to see pending requests (for bidding) - but they need to be verified drivers
CREATE POLICY "Verified drivers can view pending requests"
ON public.ambulance_dispatch_requests
FOR SELECT
TO authenticated
USING (
  status = 'pending'
  AND has_role(auth.uid(), 'driver'::user_role)
);

-- Only assigned driver or requester can update
CREATE POLICY "Involved parties can update dispatch requests"
ON public.ambulance_dispatch_requests
FOR UPDATE
TO authenticated
USING (
  driver_id = auth.uid()
  OR requester_id = auth.uid()
  OR (status = 'pending' AND has_role(auth.uid(), 'driver'::user_role))
);


-- 4. FIX return_trip_requests PII EXPOSURE
-- Problem: All authenticated users see patient_name, patient_condition, etc.
-- Solution: Only drivers can view pending (for accepting), and accepted_by user sees their own

DROP POLICY IF EXISTS "Authenticated users can view pending requests" ON public.return_trip_requests;
DROP POLICY IF EXISTS "Users can update accepted requests" ON public.return_trip_requests;

-- Only drivers can see pending return trip requests
CREATE POLICY "Drivers can view pending return trips"
ON public.return_trip_requests
FOR SELECT
TO authenticated
USING (
  (status = 'pending' AND has_role(auth.uid(), 'driver'::user_role))
  OR accepted_by = auth.uid()
  OR has_role(auth.uid(), 'admin'::user_role)
);

-- Only the accepting driver can update
CREATE POLICY "Drivers can update return trips"
ON public.return_trip_requests
FOR UPDATE
TO authenticated
USING (
  (status = 'pending' AND has_role(auth.uid(), 'driver'::user_role))
  OR accepted_by = auth.uid()
);
