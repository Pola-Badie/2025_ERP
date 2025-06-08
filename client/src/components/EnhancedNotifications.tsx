import React from "react";
import { Bell, AlertTriangle, Clock, CheckCircle, Shield, Activity, User, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/contexts/NotificationContext";
import { Link } from "wouter";

const EnhancedNotifications: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  
  // Get recent unread notifications for preview
  const recentNotifications = notifications
    .filter(n => !n.isRead)
    .slice(0, 6);

  const getIcon = (type: string, category: string) => {
    if (type === 'error' || category === 'inventory') return AlertTriangle;
    if (type === 'warning') return Clock;
    if (type === 'success') return CheckCircle;
    if (category === 'user') return User;
    if (category === 'financial') return ShoppingCart;
    if (category === 'system') return Shield;
    return Activity;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-orange-500 bg-orange-50';
      case 'low': return 'border-green-500 bg-green-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-orange-100 text-orange-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative p-2">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs bg-red-500 text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span className="font-semibold text-sm">Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">{unreadCount}</Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-blue-600 hover:text-blue-700"
                onClick={markAllAsRead}
              >
                Mark All Read
              </Button>
            )}
            <Link href="/notifications">
              <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-700">
                View All
              </Button>
            </Link>
          </div>
        </div>
        
        {/* High Priority Notifications */}
        <div className="p-3 border-b bg-red-50/50">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-xs font-medium text-red-700">HIGH PRIORITY</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-start space-x-3 p-2 bg-white rounded border-l-2 border-red-500">
              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">Critical Stock Alert</p>
                  <span className="text-xs text-gray-500">2m ago</span>
                </div>
                <p className="text-xs text-gray-600">Panadol Advance - Only 2 units remaining</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="destructive" className="text-xs">URGENT</Badge>
                  <span className="text-xs text-gray-500">Inventory</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-2 bg-white rounded border-l-2 border-red-500">
              <Shield className="h-4 w-4 text-red-500 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">Security Alert</p>
                  <span className="text-xs text-gray-500">5m ago</span>
                </div>
                <p className="text-xs text-gray-600">Multiple failed login attempts detected</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="destructive" className="text-xs">HIGH</Badge>
                  <span className="text-xs text-gray-500">Security</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Moderate Priority Notifications */}
        <div className="p-3 border-b bg-orange-50/50">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="h-4 w-4 text-orange-500" />
            <span className="text-xs font-medium text-orange-700">MODERATE PRIORITY</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-start space-x-3 p-2 bg-white rounded border-l-2 border-orange-500">
              <Clock className="h-4 w-4 text-orange-500 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">Expiry Warning</p>
                  <span className="text-xs text-gray-500">15m ago</span>
                </div>
                <p className="text-xs text-gray-600">Amoxicillin expires in 10 days</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">MODERATE</Badge>
                  <span className="text-xs text-gray-500">Inventory</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-2 bg-white rounded border-l-2 border-orange-500">
              <Activity className="h-4 w-4 text-orange-500 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">User Login</p>
                  <span className="text-xs text-gray-500">1h ago</span>
                </div>
                <p className="text-xs text-gray-600">Sarah Ahmed logged in from new device</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">MODERATE</Badge>
                  <span className="text-xs text-gray-500">Security</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Low Priority Notifications */}
        <div className="p-3 bg-green-50/50">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-xs font-medium text-green-700">LOW PRIORITY</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-start space-x-3 p-2 bg-white rounded border-l-2 border-green-500">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">Invoice Generated</p>
                  <span className="text-xs text-gray-500">2h ago</span>
                </div>
                <p className="text-xs text-gray-600">Invoice #INV-2025-001 created successfully</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">LOW</Badge>
                  <span className="text-xs text-gray-500">Sales</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-2 bg-white rounded border-l-2 border-green-500">
              <User className="h-4 w-4 text-green-500 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">Successful Login</p>
                  <span className="text-xs text-gray-500">3h ago</span>
                </div>
                <p className="text-xs text-gray-600">Ahmed Hassan logged in successfully</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">LOW</Badge>
                  <span className="text-xs text-gray-500">Authentication</span>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-2 bg-white rounded border-l-2 border-green-500">
              <Activity className="h-4 w-4 text-green-500 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">System Backup</p>
                  <span className="text-xs text-gray-500">4h ago</span>
                </div>
                <p className="text-xs text-gray-600">Daily backup completed successfully</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">LOW</Badge>
                  <span className="text-xs text-gray-500">System</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Last updated: Just now</span>
            <Button variant="outline" size="sm" className="text-xs">
              Mark All Read
            </Button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default EnhancedNotifications;