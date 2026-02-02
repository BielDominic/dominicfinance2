-- Allow authenticated users to insert their own role during signup
DROP POLICY IF EXISTS "Only admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;

-- Users can insert their own role (needed during signup)
CREATE POLICY "Users can insert own role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view their own role, admins can view all
CREATE POLICY "Users can view own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING ((user_id = auth.uid()) OR is_admin(auth.uid()));

-- Only admins can update or delete roles
CREATE POLICY "Only admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));

-- Same for user_permissions - allow users to insert their own during signup
DROP POLICY IF EXISTS "Only admins can manage permissions" ON public.user_permissions;

CREATE POLICY "Users can insert own permissions"
ON public.user_permissions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update permissions"
ON public.user_permissions
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete permissions"
ON public.user_permissions
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));