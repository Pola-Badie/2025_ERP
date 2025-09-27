import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from './AuthContext';
const UserPermissionsContext = createContext(undefined);
export const UserPermissionsProvider = ({ children }) => {
    const [permissions, setPermissions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user, isLoading: authLoading } = useAuth();
    const fetchPermissions = async () => {
        // Wait for auth to finish loading before determining permissions
        if (authLoading) {
            return;
        }
        if (!user?.id) {
            setPermissions([]);
            setIsLoading(false);
            return;
        }
        try {
            setIsLoading(true);
            // Use REAL permission API with comprehensive data
            const data = await apiRequest('GET', `/api/permissions/users/${user.id}/complete`);
            if (data.success) {
                // Extract effective permissions (what user actually has access to)
                setPermissions(data.data.effective || []);
                console.log('🔐 REAL user permissions loaded:', data.data.effective?.length || 0, 'modules');
            }
            else {
                console.error('Permission API returned error:', data.error);
                setPermissions([]);
            }
        }
        catch (error) {
            console.error('Error fetching user permissions:', error);
            setPermissions([]);
        }
        finally {
            setIsLoading(false);
        }
    };
    const hasPermission = (moduleName) => {
        // Admin users have access to all modules
        if (user?.role === 'admin') {
            return true;
        }
        // Check if user has explicit permission for this module (permissions is array of strings)
        return permissions.includes(moduleName);
    };
    const refreshPermissions = async () => {
        await fetchPermissions();
    };
    useEffect(() => {
        fetchPermissions();
    }, [user?.id, authLoading]);
    return (<UserPermissionsContext.Provider value={{
            permissions,
            hasPermission,
            isLoading,
            refreshPermissions
        }}>
      {children}
    </UserPermissionsContext.Provider>);
};
export const useUserPermissions = () => {
    const context = useContext(UserPermissionsContext);
    if (!context) {
        throw new Error('useUserPermissions must be used within a UserPermissionsProvider');
    }
    return context;
};
