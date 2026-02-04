-- Create location_logs table for tracking ambulance movements
CREATE TABLE public.location_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  hospital_id INTEGER REFERENCES public.hospitals(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('enter', 'exit', 'ping')),
  distance_from_hospital DOUBLE PRECISION,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX idx_location_logs_driver_recorded ON public.location_logs(driver_id, recorded_at DESC);
CREATE INDEX idx_location_logs_hospital_recorded ON public.location_logs(hospital_id, recorded_at DESC);
CREATE INDEX idx_location_logs_event_type ON public.location_logs(event_type);

-- Enable RLS
ALTER TABLE public.location_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Drivers can insert their own location logs"
ON public.location_logs
FOR INSERT
WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Authenticated users can view location logs"
ON public.location_logs
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Create hospital_acceptance_stats table for caching calculated probabilities
CREATE TABLE public.hospital_acceptance_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id INTEGER NOT NULL REFERENCES public.hospitals(id) UNIQUE,
  total_entries INTEGER NOT NULL DEFAULT 0,
  accepted_count INTEGER NOT NULL DEFAULT 0,
  rejected_count INTEGER NOT NULL DEFAULT 0,
  acceptance_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
  last_calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for stats table
ALTER TABLE public.hospital_acceptance_stats ENABLE ROW LEVEL SECURITY;

-- Anyone can view stats (public data)
CREATE POLICY "Anyone can view hospital acceptance stats"
ON public.hospital_acceptance_stats
FOR SELECT
USING (true);

-- Service can manage stats
CREATE POLICY "Service can manage acceptance stats"
ON public.hospital_acceptance_stats
FOR ALL
USING (true);

-- Enable realtime for location_logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.location_logs;