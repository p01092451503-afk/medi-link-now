-- Create driving_logs table for automatic trip recording
CREATE TABLE public.driving_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  start_location TEXT NOT NULL,
  start_lat DOUBLE PRECISION,
  start_lng DOUBLE PRECISION,
  end_location TEXT NOT NULL,
  end_lat DOUBLE PRECISION,
  end_lng DOUBLE PRECISION,
  distance_km DOUBLE PRECISION NOT NULL DEFAULT 0,
  duration_minutes INTEGER,
  patient_name TEXT,
  hospital_name TEXT,
  hospital_id INTEGER REFERENCES public.hospitals(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.driving_logs ENABLE ROW LEVEL SECURITY;

-- Drivers can view their own logs
CREATE POLICY "Drivers can view their own logs"
ON public.driving_logs
FOR SELECT
USING (auth.uid() = driver_id);

-- Drivers can create their own logs
CREATE POLICY "Drivers can create their own logs"
ON public.driving_logs
FOR INSERT
WITH CHECK (auth.uid() = driver_id);

-- Drivers can update their own logs
CREATE POLICY "Drivers can update their own logs"
ON public.driving_logs
FOR UPDATE
USING (auth.uid() = driver_id);

-- Drivers can delete their own logs
CREATE POLICY "Drivers can delete their own logs"
ON public.driving_logs
FOR DELETE
USING (auth.uid() = driver_id);

-- Create index for efficient queries
CREATE INDEX idx_driving_logs_driver_date ON public.driving_logs(driver_id, date DESC);