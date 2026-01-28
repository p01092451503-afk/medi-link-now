-- Create enum for trip status
CREATE TYPE public.ambulance_trip_status AS ENUM ('en_route', 'arrived', 'cancelled');

-- Create table for tracking active ambulance trips
CREATE TABLE public.active_ambulance_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL,
  driver_name TEXT,
  destination_hospital_id INTEGER NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  destination_hospital_name TEXT NOT NULL,
  origin_lat DOUBLE PRECISION,
  origin_lng DOUBLE PRECISION,
  current_lat DOUBLE PRECISION,
  current_lng DOUBLE PRECISION,
  status ambulance_trip_status NOT NULL DEFAULT 'en_route',
  patient_condition TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  estimated_arrival_minutes INTEGER,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.active_ambulance_trips ENABLE ROW LEVEL SECURITY;

-- Anyone can view active trips (for en-route count visibility)
CREATE POLICY "Anyone can view active trips"
  ON public.active_ambulance_trips
  FOR SELECT
  USING (true);

-- Authenticated drivers can create trips
CREATE POLICY "Drivers can create trips"
  ON public.active_ambulance_trips
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = driver_id);

-- Drivers can update their own trips
CREATE POLICY "Drivers can update their trips"
  ON public.active_ambulance_trips
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = driver_id);

-- Drivers can delete their own trips
CREATE POLICY "Drivers can delete their trips"
  ON public.active_ambulance_trips
  FOR DELETE
  TO authenticated
  USING (auth.uid() = driver_id);

-- Create index for fast hospital lookup
CREATE INDEX idx_active_trips_hospital ON public.active_ambulance_trips(destination_hospital_id, status);
CREATE INDEX idx_active_trips_driver ON public.active_ambulance_trips(driver_id);

-- Create trigger for updated_at
CREATE TRIGGER update_active_ambulance_trips_updated_at
  BEFORE UPDATE ON public.active_ambulance_trips
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.active_ambulance_trips;