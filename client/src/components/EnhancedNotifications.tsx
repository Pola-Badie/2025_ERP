import React from "react";
import { Bell, AlertTriangle, Clock, CheckCircle, Shield, Activity, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const EnhancedNotifications: React.FC = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative p-2">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs bg-red-500 text-white rounded-full border-2 border-white font-medium">
            7
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-80 overflow-y-auto z-50 shadow-lg border border-gray-200">
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span className="font-semibold text-sm">Notifications</span>
            <Badge variant="destructive" className="text-xs">7</Badge>
          </div>
          <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-700">
            View All
          </Button>
        </div>
        
        {/* High Priority Notifications */}
        <div className="p-2 border-b bg-red-50/30">
          <div className="flex items-center space-x-1 mb-1">
            <AlertTriangle className="h-3 w-3 text-red-500" />
            <span className="text-xs font-medium text-red-700">HIGH PRIORITY</span>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-start space-x-2 p-2 bg-white rounded border-l-2 border-red-500">
              <AlertTriangle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-900">Critical Stock Alert</p>
                  <span className="text-xs text-gray-500">2m</span>
                </div>
                <p className="text-xs text-gray-600">Panadol Advance - Only 2 units left</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-2 p-2 bg-white rounded border-l-2 border-red-500">
              <Shield className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-900">Security Alert</p>
                  <span className="text-xs text-gray-500">5m</span>
                </div>
                <p className="text-xs text-gray-600">Multiple failed login attempts</p>
              </div>
            </div>
          </div>
        </div>

        {/* Moderate Priority Notifications */}
        <div className="p-2 border-b bg-orange-50/30">
          <div className="flex items-center space-x-1 mb-1">
            <Clock className="h-3 w-3 text-orange-500" />
            <span className="text-xs font-medium text-orange-700">MODERATE</span>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-start space-x-2 p-2 bg-white rounded border-l-2 border-orange-500">
              <Clock className="h-3 w-3 text-orange-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-900">Expiry Warning</p>
                  <span className="text-xs text-gray-500">15m</span>
                </div>
                <p className="text-xs text-gray-600">Amoxicillin expires in 10 days</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-2 p-2 bg-white rounded border-l-2 border-orange-500">
              <Activity className="h-3 w-3 text-orange-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-900">User Login</p>
                  <span className="text-xs text-gray-500">1h</span>
                </div>
                <p className="text-xs text-gray-600">Sarah Ahmed from new device</p>
              </div>
            </div>
          </div>
        </div>

        {/* Low Priority Notifications */}
        <div className="p-2 bg-green-50/30">
          <div className="flex items-center space-x-1 mb-1">
            <CheckCircle className="h-3 w-3 text-green-500" />
            <span className="text-xs font-medium text-green-700">RECENT</span>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-start space-x-2 p-2 bg-white rounded border-l-2 border-green-500">
              <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-900">Invoice Generated</p>
                  <span className="text-xs text-gray-500">2h</span>
                </div>
                <p className="text-xs text-gray-600">Invoice #INV-2025-001 created</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-2 p-2 bg-white rounded border-l-2 border-green-500">
              <User className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-900">Login Success</p>
                  <span className="text-xs text-gray-500">3h</span>
                </div>
                <p className="text-xs text-gray-600">Ahmed Hassan logged in</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-2 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Updated: Just now</span>
            <Button variant="outline" size="sm" className="text-xs h-6 px-2">
              Mark All Read
            </Button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default EnhancedNotifications;