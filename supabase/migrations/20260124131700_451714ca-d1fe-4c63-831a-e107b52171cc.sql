-- Create return trip requests table for empty return trip matching
CREATE TABLE public.return_trip_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_name TEXT NOT NULL,
  pickup_location TEXT NOT NULL,
  pickup_city TEXT NOT NULL,
  destination TEXT NOT NULL,
  destination_city TEXT NOT NULL,
  estimated_fee INTEGER NOT NULL,
  distance TEXT NOT NULL,
  patient_condition TEXT DEFAULT 'stable',
  patient_age TEXT,
  patient_gender TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'completed', 'cancelled')),
  accepted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.return_trip_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Anyone authenticated can view pending requests
CREATE POLICY "Authenticated users can view pending requests"
ON public.return_trip_requests
FOR SELECT
TO authenticated
USING (status = 'pending' OR accepted_by = auth.uid());

-- Authenticated users can create requests
CREATE POLICY "Authenticated users can create requests"
ON public.return_trip_requests
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Users can update their own accepted requests
CREATE POLICY "Users can update accepted requests"
ON public.return_trip_requests
FOR UPDATE
TO authenticated
USING (accepted_by = auth.uid() OR status = 'pending');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_return_trip_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_return_trip_updated_at
BEFORE UPDATE ON public.return_trip_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_return_trip_updated_at();

-- Enable Realtime for the table
ALTER PUBLICATION supabase_realtime ADD TABLE public.return_trip_requests;

-- Insert some initial mock data for testing
INSERT INTO public.return_trip_requests (patient_name, pickup_location, pickup_city, destination, destination_city, estimated_fee, distance, patient_condition, patient_age, patient_gender) VALUES
('정OO', '대구광역시 수성구 범어동', '대구', '서울아산병원', '서울', 250000, '280km', 'stable', '50대', 'male'),
('최OO', '대전광역시 서구 둔산동', '대전', '세브란스병원', '서울', 180000, '160km', 'stable', '60대', 'female'),
('한OO', '광주광역시 북구 운암동', '광주', '삼성서울병원', '서울', 320000, '320km', 'stable', '40대', 'male'),
('임OO', '부산광역시 해운대구 우동', '부산', '서울대병원', '서울', 380000, '400km', 'stable', '70대', 'male'),
('윤OO', '창원시 성산구 상남동', '창원', '고려대병원', '서울', 350000, '360km', 'stable', '30대', 'female'),
('박OO', '울산광역시 남구 삼산동', '울산', '삼성서울병원', '서울', 340000, '370km', 'stable', '45대', 'male'),
('강OO', '전주시 완산구 효자동', '전주', '세브란스병원', '서울', 280000, '240km', 'stable', '55대', 'female');