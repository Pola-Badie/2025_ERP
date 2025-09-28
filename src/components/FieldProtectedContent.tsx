import React, { useState, useEffect } from 'react';
import { useFieldPermissions } from '@/hooks/use-field-permissions';

interface FieldProtectedContentProps {
  module: string;
  entityType: string;
  fieldName: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireEdit?: boolean; // If true, requires edit permission instead of just view
}

export const FieldProtectedContent: React.FC<FieldProtectedContentProps> = ({
  module,
  entityType,
  fieldName,
  children,
  fallback = <span className="text-muted-foreground">•••</span>,
  requireEdit = false
}) => {
  const { checkFieldPermission } = useFieldPermissions();
  const [canAccess, setCanAccess] = useState<boolean | null>(null);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const permission = await checkFieldPermission(module, entityType, fieldName);
        setCanAccess(requireEdit ? permission.canEdit : permission.canView);
      } catch (error) {
        console.error('Error checking field permission:', error);
        setCanAccess(false);
      }
    };

    checkPermission();
  }, [module, entityType, fieldName, requireEdit, checkFieldPermission]);

  // Show loading state while checking permissions
  if (canAccess === null) {
    return <span className="text-muted-foreground">•••</span>;
  }

  return canAccess ? <>{children}</> : <>{fallback}</>;
};