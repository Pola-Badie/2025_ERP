import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import RealTimeDashboard from '@/components/dashboard/RealTimeDashboard';
import { 
  Package, 
  Users, 
  FileText, 
  TrendingUp, 
  AlertTriangle, 
  Clock,
  DollarSign,
  ShoppingCart,
  Loader2
} from 'lucide-react';

const Dashboard = () => {
  const { t } = useLanguage();
  const [refreshCount, setRefreshCount] = useState(0);
  
  // Simple refresh function to trigger component re-render
  const handleRefresh = () => {
    setRefreshCount(prev => prev + 1);
  };

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="dashboard-container">
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
            <Loader2 className="h-4 w-4 mr-2" />
            {t('refresh') || 'Refresh'}
          </Button>
        </div>
      </div>

      <RealTimeDashboard key={refreshCount} />
    </div>
  );
};

export default Dashboard;