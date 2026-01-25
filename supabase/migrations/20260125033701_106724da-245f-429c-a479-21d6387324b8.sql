-- Create hospitals table for storing base hospital information
CREATE TABLE public.hospitals (
    id SERIAL PRIMARY KEY,
    hpid TEXT UNIQUE, -- 병원 고유 ID (공공데이터 API의 hpid)
    name TEXT NOT NULL,
    name_en TEXT,
    address TEXT NOT NULL,
    phone TEXT,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    entrance_lat DOUBLE PRECISION, -- 응급실 입구 좌표
    entrance_lng DOUBLE PRECISION,
    category TEXT DEFAULT '응급의료기관', -- 병원 분류
    region TEXT NOT NULL, -- 지역 코드 (seoul, busan, etc.)
    sub_region TEXT, -- 세부 지역 코드
    is_trauma_center BOOLEAN DEFAULT false, -- 권역외상센터 여부
    has_pediatric BOOLEAN DEFAULT false, -- 소아 진료 가능 여부
    equipment TEXT[] DEFAULT '{}', -- 보유 장비 (CT, MRI 등)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_hospitals_region ON public.hospitals(region);
CREATE INDEX idx_hospitals_sub_region ON public.hospitals(sub_region);
CREATE INDEX idx_hospitals_hpid ON public.hospitals(hpid);
CREATE INDEX idx_hospitals_location ON public.hospitals(lat, lng);

-- Enable Row Level Security
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (hospital info is public)
CREATE POLICY "Anyone can view hospitals"
ON public.hospitals
FOR SELECT
USING (true);

-- Create policy for admin write access (only authenticated users can modify)
CREATE POLICY "Authenticated users can insert hospitals"
ON public.hospitals
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update hospitals"
ON public.hospitals
FOR UPDATE
TO authenticated
USING (true);

-- Update hospital_status_cache to reference hospitals table
-- Add foreign key constraint
ALTER TABLE public.hospital_status_cache
ADD COLUMN hpid TEXT;

-- Create index for faster joins
CREATE INDEX idx_hospital_status_cache_hpid ON public.hospital_status_cache(hpid);

-- Create trigger for updating timestamps
CREATE TRIGGER update_hospitals_updated_at
BEFORE UPDATE ON public.hospitals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for hospitals table
ALTER PUBLICATION supabase_realtime ADD TABLE public.hospitals;