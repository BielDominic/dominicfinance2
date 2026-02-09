import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface PermissionGateProps {
  sectionKey: string;
  action?: 'view' | 'edit';
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that conditionally renders children based on user permissions.
 * Admins always have full access. Regular users must have the specified permission.
 */
export function PermissionGate({ 
  sectionKey, 
  action = 'view', 
  children, 
  fallback = null 
}: PermissionGateProps) {
  const { hasPermission, isLoading, permissions, isAdmin } = useAuth();
  
  // Don't render anything while loading permissions
  if (isLoading) {
    return null;
  }
  
  // Admins always have full access
  if (isAdmin) {
    return <>{children}</>;
  }
  
  // For regular users, check specific permission
  // If no permissions are defined yet (empty array), allow access by default
  const hasDefinedPermission = permissions.some(p => p.section_key === sectionKey);
  
  if (!hasDefinedPermission) {
    // No permission defined for this section - allow by default for backward compatibility
    return <>{children}</>;
  }
  
  // Check permission explicitly
  if (!hasPermission(sectionKey, action)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

/**
 * Hook to check if user can view a specific section
 */
export function useCanView(sectionKey: string): boolean {
  const { hasPermission } = useAuth();
  return hasPermission(sectionKey, 'view');
}

/**
 * Hook to check if user can edit a specific section
 */
export function useCanEdit(sectionKey: string): boolean {
  const { hasPermission } = useAuth();
  return hasPermission(sectionKey, 'edit');
}
