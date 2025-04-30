import React from 'react';
import { 
  FileText, 
  Pencil, 
  Trash2, 
  User,
  MoreHorizontal,
  Eye
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';

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
    <div className="flex flex-col mb-2 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
      <div className="grid grid-cols-10 gap-4 items-center text-sm">
        <div className="flex flex-col col-span-2">
          <span className="font-medium text-slate-900">{customer.name}</span>
          <span className="text-slate-500 text-xs">{customer.position}</span>
        </div>
        
        <div className="col-span-1 hidden md:block">
          <span className="font-medium text-slate-900">{customer.company}</span>
        </div>
        
        <div className="col-span-1 hidden md:block">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {customer.sector}
          </span>
        </div>
        
        <div className="col-span-2">
          <span className="text-slate-700">{customer.phone}</span>
        </div>
        
        <div className="col-span-3">
          <span className="text-slate-700">{customer.email}</span>
        </div>
        
        <div className="col-span-2 hidden md:block">
          <span className="text-slate-700 truncate max-w-[180px] block">{customer.address}</span>
        </div>
        
        <div className="col-span-3 md:col-span-1 text-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => onViewProfile && onViewProfile(customer)}
                className="cursor-pointer"
              >
                <Eye className="mr-2 h-4 w-4" />
                <span>View Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onViewOrders && onViewOrders(customer)}
                className="cursor-pointer"
              >
                <FileText className="mr-2 h-4 w-4" />
                <span>View Orders</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onEdit && onEdit(customer)}
                className="cursor-pointer"
              >
                <Pencil className="mr-2 h-4 w-4" />
                <span>Edit</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete && onDelete(customer)}
                className="cursor-pointer text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Mobile view extra information */}
      <div className="md:hidden mt-2 text-xs text-slate-500 space-y-1">
        <div><span className="font-medium">Company:</span> {customer.company}</div>
        <div>
          <span className="font-medium">Sector:</span> 
          <span className="inline-flex items-center ml-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {customer.sector}
          </span>
        </div>
        <div><span className="font-medium">Address:</span> {customer.address}</div>
      </div>
    </div>
  );
};

export default CustomerCard;