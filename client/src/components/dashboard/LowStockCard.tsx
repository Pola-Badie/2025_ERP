import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Package, XCircle, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

interface LowStockProduct {
  id: number;
  name: string;
  drugName: string;
  currentStock: number;
  reorderPoint: number;
  unitOfMeasure: string;
  categoryName: string;
  stockStatus: 'out_of_stock' | 'critical' | 'low' | 'normal';
  daysUntilReorder: number;
}

interface InventorySummary {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  expiringCount: number;
  expiredCount: number;
}

const LowStockCard = () => {
  const [, setLocation] = useLocation();
  
  const { data: lowStockProducts, isLoading, error } = useQuery<LowStockProduct[]>({
    queryKey: ['low-stock-products'],
    queryFn: () => fetch('/api/inventory/low-stock').then(r => r.json()),
    refetchInterval: 300000 // Refresh every 5 minutes
  });

  const { data: summary } = useQuery<InventorySummary>({
    queryKey: ['inventory-summary'],
    queryFn: () => fetch('/api/inventory/summary').then(r => r.json()),
    refetchInterval: 300000
  });

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'out_of_stock': return 'bg-red-100 text-red-800 border-red-200';
      case 'critical': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStockIcon = (status: string) => {
    switch (status) {
      case 'out_of_stock': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'critical': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'low': return <Package className="h-4 w-4 text-yellow-600" />;
      default: return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Low Stock Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            {[1,2,3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            Error Loading Stock Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Unable to load stock information. Please try again later.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Package className="h-4 w-4" />
          Low Stock Alert
        </CardTitle>
        <div className="flex gap-2">
          <Badge variant="destructive" className="text-xs">
            {summary?.outOfStockCount || 0} Out
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {summary?.lowStockCount || 0} Low
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {!lowStockProducts || lowStockProducts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>All products are well stocked!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {lowStockProducts.slice(0, 5).map((product) => (
              <div 
                key={product.id} 
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setLocation(`/inventory?filter=${product.id}`)}
              >
                <div className="flex items-center gap-3">
                  {getStockIcon(product.stockStatus)}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{product.name}</p>
                    <p className="text-xs text-gray-500 truncate">{product.drugName}</p>
                    <p className="text-xs text-gray-400">{product.categoryName}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <Badge 
                    className={`${getStockStatusColor(product.stockStatus)} text-xs mb-1`}
                  >
                    {product.currentStock} {product.unitOfMeasure}
                  </Badge>
                  <p className="text-xs text-gray-500">
                    Reorder: {product.reorderPoint} {product.unitOfMeasure}
                  </p>
                </div>
              </div>
            ))}
            
            {lowStockProducts.length > 5 && (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => setLocation('/inventory')}
              >
                View All {lowStockProducts.length} Low Stock Items
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LowStockCard;