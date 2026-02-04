-- Allow anyone to check if email is blocked (for signup validation)
CREATE POLICY "Anyone can check if email is blocked"
ON public.blocked_emails
FOR SELECT
TO anon
USING (true);