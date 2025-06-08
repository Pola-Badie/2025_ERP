import React from 'react';
import { format } from 'date-fns';
import logoPath from '@assets/P_1749320448134.png';

interface QuotationItem {
  id: string;
  productName: string;
  description: string;
  quantity: number;
  uom: string;
  unitPrice: number;
  total: number;
  type: 'manufacturing' | 'refining' | 'finished';
  processingTime?: number;
  qualityGrade?: string;
  specifications?: string;
}

interface Customer {
  id?: number;
  name: string;
  company?: string;
  position?: string;
  email?: string;
  phone?: string;
  address?: string;
  sector?: string;
  taxNumber?: string;
}

interface PrintableQuotationProps {
  quotationNumber: string;
  date: Date;
  validUntil: string;
  customer: Customer;
  items: QuotationItem[];
  subtotal: number;
  transportationFees: number;
  vatPercentage: number;
  vatAmount: number;
  grandTotal: number;
  notes?: string;
  transportationType?: string;
  transportationNotes?: string;
  quotationType: 'manufacturing' | 'refining' | 'finished';
  termsAndConditions?: string;
}

export const PrintableQuotation: React.FC<PrintableQuotationProps> = ({
  quotationNumber,
  date,
  validUntil,
  customer,
  items,
  subtotal,
  transportationFees,
  vatPercentage,
  vatAmount,
  grandTotal,
  notes,
  transportationType,
  transportationNotes,
  quotationType,
  termsAndConditions,
}) => {
  const validUntilDate = validUntil ? new Date(validUntil) : new Date(date.getTime() + 30 * 24 * 60 * 60 * 1000);

  const getQuotationTypeLabel = (type: string) => {
    switch (type) {
      case 'manufacturing': return 'Manufacturing Services';
      case 'refining': return 'Refining & Processing';
      case 'finished': return 'Finished Products';
      default: return 'Pharmaceutical Services';
    }
  };

  const getTransportationTypeLabel = (type?: string) => {
    switch (type) {
      case 'standard': return 'Standard Delivery (3-5 days)';
      case 'express': return 'Express Delivery (1-2 days)';
      case 'cold-chain': return 'Cold Chain Transport (Temperature Controlled)';
      case 'hazmat': return 'Hazardous Materials Transport';
      case 'international': return 'International Shipping';
      case 'pickup': return 'Customer Pickup';
      case 'custom': return 'Custom Transportation';
      default: return 'Standard Delivery';
    }
  };

  return (
    <div className="printable-quotation bg-white p-8 max-w-4xl mx-auto text-black">
      {/* Header */}
      <div className="flex justify-between items-start mb-8 border-b pb-6">
        <div className="company-info flex items-start gap-4">
          <img 
            src={logoPath} 
            alt="Morgan ERP Logo" 
            className="w-16 h-16 object-contain"
          />
          <div>
            <h1 className="text-3xl font-bold text-blue-600 mb-2">Morgan ERP</h1>
            <p className="text-gray-600 text-sm">Enterprise Resource Planning System</p>
            <div className="mt-4 text-sm text-gray-600">
              <p>123 Business District</p>
              <p>Cairo, Egypt 11511</p>
              <p>Phone: +20 2 1234 5678</p>
              <p>Email: info@morganerp.com</p>
            </div>
          </div>
        </div>
        
        <div className="quotation-header text-right">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">QUOTATION</h2>
          <div className="text-sm">
            <p><span className="font-semibold">Quotation #:</span> {quotationNumber}</p>
            <p><span className="font-semibold">Date:</span> {format(date, 'dd/MM/yyyy')}</p>
            <p><span className="font-semibold">Valid Until:</span> {format(validUntilDate, 'dd/MM/yyyy')}</p>
            <p><span className="font-semibold">Service Type:</span> {getQuotationTypeLabel(quotationType)}</p>
          </div>
        </div>
      </div>

      {/* Customer Information */}
      <div className="customer-info mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Quote For:</h3>
        <div className="bg-gray-50 p-4 rounded border">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              {customer.company ? (
                <div>
                  <h3 className="font-medium text-lg">{customer.company}</h3>
                  <p className="text-sm text-gray-600">{customer.name}</p>
                </div>
              ) : (
                <h3 className="font-medium text-lg">{customer.company || customer.name}</h3>
              )}
              
              {/* Customer Code and Mobile prominently displayed */}
              <div className="flex flex-wrap gap-2 mt-2">
                {customer.id && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                    Code: CUST-{String(customer.id).padStart(4, '0')}
                  </span>
                )}
                {customer.phone && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                    Mobile: {customer.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Other customer details */}
          <div className="space-y-1 pt-2 border-t mt-3">
            {customer.taxNumber && (
              <p className="text-sm text-gray-600">ETA Number: {customer.taxNumber}</p>
            )}
            {customer.address && (
              <p className="text-sm text-gray-600">Address: {customer.address}</p>
            )}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="items-table mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Quoted Items & Services</h3>
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Item/Service</th>
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Description</th>
              <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Qty</th>
              <th className="border border-gray-300 px-4 py-3 text-center font-semibold">UoM</th>
              <th className="border border-gray-300 px-4 py-3 text-right font-semibold">Unit Price</th>
              <th className="border border-gray-300 px-4 py-3 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3 font-medium">{item.productName}</td>
                <td className="border border-gray-300 px-4 py-3 text-gray-600">
                  {item.description}
                  {item.type === 'manufacturing' && item.processingTime && (
                    <div className="text-xs mt-1 text-blue-600">
                      Processing Time: {item.processingTime} days
                      {item.qualityGrade && ` | Quality: ${item.qualityGrade}`}
                    </div>
                  )}
                  {item.type === 'refining' && item.specifications && (
                    <div className="text-xs mt-1 text-blue-600">
                      Specifications: {item.specifications}
                    </div>
                  )}
                </td>
                <td className="border border-gray-300 px-4 py-3 text-center">{item.quantity}</td>
                <td className="border border-gray-300 px-4 py-3 text-center">{item.uom}</td>
                <td className="border border-gray-300 px-4 py-3 text-right">EGP {item.unitPrice.toFixed(2)}</td>
                <td className="border border-gray-300 px-4 py-3 text-right font-semibold">EGP {item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Transportation Section */}
      {transportationFees > 0 && (
        <div className="transportation-info mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Transportation & Delivery</h3>
          <div className="bg-blue-50 p-4 rounded border">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-blue-900">{getTransportationTypeLabel(transportationType)}</p>
                {transportationNotes && (
                  <p className="text-sm text-blue-700 mt-1">{transportationNotes}</p>
                )}
              </div>
              <div className="text-right">
                <p className="font-semibold text-blue-900">EGP {transportationFees.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Totals Section */}
      <div className="flex justify-end mb-8">
        <div className="w-80">
          <div className="border border-gray-300 bg-gray-50">
            <div className="flex justify-between px-4 py-2 border-b border-gray-300">
              <span className="font-medium">Subtotal:</span>
              <span>EGP {subtotal.toFixed(2)}</span>
            </div>
            
            {transportationFees > 0 && (
              <div className="flex justify-between px-4 py-2 border-b border-gray-300">
                <span className="font-medium">Transportation:</span>
                <span>EGP {transportationFees.toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between px-4 py-2 border-b border-gray-300">
              <span className="font-medium">VAT ({vatPercentage}%):</span>
              <span>EGP {vatAmount.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between px-4 py-3 bg-blue-600 text-white font-bold text-lg">
              <span>Total Amount:</span>
              <span>EGP {grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Terms & Conditions */}
      {termsAndConditions && (
        <div className="terms mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Terms & Conditions</h3>
          <div className="bg-gray-50 p-4 rounded border text-sm">
            <pre className="whitespace-pre-wrap font-sans text-gray-700">{termsAndConditions}</pre>
          </div>
        </div>
      )}

      {/* Notes */}
      {notes && (
        <div className="notes mb-8">
          <h3 className="font-semibold text-gray-800 mb-2">Additional Notes:</h3>
          <div className="bg-gray-50 p-4 rounded border">
            <p className="text-gray-700">{notes}</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="footer border-t pt-6 mt-8">
        <div className="text-center text-sm text-gray-600">
          <p className="font-semibold mb-2">Thank you for considering Morgan ERP for your pharmaceutical needs!</p>
          <p>This quotation was generated on {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
          <p className="mt-2">For any questions regarding this quotation, please contact us at info@morganerp.com</p>
          <p className="mt-1 text-xs">All prices are in USD and exclude applicable taxes unless otherwise stated.</p>
        </div>
      </div>

      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          .printable-quotation {
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
          
          .bg-blue-50 {
            background-color: #eff6ff !important;
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