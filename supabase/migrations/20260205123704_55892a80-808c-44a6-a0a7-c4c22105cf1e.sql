
-- =====================================================
-- CLEANUP: Remove old permissive policies on app_config
-- The proper isolated policies were already created
-- =====================================================

-- Drop old permissive policies on app_config that allow public access
DROP POLICY IF EXISTS "Allow all access to app_config" ON public.app_config;
DROP POLICY IF EXISTS "Allow public delete on app_config" ON public.app_config;
DROP POLICY IF EXISTS "Allow public insert on app_config" ON public.app_config;
DROP POLICY IF EXISTS "Allow public read on app_config" ON public.app_config;
DROP POLICY IF EXISTS "Allow public update on app_config" ON public.app_config;

-- Also clean up app_settings old policy
DROP POLICY IF EXISTS "Allow all access to app_settings" ON public.app_settings;

-- Verify the new policies exist, if not create them
-- For app_settings (was missed earlier)
DO $$
BEGIN
    -- Check if policy exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'app_settings' 
        AND policyname = 'Users can view own settings or shared'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can view own settings or shared"
        ON public.app_settings FOR SELECT
        TO authenticated
        USING (
          user_id = auth.uid() 
          OR (
            can_access_shared_data(auth.uid()) 
            AND user_id = ''6d4e0965-804e-4073-a173-ad0134ecb665''::uuid
          )
        )';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'app_settings' 
        AND policyname = 'Users can insert own settings'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can insert own settings"
        ON public.app_settings FOR INSERT
        TO authenticated
        WITH CHECK (user_id = auth.uid())';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'app_settings' 
        AND policyname = 'Users can update own settings or shared'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can update own settings or shared"
        ON public.app_settings FOR UPDATE
        TO authenticated
        USING (
          user_id = auth.uid() 
          OR (
            can_access_shared_data(auth.uid()) 
            AND user_id = ''6d4e0965-804e-4073-a173-ad0134ecb665''::uuid
          )
        )';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'app_settings' 
        AND policyname = 'Users can delete own settings or shared'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can delete own settings or shared"
        ON public.app_settings FOR DELETE
        TO authenticated
        USING (
          user_id = auth.uid() 
          OR (
            can_access_shared_data(auth.uid()) 
            AND user_id = ''6d4e0965-804e-4073-a173-ad0134ecb665''::uuid
          )
        )';
    END IF;
END
$$;

-- Make user_id NOT NULL on app_settings (only if all rows have user_id)
-- First check if there are nulls
DO $$
BEGIN
    -- Only alter if no nulls exist
    IF NOT EXISTS (
        SELECT 1 FROM public.app_settings WHERE user_id IS NULL
    ) THEN
        ALTER TABLE public.app_settings ALTER COLUMN user_id SET NOT NULL;
    END IF;
END
$$;
