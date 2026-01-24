-- Create ambulance_dispatch_requests table for call requests
CREATE TABLE public.ambulance_dispatch_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID, -- nullable for guest users
  driver_id UUID, -- assigned driver
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, en_route, arrived, completed, cancelled
  patient_name TEXT,
  patient_condition TEXT,
  pickup_location TEXT NOT NULL,
  pickup_lat DOUBLE PRECISION NOT NULL,
  pickup_lng DOUBLE PRECISION NOT NULL,
  destination TEXT,
  destination_lat DOUBLE PRECISION,
  destination_lng DOUBLE PRECISION,
  estimated_distance_km DOUBLE PRECISION,
  estimated_fee INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ambulance_dispatch_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can create a dispatch request (guest or logged in)
CREATE POLICY "Anyone can create dispatch request"
ON public.ambulance_dispatch_requests FOR INSERT
WITH CHECK (true);

-- Users can view their own requests or drivers can see pending/their assigned requests
CREATE POLICY "View dispatch requests"
ON public.ambulance_dispatch_requests FOR SELECT
USING (
  requester_id = auth.uid() 
  OR driver_id = auth.uid() 
  OR (status = 'pending' AND auth.uid() IS NOT NULL)
);

-- Drivers can accept/update requests
CREATE POLICY "Drivers can update dispatch requests"
ON public.ambulance_dispatch_requests FOR UPDATE
USING (
  driver_id = auth.uid() 
  OR (status = 'pending' AND auth.uid() IS NOT NULL)
  OR requester_id = auth.uid()
);

-- Trigger for updated_at
CREATE TRIGGER update_dispatch_updated_at
BEFORE UPDATE ON public.ambulance_dispatch_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for dispatch requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.ambulance_dispatch_requests;