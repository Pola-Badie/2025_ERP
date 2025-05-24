import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { CustomerData } from './CustomerCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarIcon, Mail, MapPin, Phone, Building, FileText } from 'lucide-react';

interface CustomerProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: CustomerData | null;
}

// Sample invoice data for the demo
interface InvoiceData {
  id: number;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  items: number;
}

const mockInvoices: InvoiceData[] = [
  { id: 1001, date: '2025-03-15', amount: 2500, status: 'paid', items: 3 },
  { id: 1002, date: '2025-04-01', amount: 1200, status: 'paid', items: 2 },
  { id: 1003, date: '2025-04-20', amount: 3800, status: 'pending', items: 5 },
  { id: 1004, date: '2025-04-28', amount: 950, status: 'pending', items: 1 },
];

const CustomerProfileDialog: React.FC<CustomerProfileDialogProps> = ({
  open,
  onOpenChange,
  customer
}) => {
  if (!customer) return null;

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center justify-between">
            <span>Customer Profile</span>
            <DialogClose asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <span className="sr-only">Close</span>
                <span className="text-lg">×</span>
              </Button>
            </DialogClose>
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Customer Details</TabsTrigger>
              <TabsTrigger value="invoices">Invoice History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl">{customer.name}</CardTitle>
                      <CardDescription className="text-md">{customer.position}</CardDescription>
                    </div>
                    <Badge className="bg-blue-500">{customer.sector}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-lg font-medium">Company</h3>
                      <div className="flex items-center text-slate-700">
                        <Building className="h-4 w-4 mr-2 text-slate-500" />
                        <span>{customer.company}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <h3 className="text-lg font-medium">Contact Information</h3>
                      <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
                        <div className="flex items-center text-slate-700">
                          <Phone className="h-4 w-4 mr-2 text-slate-500" />
                          <span>{customer.phone}</span>
                        </div>
                        <div className="flex items-center text-slate-700">
                          <Mail className="h-4 w-4 mr-2 text-slate-500" />
                          <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline">
                            {customer.email}
                          </a>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <h3 className="text-lg font-medium">Address</h3>
                      <div className="flex items-center text-slate-700">
                        <MapPin className="h-4 w-4 mr-2 text-slate-500" />
                        <span>{customer.address}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <h3 className="text-lg font-medium">Egyptian Tax Authority</h3>
                      <div className="flex items-center text-slate-700">
                        <FileText className="h-4 w-4 mr-2 text-slate-500" />
                        <span className="text-blue-600 font-medium">
                          {customer.taxNumber || 'Not registered'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Tax registration number for ETA invoice compliance
                      </p>
                    </div>
                    
                    <div className="space-y-1 pt-2">
                      <h3 className="text-lg font-medium">Account Summary</h3>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="bg-slate-50 p-3 rounded-md">
                          <div className="text-sm text-slate-500">Total Purchases</div>
                          <div className="text-2xl font-medium">8,450 EGP</div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-md">
                          <div className="text-sm text-slate-500">Open Invoices</div>
                          <div className="text-2xl font-medium">2</div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-md">
                          <div className="text-sm text-slate-500">Last Order</div>
                          <div className="text-md font-medium">April 28, 2025</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="invoices" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Invoice History</CardTitle>
                  <CardDescription>
                    View all invoices and payment history for {customer.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">#{invoice.id}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                              {formatDate(invoice.date)}
                            </div>
                          </TableCell>
                          <TableCell>{invoice.items}</TableCell>
                          <TableCell className="text-right">{invoice.amount.toLocaleString()} EGP</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                invoice.status === 'paid'
                                  ? 'bg-green-500'
                                  : invoice.status === 'pending'
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }
                            >
                              {invoice.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  <div className="mt-6 pt-4 border-t border-slate-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-sm text-slate-500">Total Invoices: 4</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-slate-500">Total Amount</div>
                        <div className="text-xl font-medium">8,450 EGP</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerProfileDialog;