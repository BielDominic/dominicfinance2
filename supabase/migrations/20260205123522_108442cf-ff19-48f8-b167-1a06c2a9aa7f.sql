
-- =====================================================
-- FIX DATA ISOLATION: Each user gets their own dashboard
-- Only Gabriel and Myrelle share data
-- =====================================================

-- Define the shared user IDs as constants for the policies
-- Gabriel: 6d4e0965-804e-4073-a173-ad0134ecb665
-- Myrelle: ea618340-23d9-4d39-be53-398f102bc8d5

-- =====================================================
-- 1. Add user_id column to dashboard_people if not exists
-- =====================================================
ALTER TABLE public.dashboard_people 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Set Gabriel's user_id for existing dashboard_people records (shared data)
UPDATE public.dashboard_people 
SET user_id = '6d4e0965-804e-4073-a173-ad0134ecb665'::uuid 
WHERE user_id IS NULL;

-- Make user_id NOT NULL after setting defaults
ALTER TABLE public.dashboard_people 
ALTER COLUMN user_id SET NOT NULL;

-- =====================================================
-- 2. Drop old permissive policies on dashboard_people
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can manage people" ON public.dashboard_people;
DROP POLICY IF EXISTS "Authenticated users can view people" ON public.dashboard_people;

-- =====================================================
-- 3. Create new isolated policies for dashboard_people
-- =====================================================

-- Users can view their own people OR Gabriel/Myrelle shared
CREATE POLICY "Users can view own people or shared"
ON public.dashboard_people FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  OR (
    can_access_shared_data(auth.uid()) 
    AND user_id = '6d4e0965-804e-4073-a173-ad0134ecb665'::uuid
  )
);

-- Users can insert their own people
CREATE POLICY "Users can insert own people"
ON public.dashboard_people FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own people OR Gabriel/Myrelle shared
CREATE POLICY "Users can update own people or shared"
ON public.dashboard_people FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() 
  OR (
    can_access_shared_data(auth.uid()) 
    AND user_id = '6d4e0965-804e-4073-a173-ad0134ecb665'::uuid
  )
);

-- Users can delete their own people OR Gabriel/Myrelle shared
CREATE POLICY "Users can delete own people or shared"
ON public.dashboard_people FOR DELETE
TO authenticated
USING (
  user_id = auth.uid() 
  OR (
    can_access_shared_data(auth.uid()) 
    AND user_id = '6d4e0965-804e-4073-a173-ad0134ecb665'::uuid
  )
);

-- =====================================================
-- 4. Fix app_settings - should also be per-user
-- =====================================================
ALTER TABLE public.app_settings 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Set Gabriel's user_id for existing app_settings records
UPDATE public.app_settings 
SET user_id = '6d4e0965-804e-4073-a173-ad0134ecb665'::uuid 
WHERE user_id IS NULL;

-- Drop old permissive policy
DROP POLICY IF EXISTS "Allow all access to app_settings" ON public.app_settings;

-- Create isolated policies for app_settings
CREATE POLICY "Users can view own settings or shared"
ON public.app_settings FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  OR (
    can_access_shared_data(auth.uid()) 
    AND user_id = '6d4e0965-804e-4073-a173-ad0134ecb665'::uuid
  )
);

CREATE POLICY "Users can insert own settings"
ON public.app_settings FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own settings or shared"
ON public.app_settings FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() 
  OR (
    can_access_shared_data(auth.uid()) 
    AND user_id = '6d4e0965-804e-4073-a173-ad0134ecb665'::uuid
  )
);

CREATE POLICY "Users can delete own settings or shared"
ON public.app_settings FOR DELETE
TO authenticated
USING (
  user_id = auth.uid() 
  OR (
    can_access_shared_data(auth.uid()) 
    AND user_id = '6d4e0965-804e-4073-a173-ad0134ecb665'::uuid
  )
);

-- =====================================================
-- 5. Ensure income_entries, expense_categories, investments
--    have proper isolated policies (fix INSERT to work properly)
-- =====================================================

-- Drop and recreate INSERT policies to be clearer
DROP POLICY IF EXISTS "Users can insert own income entries" ON public.income_entries;
DROP POLICY IF EXISTS "Users can insert own expense categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Users can insert own investments" ON public.investments;

-- Recreate INSERT policies - insert with your own user_id
CREATE POLICY "Users can insert own income entries"
ON public.income_entries FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert own expense categories"
ON public.expense_categories FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert own investments"
ON public.investments FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 6. Add user_id to app_config table too
-- =====================================================
ALTER TABLE public.app_config 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Set Gabriel's user_id for existing app_config records
UPDATE public.app_config 
SET user_id = '6d4e0965-804e-4073-a173-ad0134ecb665'::uuid 
WHERE user_id IS NULL;

-- Drop old policies on app_config
DROP POLICY IF EXISTS "Authenticated users can read config" ON public.app_config;
DROP POLICY IF EXISTS "Authenticated users can manage config" ON public.app_config;
DROP POLICY IF EXISTS "Allow authenticated users to manage app_config" ON public.app_config;

-- Create new isolated policies for app_config
CREATE POLICY "Users can view own config or shared"
ON public.app_config FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  OR (
    can_access_shared_data(auth.uid()) 
    AND user_id = '6d4e0965-804e-4073-a173-ad0134ecb665'::uuid
  )
);

CREATE POLICY "Users can insert own config"
ON public.app_config FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own config or shared"
ON public.app_config FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() 
  OR (
    can_access_shared_data(auth.uid()) 
    AND user_id = '6d4e0965-804e-4073-a173-ad0134ecb665'::uuid
  )
);

CREATE POLICY "Users can delete own config or shared"
ON public.app_config FOR DELETE
TO authenticated
USING (
  user_id = auth.uid() 
  OR (
    can_access_shared_data(auth.uid()) 
    AND user_id = '6d4e0965-804e-4073-a173-ad0134ecb665'::uuid
  )
);
