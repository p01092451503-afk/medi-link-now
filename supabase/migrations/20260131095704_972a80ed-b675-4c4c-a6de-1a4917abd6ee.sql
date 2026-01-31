-- Add revenue tracking columns to driving_logs table
ALTER TABLE public.driving_logs
ADD COLUMN IF NOT EXISTS revenue_amount INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS revenue_memo TEXT DEFAULT NULL;

-- Add constraint for payment method values
ALTER TABLE public.driving_logs
ADD CONSTRAINT driving_logs_payment_method_check
CHECK (payment_method IS NULL OR payment_method IN ('cash', 'card', 'transfer', 'unpaid'));