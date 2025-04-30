import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Pencil, 
  Trash2, 
  User 
} from 'lucide-react';

export interface CustomerData {
  id: number;
  name: string;
  position: string;
  company: string;
  sector: string;
  phone: string;
  email: string;
  address: string;
}

interface CustomerCardProps {
  customer: CustomerData;
  onEdit?: (customer: CustomerData) => void;
  onDelete?: (customer: CustomerData) => void;
  onViewProfile?: (customer: CustomerData) => void;
  onViewOrders?: (customer: CustomerData) => void;
}

const CustomerCard: React.FC<CustomerCardProps> = ({
  customer,
  onEdit,
  onDelete,
  onViewProfile,
  onViewOrders
}) => {
  return (
    <Card className="mb-4 overflow-hidden">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 gap-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-slate-900">{customer.company}</h3>
              <p className="text-slate-700">{customer.name}</p>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-slate-600 hover:text-blue-600 hover:border-blue-200 flex items-center"
                onClick={() => onViewProfile && onViewProfile(customer)}
              >
                <User className="h-4 w-4 mr-1" />
                View Profile
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="text-slate-600 hover:text-blue-600 hover:border-blue-200 flex items-center"
                onClick={() => onViewOrders && onViewOrders(customer)}
              >
                <FileText className="h-4 w-4 mr-1" />
                View Orders
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="text-slate-600 hover:text-amber-600 hover:border-amber-200 flex items-center"
                onClick={() => onEdit && onEdit(customer)}
              >
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="text-slate-600 hover:text-red-600 hover:border-red-200 flex items-center"
                onClick={() => onDelete && onDelete(customer)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-4 border-t border-slate-100">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Position</p>
                <p className="text-slate-800">{customer.position}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Sector</p>
                <p className="text-slate-800">{customer.sector}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Phone</p>
                <p className="text-slate-800">{customer.phone}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Email</p>
                <p className="text-slate-800">{customer.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Address</p>
                <p className="text-slate-800">{customer.address}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerCard;