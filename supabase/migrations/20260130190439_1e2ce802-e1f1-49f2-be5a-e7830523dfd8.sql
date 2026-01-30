-- Add currency column to income_entries table
ALTER TABLE public.income_entries 
ADD COLUMN IF NOT EXISTS moeda TEXT DEFAULT 'BRL';

-- Add currency column to expense_categories table
ALTER TABLE public.expense_categories 
ADD COLUMN IF NOT EXISTS moeda TEXT DEFAULT 'BRL';

-- Add currency column to investments table
ALTER TABLE public.investments 
ADD COLUMN IF NOT EXISTS moeda TEXT DEFAULT 'BRL';