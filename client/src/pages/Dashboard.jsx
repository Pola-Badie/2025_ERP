import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import RealTimeDashboard from '@/components/dashboard/RealTimeDashboard';
import { Loader2 } from 'lucide-react';
const Dashboard = () => {
    const { t } = useLanguage();
    const [refreshCount, setRefreshCount] = useState(0);
    // Simple refresh function to trigger component re-render
    const handleRefresh = () => {
        setRefreshCount(prev => prev + 1);
    };
    return (<div className="container mx-auto p-6 space-y-6" data-testid="dashboard-container">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" data-testid="dashboard-title">
            {t('dashboard')}
          </h1>
          <p className="text-muted-foreground">
            Overview of your business operations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} data-testid="button-refresh">
            <Loader2 className="h-4 w-4 mr-2"/>
            {t('refresh') || 'Refresh'}
          </Button>
        </div>
      </div>

      <RealTimeDashboard key={refreshCount}/>
    </div>);
};
export default Dashboard;
