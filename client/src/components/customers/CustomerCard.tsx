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
    <div className="border-b border-slate-200 py-3">
      <div className="grid grid-cols-7 gap-4 items-center text-sm">
        <div>
          <div className="flex flex-col">
            <span className="font-medium text-slate-800">{customer.name}</span>
            <span className="text-slate-500 text-xs">{customer.position}</span>
          </div>
        </div>
      
        <div className="hidden md:block">
          <span className="text-slate-800">{customer.company}</span>
        </div>
        
        <div className="hidden md:block">
          <span className="text-slate-800">{customer.sector}</span>
        </div>
        
        <div>
          <span className="text-slate-800">{customer.phone}</span>
        </div>
        
        <div>
          <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline truncate max-w-[150px] block">
            {customer.email}
          </a>
        </div>
        
        <div className="hidden md:block">
          <span className="text-slate-800 truncate max-w-[150px] block">{customer.address}</span>
        </div>
        
        <div className="text-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-slate-600 hover:text-slate-900">
                <span className="font-bold text-xl">...</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="bottom" className="min-w-[180px]">
              <DropdownMenuItem 
                onClick={() => onViewProfile && onViewProfile(customer)}
                className="cursor-pointer"
              >
                <Eye className="h-4 w-4 mr-2" />
                <span>View Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onViewOrders && onViewOrders(customer)}
                className="cursor-pointer"
              >
                <FileText className="h-4 w-4 mr-2" />
                <span>View Orders</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onEdit && onEdit(customer)}
                className="cursor-pointer"
              >
                <Pencil className="h-4 w-4 mr-2" />
                <span>Edit</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete && onDelete(customer)}
                className="cursor-pointer text-red-600 hover:text-red-700 focus:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Mobile view extra information */}
      <div className="md:hidden mt-2 text-xs text-slate-500 space-y-1">
        <div><span className="font-medium">Company:</span> {customer.company}</div>
        <div><span className="font-medium">Sector:</span> {customer.sector}</div>
        <div><span className="font-medium">Address:</span> {customer.address}</div>
      </div>
    </div>
  );
};

export default CustomerCard;