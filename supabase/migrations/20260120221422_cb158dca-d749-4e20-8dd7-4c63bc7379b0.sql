-- Add RLS policies for app_config table to allow all operations for anonymous users
-- This is a shared dashboard without authentication, so we allow public access

-- Policy to allow anyone to read app_config
CREATE POLICY "Allow public read on app_config" 
ON public.app_config 
FOR SELECT 
USING (true);

-- Policy to allow anyone to insert into app_config
CREATE POLICY "Allow public insert on app_config" 
ON public.app_config 
FOR INSERT 
WITH CHECK (true);

-- Policy to allow anyone to update app_config
CREATE POLICY "Allow public update on app_config" 
ON public.app_config 
FOR UPDATE 
USING (true);

-- Policy to allow anyone to delete from app_config
CREATE POLICY "Allow public delete on app_config" 
ON public.app_config 
FOR DELETE 
USING (true);