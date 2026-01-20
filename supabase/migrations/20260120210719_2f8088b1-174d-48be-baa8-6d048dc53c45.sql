-- Add new columns for enhanced features

-- Add budget limit, due date and notes to expense categories
ALTER TABLE public.expense_categories 
ADD COLUMN IF NOT EXISTS meta_orcamento numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS vencimento date DEFAULT NULL,
ADD COLUMN IF NOT EXISTS notas text DEFAULT NULL;

-- Add tags and notes to income entries
ALTER TABLE public.income_entries
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS notas text DEFAULT NULL;

-- Create a new table for text-based settings
CREATE TABLE IF NOT EXISTS public.app_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Allow all access for now (no auth required)
CREATE POLICY "Allow all access to app_config"
  ON public.app_config
  AS RESTRICTIVE
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Insert default settings
INSERT INTO public.app_config (key, value) 
VALUES 
  ('dark_mode', 'false'),
  ('header_title', 'Planejamento Financeiro'),
  ('header_subtitle', 'Viagem 2025/2026')
ON CONFLICT (key) DO NOTHING;

-- Enable realtime for app_config
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_config;