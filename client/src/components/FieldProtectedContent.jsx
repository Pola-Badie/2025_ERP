import React, { useState, useEffect } from 'react';
import { useFieldPermissions } from '@/hooks/use-field-permissions';
export const FieldProtectedContent = ({ module, entityType, fieldName, children, fallback = <span className="text-muted-foreground">•••</span>, requireEdit = false }) => {
    const { checkFieldPermission } = useFieldPermissions();
    const [canAccess, setCanAccess] = useState(null);
    useEffect(() => {
        const checkPermission = async () => {
            try {
                const permission = await checkFieldPermission(module, entityType, fieldName);
                setCanAccess(requireEdit ? permission.canEdit : permission.canView);
            }
            catch (error) {
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
