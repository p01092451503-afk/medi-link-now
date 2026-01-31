-- Create rejection logs table for tracking hospital refusals
CREATE TABLE public.hospital_rejection_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL,
  hospital_id INTEGER NOT NULL,
  hospital_name TEXT NOT NULL,
  rejection_reason TEXT NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hospital_rejection_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Drivers can view their own rejection logs"
ON public.hospital_rejection_logs
FOR SELECT
USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can create their own rejection logs"
ON public.hospital_rejection_logs
FOR INSERT
WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Drivers can delete their own rejection logs"
ON public.hospital_rejection_logs
FOR DELETE
USING (auth.uid() = driver_id);

-- Create index for faster queries
CREATE INDEX idx_rejection_logs_driver_date ON public.hospital_rejection_logs (driver_id, recorded_at DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.hospital_rejection_logs;