-- Create blocked_emails table to prevent re-registration
CREATE TABLE public.blocked_emails (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    blocked_by UUID REFERENCES auth.users(id),
    blocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    reason TEXT
);

-- Enable RLS
ALTER TABLE public.blocked_emails ENABLE ROW LEVEL SECURITY;

-- Only admins can manage blocked emails
CREATE POLICY "Admins can view blocked emails"
ON public.blocked_emails
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert blocked emails"
ON public.blocked_emails
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete blocked emails"
ON public.blocked_emails
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Create function to check if email is blocked
CREATE OR REPLACE FUNCTION public.is_email_blocked(check_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.blocked_emails
        WHERE LOWER(email) = LOWER(check_email)
    )
$$;