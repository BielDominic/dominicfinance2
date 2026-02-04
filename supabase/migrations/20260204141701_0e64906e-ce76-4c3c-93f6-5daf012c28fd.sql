-- Create user onboarding table to store initial setup data
CREATE TABLE public.user_onboarding (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  has_completed_onboarding BOOLEAN NOT NULL DEFAULT false,
  destination_country TEXT,
  destination_city TEXT,
  travel_date TEXT,
  financial_goal NUMERIC,
  monthly_income_estimate NUMERIC,
  monthly_expense_estimate NUMERIC,
  goal_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

-- Users can view their own onboarding data
CREATE POLICY "Users can view own onboarding"
  ON public.user_onboarding FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own onboarding data
CREATE POLICY "Users can insert own onboarding"
  ON public.user_onboarding FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own onboarding data
CREATE POLICY "Users can update own onboarding"
  ON public.user_onboarding FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can view all onboarding data
CREATE POLICY "Admins can view all onboarding"
  ON public.user_onboarding FOR SELECT
  USING (is_admin(auth.uid()));

-- Update user_counter_config defaults for new users (ocean theme)
ALTER TABLE public.user_counter_config
ALTER COLUMN counter_background SET DEFAULT 'ocean',
ALTER COLUMN counter_title SET DEFAULT '',
ALTER COLUMN counter_icon SET DEFAULT 'plane',
ALTER COLUMN counter_color SET DEFAULT 'blue';

-- Add trigger for updated_at
CREATE TRIGGER update_user_onboarding_updated_at
  BEFORE UPDATE ON public.user_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();