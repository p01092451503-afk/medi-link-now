
-- Create driver_verifications table
CREATE TABLE public.driver_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  driver_name text NOT NULL,
  driver_phone text NOT NULL,
  license_type text, -- 'emt' (응급구조사) or 'driver_license' (운전면허)
  experience_years integer,
  verification_notes text,
  rejection_reason text,
  approved_by uuid,
  approved_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.driver_verifications ENABLE ROW LEVEL SECURITY;

-- Drivers can view their own verification
CREATE POLICY "Drivers can view own verification"
ON public.driver_verifications FOR SELECT
TO authenticated
USING (auth.uid() = driver_id);

-- Drivers can create their own verification
CREATE POLICY "Drivers can create verification"
ON public.driver_verifications FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = driver_id);

-- Drivers can update their own pending verification
CREATE POLICY "Drivers can update own pending verification"
ON public.driver_verifications FOR UPDATE
TO authenticated
USING (auth.uid() = driver_id AND status = 'pending');

-- Admins can manage all verifications
CREATE POLICY "Admins can manage all verifications"
ON public.driver_verifications FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create driver_verification_documents table
CREATE TABLE public.driver_verification_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id uuid NOT NULL REFERENCES public.driver_verifications(id) ON DELETE CASCADE,
  document_type text NOT NULL, -- 'operation_permit', 'qualification', 'vehicle_registration'
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_size integer,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.driver_verification_documents ENABLE ROW LEVEL SECURITY;

-- Drivers can view their own documents
CREATE POLICY "Drivers can view own documents"
ON public.driver_verification_documents FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.driver_verifications v
  WHERE v.id = verification_id AND v.driver_id = auth.uid()
));

-- Drivers can upload documents for their verification
CREATE POLICY "Drivers can upload documents"
ON public.driver_verification_documents FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.driver_verifications v
  WHERE v.id = verification_id AND v.driver_id = auth.uid() AND v.status = 'pending'
));

-- Admins can manage all documents
CREATE POLICY "Admins can manage all documents"
ON public.driver_verification_documents FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_driver_verifications_updated_at
BEFORE UPDATE ON public.driver_verifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for verification documents
INSERT INTO storage.buckets (id, name, public) VALUES ('driver-documents', 'driver-documents', false);

-- Storage policies
CREATE POLICY "Drivers can upload their own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'driver-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Drivers can view their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'driver-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all driver documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'driver-documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete driver documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'driver-documents' AND public.has_role(auth.uid(), 'admin'));
