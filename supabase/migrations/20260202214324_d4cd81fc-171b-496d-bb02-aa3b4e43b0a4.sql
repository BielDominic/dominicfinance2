
-- Update RLS policies to allow admin access to all user data

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own income entries" ON public.income_entries;
DROP POLICY IF EXISTS "Users can insert own income entries" ON public.income_entries;
DROP POLICY IF EXISTS "Users can update own income entries" ON public.income_entries;
DROP POLICY IF EXISTS "Users can delete own income entries" ON public.income_entries;

DROP POLICY IF EXISTS "Users can view own expense categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Users can insert own expense categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Users can update own expense categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Users can delete own expense categories" ON public.expense_categories;

DROP POLICY IF EXISTS "Users can view own investments" ON public.investments;
DROP POLICY IF EXISTS "Users can insert own investments" ON public.investments;
DROP POLICY IF EXISTS "Users can update own investments" ON public.investments;
DROP POLICY IF EXISTS "Users can delete own investments" ON public.investments;

-- Create new RLS policies for income_entries (admin sees all)
CREATE POLICY "Users can view income entries"
ON public.income_entries FOR SELECT
USING (
  user_id = auth.uid() 
  OR is_admin(auth.uid())
  OR (can_access_shared_data(auth.uid()) AND user_id = '6d4e0965-804e-4073-a173-ad0134ecb665')
);

CREATE POLICY "Users can insert own income entries"
ON public.income_entries FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update income entries"
ON public.income_entries FOR UPDATE
USING (
  user_id = auth.uid() 
  OR is_admin(auth.uid())
  OR (can_access_shared_data(auth.uid()) AND user_id = '6d4e0965-804e-4073-a173-ad0134ecb665')
);

CREATE POLICY "Users can delete income entries"
ON public.income_entries FOR DELETE
USING (
  user_id = auth.uid() 
  OR is_admin(auth.uid())
  OR (can_access_shared_data(auth.uid()) AND user_id = '6d4e0965-804e-4073-a173-ad0134ecb665')
);

-- Create new RLS policies for expense_categories (admin sees all)
CREATE POLICY "Users can view expense categories"
ON public.expense_categories FOR SELECT
USING (
  user_id = auth.uid() 
  OR is_admin(auth.uid())
  OR (can_access_shared_data(auth.uid()) AND user_id = '6d4e0965-804e-4073-a173-ad0134ecb665')
);

CREATE POLICY "Users can insert own expense categories"
ON public.expense_categories FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update expense categories"
ON public.expense_categories FOR UPDATE
USING (
  user_id = auth.uid() 
  OR is_admin(auth.uid())
  OR (can_access_shared_data(auth.uid()) AND user_id = '6d4e0965-804e-4073-a173-ad0134ecb665')
);

CREATE POLICY "Users can delete expense categories"
ON public.expense_categories FOR DELETE
USING (
  user_id = auth.uid() 
  OR is_admin(auth.uid())
  OR (can_access_shared_data(auth.uid()) AND user_id = '6d4e0965-804e-4073-a173-ad0134ecb665')
);

-- Create new RLS policies for investments (admin sees all)
CREATE POLICY "Users can view investments"
ON public.investments FOR SELECT
USING (
  user_id = auth.uid() 
  OR is_admin(auth.uid())
  OR (can_access_shared_data(auth.uid()) AND user_id = '6d4e0965-804e-4073-a173-ad0134ecb665')
);

CREATE POLICY "Users can insert own investments"
ON public.investments FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update investments"
ON public.investments FOR UPDATE
USING (
  user_id = auth.uid() 
  OR is_admin(auth.uid())
  OR (can_access_shared_data(auth.uid()) AND user_id = '6d4e0965-804e-4073-a173-ad0134ecb665')
);

CREATE POLICY "Users can delete investments"
ON public.investments FOR DELETE
USING (
  user_id = auth.uid() 
  OR is_admin(auth.uid())
  OR (can_access_shared_data(auth.uid()) AND user_id = '6d4e0965-804e-4073-a173-ad0134ecb665')
);
