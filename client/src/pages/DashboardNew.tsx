import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Receipt } from 'lucide-react';

const DashboardNew = () => {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to Morgan ERP - Your business overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">TOTAL CUSTOMERS</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,284</div>
            <p className="text-xs text-muted-foreground">+12 new this month</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1D3E78] text-white">
          <CardHeader className="pb-0">
            <CardTitle className="text-sm font-medium">TODAY SALES</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">EGP 2,500</div>
            <p className="text-xs mt-1">Daily</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#3BCEAC] text-white">
          <CardHeader className="pb-0">
            <CardTitle className="text-sm font-medium">MONTH SALES</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">EGP 12,500</div>
            <p className="text-xs mt-1">Monthly</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collected Tax (This Month)</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">EGP 1,750</div>
            <p className="text-xs text-muted-foreground">14% VAT collected from sales</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardNew;