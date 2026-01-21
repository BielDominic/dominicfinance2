-- Add pessoa column to expense_categories table
ALTER TABLE public.expense_categories 
ADD COLUMN IF NOT EXISTS pessoa TEXT DEFAULT 'Ambos';

-- Update existing rows to have 'Ambos' as default
UPDATE public.expense_categories 
SET pessoa = 'Ambos' 
WHERE pessoa IS NULL;