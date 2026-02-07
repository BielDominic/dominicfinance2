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
  const { hasPermission, isLoading } = useAuth();
  
  // Don't render anything while loading
  if (isLoading) {
    return null;
  }
  
  // Check permission
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
