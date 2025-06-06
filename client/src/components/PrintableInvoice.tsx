import React from 'react';
import { format } from 'date-fns';

interface InvoiceItem {
  productName: string;
  category?: string;
  batchNo?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Customer {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  code?: string;
}

interface PrintableInvoiceProps {
  invoiceNumber: string;
  date: Date;
  customer: Customer;
  items: InvoiceItem[];
  subtotal: number;
  discountAmount?: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  paymentTerms?: string;
  notes?: string;
  amountPaid?: number;
  paymentStatus: string;
}

export const PrintableInvoice: React.FC<PrintableInvoiceProps> = ({
  invoiceNumber,
  date,
  customer,
  items,
  subtotal,
  discountAmount = 0,
  taxRate,
  taxAmount,
  grandTotal,
  paymentTerms,
  notes,
  amountPaid = 0,
  paymentStatus,
}) => {
  const balance = grandTotal - amountPaid;

  return (
    <div className="printable-invoice bg-white p-8 max-w-4xl mx-auto text-black">
      {/* Header */}
      <div className="flex justify-between items-start mb-8 border-b pb-6">
        <div className="company-info">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">Morgan ERP</h1>
          <p className="text-gray-600 text-sm">Enterprise Resource Planning System</p>
          <div className="mt-4 text-sm text-gray-600">
            <p>123 Business District</p>
            <p>Cairo, Egypt 11511</p>
            <p>Phone: +20 2 1234 5678</p>
            <p>Email: info@morganerp.com</p>
          </div>
        </div>
        
        <div className="invoice-header text-right">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">INVOICE</h2>
          <div className="text-sm">
            <p><span className="font-semibold">Invoice #:</span> {invoiceNumber}</p>
            <p><span className="font-semibold">Date:</span> {format(date, 'dd/MM/yyyy')}</p>
            <p><span className="font-semibold">Due Date:</span> {format(new Date(date.getTime() + (parseInt(paymentTerms || '0') * 24 * 60 * 60 * 1000)), 'dd/MM/yyyy')}</p>
          </div>
        </div>
      </div>

      {/* Customer Information */}
      <div className="customer-info mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Bill To:</h3>
        <div className="bg-gray-50 p-4 rounded border">
          <div className="flex justify-between items-start mb-2">
            <p className="font-semibold text-lg">{customer.name}</p>
            {customer.code && (
              <p className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                Code: {customer.code}
              </p>
            )}
          </div>
          {customer.company && <p className="text-gray-600">{customer.company}</p>}
          {customer.phone && <p className="text-gray-800 font-medium mt-1">Mobile No.: {customer.phone}</p>}
          {customer.address && <p className="text-gray-600 mt-2">{customer.address}</p>}
          {customer.email && (
            <p className="text-sm text-gray-600 mt-1">
              <span className="font-medium">Email:</span> {customer.email}
            </p>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div className="items-table mb-8">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Item Description</th>
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Category</th>
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Batch No.</th>
              <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Qty</th>
              <th className="border border-gray-300 px-4 py-3 text-right font-semibold">Unit Price</th>
              <th className="border border-gray-300 px-4 py-3 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3">{item.productName}</td>
                <td className="border border-gray-300 px-4 py-3 text-gray-600">{item.category || '-'}</td>
                <td className="border border-gray-300 px-4 py-3 text-gray-600">{item.batchNo || '-'}</td>
                <td className="border border-gray-300 px-4 py-3 text-center">{item.quantity}</td>
                <td className="border border-gray-300 px-4 py-3 text-right">EGP {item.unitPrice.toFixed(2)}</td>
                <td className="border border-gray-300 px-4 py-3 text-right font-semibold">EGP {item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals Section */}
      <div className="flex justify-end mb-8">
        <div className="w-80">
          <div className="border border-gray-300 bg-gray-50">
            <div className="flex justify-between px-4 py-2 border-b border-gray-300">
              <span className="font-medium">Subtotal:</span>
              <span>EGP {subtotal.toFixed(2)}</span>
            </div>
            
            {discountAmount > 0 && (
              <div className="flex justify-between px-4 py-2 border-b border-gray-300 text-green-600">
                <span className="font-medium">Discount:</span>
                <span>-EGP {discountAmount.toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between px-4 py-2 border-b border-gray-300">
              <span className="font-medium">Tax ({taxRate}%):</span>
              <span>EGP {taxAmount.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between px-4 py-3 bg-blue-600 text-white font-bold text-lg">
              <span>Total Amount:</span>
              <span>EGP {grandTotal.toFixed(2)}</span>
            </div>
            
            {amountPaid > 0 && (
              <>
                <div className="flex justify-between px-4 py-2 border-b border-gray-300 text-green-600">
                  <span className="font-medium">Amount Paid:</span>
                  <span>EGP {amountPaid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between px-4 py-2 font-semibold">
                  <span>Balance Due:</span>
                  <span className={balance > 0 ? 'text-red-600' : 'text-green-600'}>
                    EGP {balance.toFixed(2)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Payment Status */}
      <div className="payment-status mb-6">
        <div className="flex items-center gap-4">
          <span className="font-semibold">Payment Status:</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
            paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
          </span>
        </div>
        {paymentTerms && (
          <p className="text-sm text-gray-600 mt-2">
            <span className="font-medium">Payment Terms:</span> {paymentTerms} days
          </p>
        )}
      </div>

      {/* Notes */}
      {notes && (
        <div className="notes mb-8">
          <h3 className="font-semibold text-gray-800 mb-2">Notes:</h3>
          <div className="bg-gray-50 p-4 rounded border">
            <p className="text-gray-700">{notes}</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="footer border-t pt-6 mt-8">
        <div className="text-center text-sm text-gray-600">
          <p className="font-semibold mb-2">Thank you for your business!</p>
          <p>This invoice was generated on {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
          <p className="mt-2">For any questions regarding this invoice, please contact us at info@morganerp.com</p>
        </div>
      </div>

      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          .printable-invoice {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 20px !important;
            max-width: none !important;
            width: 100% !important;
          }
          
          .bg-gray-50 {
            background-color: #f9f9f9 !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          
          .bg-blue-600 {
            background-color: #2563eb !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          
          .text-blue-600 {
            color: #2563eb !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          
          .border {
            border: 1px solid #000 !important;
          }
          
          table {
            page-break-inside: avoid;
          }
          
          .footer {
            page-break-inside: avoid;
          }
        }
        `
      }} />
    </div>
  );
};