
-- Create hospital_live_reports table for crowdsourced ER status
CREATE TABLE public.hospital_live_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id integer NOT NULL REFERENCES public.hospitals(id),
  reporter_id uuid NOT NULL,
  status_level text NOT NULL CHECK (status_level IN ('available', 'busy', 'full')),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  valid_until timestamptz NOT NULL DEFAULT (now() + interval '30 minutes')
);

-- Add constraint for comment length
ALTER TABLE public.hospital_live_reports
  ADD CONSTRAINT comment_max_length CHECK (char_length(comment) <= 100);

-- Enable RLS
ALTER TABLE public.hospital_live_reports ENABLE ROW LEVEL SECURITY;

-- Anyone can view live reports
CREATE POLICY "Anyone can view live reports"
  ON public.hospital_live_reports
  FOR SELECT
  USING (true);

-- Only drivers can insert reports (using existing has_role function)
CREATE POLICY "Drivers can insert live reports"
  ON public.hospital_live_reports
  FOR INSERT
  WITH CHECK (
    auth.uid() = reporter_id
    AND has_role(auth.uid(), 'driver'::user_role)
  );

-- Reporters can delete their own reports
CREATE POLICY "Reporters can delete own reports"
  ON public.hospital_live_reports
  FOR DELETE
  USING (auth.uid() = reporter_id);

-- Index for fast lookups by hospital
CREATE INDEX idx_live_reports_hospital_valid
  ON public.hospital_live_reports (hospital_id, valid_until DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.hospital_live_reports;
