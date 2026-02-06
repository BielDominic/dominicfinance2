-- ==============================================
-- P1: FIX DATA ISOLATION - Remove is_admin() bypass from financial tables
-- Admin should NOT see all data on dashboard; only Gabriel+Myrelle share
-- ==============================================

-- Drop old permissive policies that include is_admin() bypass
DROP POLICY IF EXISTS "Users can view expense categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Users can update expense categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Users can delete expense categories" ON public.expense_categories;

DROP POLICY IF EXISTS "Users can view income entries" ON public.income_entries;
DROP POLICY IF EXISTS "Users can update income entries" ON public.income_entries;
DROP POLICY IF EXISTS "Users can delete income entries" ON public.income_entries;

DROP POLICY IF EXISTS "Users can view investments" ON public.investments;
DROP POLICY IF EXISTS "Users can update investments" ON public.investments;
DROP POLICY IF EXISTS "Users can delete investments" ON public.investments;

-- Recreate expense_categories policies WITHOUT is_admin() bypass
CREATE POLICY "Users can view expense categories" ON public.expense_categories
FOR SELECT TO authenticated
USING (
  user_id = auth.uid() 
  OR (can_access_shared_data(auth.uid()) AND user_id = '6d4e0965-804e-4073-a173-ad0134ecb665'::uuid)
);

CREATE POLICY "Users can update expense categories" ON public.expense_categories
FOR UPDATE TO authenticated
USING (
  user_id = auth.uid() 
  OR (can_access_shared_data(auth.uid()) AND user_id = '6d4e0965-804e-4073-a173-ad0134ecb665'::uuid)
);

CREATE POLICY "Users can delete expense categories" ON public.expense_categories
FOR DELETE TO authenticated
USING (
  user_id = auth.uid() 
  OR (can_access_shared_data(auth.uid()) AND user_id = '6d4e0965-804e-4073-a173-ad0134ecb665'::uuid)
);

-- Recreate income_entries policies WITHOUT is_admin() bypass
CREATE POLICY "Users can view income entries" ON public.income_entries
FOR SELECT TO authenticated
USING (
  user_id = auth.uid() 
  OR (can_access_shared_data(auth.uid()) AND user_id = '6d4e0965-804e-4073-a173-ad0134ecb665'::uuid)
);

CREATE POLICY "Users can update income entries" ON public.income_entries
FOR UPDATE TO authenticated
USING (
  user_id = auth.uid() 
  OR (can_access_shared_data(auth.uid()) AND user_id = '6d4e0965-804e-4073-a173-ad0134ecb665'::uuid)
);

CREATE POLICY "Users can delete income entries" ON public.income_entries
FOR DELETE TO authenticated
USING (
  user_id = auth.uid() 
  OR (can_access_shared_data(auth.uid()) AND user_id = '6d4e0965-804e-4073-a173-ad0134ecb665'::uuid)
);

-- Recreate investments policies WITHOUT is_admin() bypass
CREATE POLICY "Users can view investments" ON public.investments
FOR SELECT TO authenticated
USING (
  user_id = auth.uid() 
  OR (can_access_shared_data(auth.uid()) AND user_id = '6d4e0965-804e-4073-a173-ad0134ecb665'::uuid)
);

CREATE POLICY "Users can update investments" ON public.investments
FOR UPDATE TO authenticated
USING (
  user_id = auth.uid() 
  OR (can_access_shared_data(auth.uid()) AND user_id = '6d4e0965-804e-4073-a173-ad0134ecb665'::uuid)
);

CREATE POLICY "Users can delete investments" ON public.investments
FOR DELETE TO authenticated
USING (
  user_id = auth.uid() 
  OR (can_access_shared_data(auth.uid()) AND user_id = '6d4e0965-804e-4073-a173-ad0134ecb665'::uuid)
);

-- ==============================================
-- P2: MAINTENANCE MODE - Add system_config entry for maintenance
-- (table already exists, just ensure key is present)
-- ==============================================
INSERT INTO public.system_config (config_key, config_value)
VALUES ('maintenance_mode', '{"enabled": false, "message": "O sistema está em manutenção. Tente novamente mais tarde."}'::jsonb)
ON CONFLICT (config_key) DO NOTHING;

-- ==============================================
-- P7: Profile change history table for audit
-- ==============================================
CREATE TABLE IF NOT EXISTS public.profile_change_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT
);

-- Enable RLS
ALTER TABLE public.profile_change_history ENABLE ROW LEVEL SECURITY;

-- Only admins can view profile change history
CREATE POLICY "Admins can view profile change history" ON public.profile_change_history
FOR SELECT TO authenticated
USING (is_admin(auth.uid()));

-- Anyone authenticated can insert (for audit purposes)
CREATE POLICY "Authenticated users can insert profile history" ON public.profile_change_history
FOR INSERT TO authenticated
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profile_change_history_profile_id ON public.profile_change_history(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_change_history_changed_at ON public.profile_change_history(changed_at DESC);