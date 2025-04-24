import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const Preferences = () => {
  return (
    <div className="container px-4 md:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Preferences</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* System Preferences */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>System Preferences</CardTitle>
            <CardDescription>
              Configure system-wide settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4 text-gray-500">
              <p>Category management has been moved to the Inventory page.</p>
              <p>Additional system preferences will be added here in future updates.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Preferences;