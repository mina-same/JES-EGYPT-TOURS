import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/config/permissions';

export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // Superadmin has all permissions
    if ((user as any).role === 'superadmin') return true;
    
    // Check if user has the specific permission
    return (user as any).permissions?.includes(permission) || false;
  };

  // Helper functions for common resources using the constants
  const canCreate = (resource: keyof typeof PERMISSIONS | string): boolean => {
    // If passing strict resource name like 'tour', 'blog'
    if (!resource.includes(':')) {
      const permKey = `${resource.toUpperCase()}_CREATE` as keyof typeof PERMISSIONS;
      return PERMISSIONS[permKey] ? hasPermission(PERMISSIONS[permKey]) : false;
    }
    return hasPermission(resource);
  };

  const canEdit = (resource: keyof typeof PERMISSIONS | string): boolean => {
    if (!resource.includes(':')) {
      const permKey = `${resource.toUpperCase()}_UPDATE` as keyof typeof PERMISSIONS;
      return PERMISSIONS[permKey] ? hasPermission(PERMISSIONS[permKey]) : false;
    }
    return hasPermission(resource);
  };

  const canDelete = (resource: keyof typeof PERMISSIONS | string): boolean => {
    if (!resource.includes(':')) {
      const permKey = `${resource.toUpperCase()}_DELETE` as keyof typeof PERMISSIONS;
      return PERMISSIONS[permKey] ? hasPermission(PERMISSIONS[permKey]) : false;
    }
    return hasPermission(resource);
  };

  const canView = (resource: keyof typeof PERMISSIONS | string): boolean => {
    if (!resource.includes(':')) {
      const permKey = `${resource.toUpperCase()}_READ` as keyof typeof PERMISSIONS;
      return PERMISSIONS[permKey] ? hasPermission(PERMISSIONS[permKey]) : false;
    }
    return hasPermission(resource);
  };

  return {
    hasPermission,
    canCreate,
    canEdit,
    canDelete,
    canView,
  };
};
