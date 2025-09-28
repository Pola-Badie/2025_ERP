import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/queryClient';
export const useFieldPermissions = () => {
    const [permissions, setPermissions] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useAuth();
    const checkFieldPermission = useCallback(async (module, entityType, fieldName) => {
        if (!user?.id) {
            return { canView: false, canEdit: false, field: fieldName, module, entityType };
        }
        // Admin users have all permissions
        if (user.role === 'admin') {
            return { canView: true, canEdit: true, field: fieldName, module, entityType };
        }
        const cacheKey = `${module}:${entityType}:${fieldName}`;
        // Return cached result if available
        if (permissions[cacheKey]) {
            return permissions[cacheKey];
        }
        try {
            setIsLoading(true);
            const response = await apiRequest('POST', `/api/permissions/users/${user.id}/field-check`, {
                module,
                entityType,
                fieldName
            });
            if (response.success) {
                const permission = response.data;
                // Cache the result
                setPermissions(prev => ({
                    ...prev,
                    [cacheKey]: permission
                }));
                return permission;
            }
            else {
                // Default deny if API fails
                return { canView: false, canEdit: false, field: fieldName, module, entityType };
            }
        }
        catch (error) {
            console.error('Error checking field permission:', error);
            // Default deny if API fails
            return { canView: false, canEdit: false, field: fieldName, module, entityType };
        }
        finally {
            setIsLoading(false);
        }
    }, [user?.id, user?.role, permissions]);
    const canViewField = useCallback(async (module, entityType, fieldName) => {
        const permission = await checkFieldPermission(module, entityType, fieldName);
        return permission.canView;
    }, [checkFieldPermission]);
    const canEditField = useCallback(async (module, entityType, fieldName) => {
        const permission = await checkFieldPermission(module, entityType, fieldName);
        return permission.canEdit;
    }, [checkFieldPermission]);
    // Clear cache when user changes
    useEffect(() => {
        setPermissions({});
    }, [user?.id]);
    return {
        checkFieldPermission,
        canViewField,
        canEditField,
        isLoading,
        clearCache: () => setPermissions({})
    };
};
