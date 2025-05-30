import fs from 'fs';
import path from 'path';

interface Account {
  code: string;
  name: string;
  type: string;
}

interface Expense {
  id: string;
  date: string;
  accountCode: string;
  accountName: string;
  description: string;
  amount: number;
  paymentMethod: string;
  costCenter: string;
}

interface Purchase {
  id: string;
  invoiceNo: string;
  date: string;
  supplier: string;
  item: string;
  quantity: number;
  unitPrice: number;
  total: number;
  vatPct: number;
  vatAmount: number;
  paymentMethod: string;
  paidStatus: string;
}

interface DueInvoice {
  id: string;
  client: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  vat: number;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  status: string;
}

export interface FinancialData {
  accounts: Account[];
  expenses: Expense[];
  purchases: Purchase[];
  dueInvoices: DueInvoice[];
}

let financialData: FinancialData | null = null;

export function loadFinancialData(): FinancialData {
  if (financialData) {
    return financialData;
  }

  try {
    const dataPath = path.join(process.cwd(), 'data.json');
    
    // Check if file exists before trying to read it
    if (!fs.existsSync(dataPath)) {
      // Generate and return sample data if file doesn't exist
      return generateSampleFinancialData();
    }
    
    const fileContent = fs.readFileSync(dataPath, 'utf8');
    
    // Clean the JSON content to remove any invalid characters
    const cleanContent = fileContent.replace(/[\u0000-\u0019]+/g, '');
    
    financialData = JSON.parse(cleanContent) as FinancialData;
    return financialData;
  } catch (error) {
    console.error('Error loading financial data:', error);
    // Return sample data instead of empty structure
    return generateSampleFinancialData();
  }
}

function generateSampleFinancialData(): FinancialData {
  return {
    accounts: [
      { code: "1000", name: "Cash", type: "Asset" },
      { code: "1100", name: "Accounts Receivable", type: "Asset" },
      { code: "1200", name: "Inventory", type: "Asset" },
      { code: "1500", name: "Equipment", type: "Asset" },
      { code: "2000", name: "Accounts Payable", type: "Liability" },
      { code: "2100", name: "Notes Payable", type: "Liability" },
      { code: "3000", name: "Owner's Equity", type: "Equity" },
      { code: "4000", name: "Sales Revenue", type: "Revenue" },
      { code: "5000", name: "Cost of Goods Sold", type: "Expense" },
      { code: "6000", name: "Operating Expenses", type: "Expense" }
    ],
    expenses: [
      {
        id: "EXP-001",
        date: "2025-05-01",
        accountCode: "6000",
        accountName: "Operating Expenses",
        description: "Office Rent",
        amount: 2500,
        paymentMethod: "Bank Transfer",
        costCenter: "Administration"
      },
      {
        id: "EXP-002", 
        date: "2025-05-15",
        accountCode: "6000",
        accountName: "Operating Expenses",
        description: "Utilities",
        amount: 450,
        paymentMethod: "Cash",
        costCenter: "Administration"
      }
    ],
    purchases: [
      {
        id: "PUR-001",
        invoiceNo: "INV-2025-001",
        date: "2025-05-10",
        supplier: "Chemical Supplies Ltd",
        item: "Raw Materials",
        quantity: 100,
        unitPrice: 25.50,
        total: 2550,
        vatPct: 14,
        vatAmount: 357,
        paymentMethod: "Credit",
        paidStatus: "Paid"
      }
    ],
    dueInvoices: [
      {
        id: "INV-001",
        client: "Cairo Medical Center",
        invoiceDate: "2025-05-01",
        dueDate: "2025-05-31",
        subtotal: 5000,
        vat: 700,
        totalAmount: 5700,
        amountPaid: 0,
        balance: 5700,
        status: "Outstanding"
      }
    ]
  };
}
}