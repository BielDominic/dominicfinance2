
-- Add user_id column to financial tables for data isolation
ALTER TABLE public.income_entries ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.expense_categories ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Assign existing data to admin user (Gabriel - 6d4e0965-804e-4073-a173-ad0134ecb665)
UPDATE public.income_entries SET user_id = '6d4e0965-804e-4073-a173-ad0134ecb665' WHERE user_id IS NULL;
UPDATE public.expense_categories SET user_id = '6d4e0965-804e-4073-a173-ad0134ecb665' WHERE user_id IS NULL;
UPDATE public.investments SET user_id = '6d4e0965-804e-4073-a173-ad0134ecb665' WHERE user_id IS NULL;

-- Create function to check if user is Gabriel or Myrelle (shared data access)
CREATE OR REPLACE FUNCTION public.can_access_shared_data(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = _user_id 
    AND LOWER(profiles.username) IN ('gabriel', 'myrelle')
  )
$$;

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Allow all access to income_entries" ON public.income_entries;
DROP POLICY IF EXISTS "Allow all access to expense_categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Allow all access to investments" ON public.investments;

-- Create new RLS policies for income_entries
CREATE POLICY "Users can view own income entries"
ON public.income_entries FOR SELECT
USING (
  user_id = auth.uid() 
  OR (can_access_shared_data(auth.uid()) AND user_id = '6d4e0965-804e-4073-a173-ad0134ecb665')
);

CREATE POLICY "Users can insert own income entries"
ON public.income_entries FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own income entries"
ON public.income_entries FOR UPDATE
USING (
  user_id = auth.uid() 
  OR (can_access_shared_data(auth.uid()) AND user_id = '6d4e0965-804e-4073-a173-ad0134ecb665')
);

CREATE POLICY "Users can delete own income entries"
ON public.income_entries FOR DELETE
USING (
  user_id = auth.uid() 
  OR (can_access_shared_data(auth.uid()) AND user_id = '6d4e0965-804e-4073-a173-ad0134ecb665')
);

-- Create new RLS policies for expense_categories
CREATE POLICY "Users can view own expense categories"
ON public.expense_categories FOR SELECT
USING (
  user_id = auth.uid() 
  OR (can_access_shared_data(auth.uid()) AND user_id = '6d4e0965-804e-4073-a173-ad0134ecb665')
);

CREATE POLICY "Users can insert own expense categories"
ON public.expense_categories FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own expense categories"
ON public.expense_categories FOR UPDATE
USING (
  user_id = auth.uid() 
  OR (can_access_shared_data(auth.uid()) AND user_id = '6d4e0965-804e-4073-a173-ad0134ecb665')
);

CREATE POLICY "Users can delete own expense categories"
ON public.expense_categories FOR DELETE
USING (
  user_id = auth.uid() 
  OR (can_access_shared_data(auth.uid()) AND user_id = '6d4e0965-804e-4073-a173-ad0134ecb665')
);

-- Create new RLS policies for investments
CREATE POLICY "Users can view own investments"
ON public.investments FOR SELECT
USING (
  user_id = auth.uid() 
  OR (can_access_shared_data(auth.uid()) AND user_id = '6d4e0965-804e-4073-a173-ad0134ecb665')
);

CREATE POLICY "Users can insert own investments"
ON public.investments FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own investments"
ON public.investments FOR UPDATE
USING (
  user_id = auth.uid() 
  OR (can_access_shared_data(auth.uid()) AND user_id = '6d4e0965-804e-4073-a173-ad0134ecb665')
);

CREATE POLICY "Users can delete own investments"
ON public.investments FOR DELETE
USING (
  user_id = auth.uid() 
  OR (can_access_shared_data(auth.uid()) AND user_id = '6d4e0965-804e-4073-a173-ad0134ecb665')
);
