import { Express, Request, Response } from "express";
import { loadFinancialData } from "./financial-seed-data";
import { faker } from "@faker-js/faker";

// Generate payment data
export function generatePayments(count = 15) {
  try {
    const payments = [];
    
    for (let i = 0; i < count; i++) {
      const paymentDate = faker.date.between({ 
        from: '2025-01-01', 
        to: '2025-05-17' 
      });
      
      const amount = faker.number.int({ min: 1000, max: 15000 }) / 100;
      
      // Get invoice IDs
      const invoiceIds = Array(faker.number.int({ min: 1, max: 3 }))
        .fill(0)
        .map(() => faker.string.alphanumeric(8));
      
      // Create allocations for this payment
      const allocations = invoiceIds.map(() => {
        const allocationAmount = faker.number.int({ 
          min: 100, 
          max: Math.min(amount * 100, 5000) 
        }) / 100;
        
        return {
          id: faker.number.int({ min: 1000, max: 9999 }),
          paymentId: faker.number.int({ min: 1, max: 999 }),
          invoiceId: faker.number.int({ min: 1000, max: 9999 }),
          invoiceNumber: `INV-${faker.string.alphanumeric(6).toUpperCase()}`,
          amount: allocationAmount
        };
      });
      
      // Calculate the total allocated amount
      const totalAllocated = allocations.reduce((sum, allocation) => sum + allocation.amount, 0);
      
      // If allocated amount is more than payment amount, adjust to be equal
      if (totalAllocated > amount) {
        const factor = amount / totalAllocated;
        allocations.forEach(allocation => {
          allocation.amount = Math.round(allocation.amount * factor * 100) / 100;
        });
      }
      
      const payment = {
        id: faker.number.int({ min: 1, max: 999 }),
        paymentNumber: `PMT-${faker.string.alphanumeric(6).toUpperCase()}`,
        customerId: faker.number.int({ min: 1, max: 10 }),
        customerName: faker.company.name(),
        paymentDate: paymentDate.toISOString(),
        amount,
        paymentMethod: faker.helpers.arrayElement(['cash', 'creditCard', 'bankTransfer', 'cheque']),
        reference: faker.helpers.maybe(() => faker.finance.accountNumber(), { probability: 0.7 }),
        notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.5 }),
        status: faker.helpers.arrayElement(['completed', 'pending', 'failed']),
        allocations
      };
      
      payments.push(payment);
    }
    
    return payments;
  } catch (error) {
    console.error("Error generating payments:", error);
    return [];
  }
}

// Generate pending invoices
export function generatePendingInvoices(count = 10) {
  try {
    const pendingInvoices = [];
    
    for (let i = 0; i < count; i++) {
      const total = faker.number.int({ min: 200000, max: 2000000 }) / 100;
      const amountPaid = faker.helpers.maybe(
        () => faker.number.int({ min: 0, max: total * 90 }) / 100,
        { probability: 0.7 }
      ) || 0;
      const amountDue = total - amountPaid;
      
      const invoice = {
        id: faker.number.int({ min: 100, max: 999 }),
        invoiceNumber: `INV-${faker.string.alphanumeric(6).toUpperCase()}`,
        customerId: faker.number.int({ min: 1, max: 10 }),
        customerName: faker.company.name(),
        date: faker.date.recent({ days: 30 }).toISOString(),
        dueDate: faker.date.soon({ days: 30 }).toISOString(),
        total,
        amountPaid,
        amountDue,
        status: amountPaid > 0 ? 'partial' : faker.helpers.arrayElement(['unpaid', 'overdue'])
      };
      
      pendingInvoices.push(invoice);
    }
    
    return pendingInvoices;
  } catch (error) {
    console.error("Error generating pending invoices:", error);
    return [];
  }
}

export function registerCustomerPaymentRoutes(app: Express) {
  // Get all customer payments
  app.get("/api/accounting/payments", async (req: Request, res: Response) => {
    try {
      const { customerId } = req.query;
      let payments = generatePayments();
      
      // Filter by customer ID if provided
      if (customerId) {
        payments = payments.filter(payment => 
          payment.customerId === parseInt(customerId as string)
        );
      }
      
      // Sort by date, newest first
      payments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
      
      res.json(payments);
    } catch (error) {
      console.error("Error generating payments:", error);
      res.status(500).json({ error: "Failed to generate payments" });
    }
  });
  
  // Get pending invoices for payments
  app.get("/api/accounting/invoices/pending", async (req: Request, res: Response) => {
    try {
      const { customerId } = req.query;
      let pendingInvoices = generatePendingInvoices();
      
      // Filter by customer ID if provided
      if (customerId) {
        pendingInvoices = pendingInvoices.filter(invoice => 
          invoice.customerId === parseInt(customerId as string)
        );
      }
      
      // Sort by due date, most urgent first
      pendingInvoices.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      
      res.json(pendingInvoices);
    } catch (error) {
      console.error("Error generating pending invoices:", error);
      res.status(500).json({ error: "Failed to generate pending invoices" });
    }
  });
  
  // Create a new payment
  app.post("/api/accounting/payments", async (req: Request, res: Response) => {
    try {
      const { customerId, amount, paymentMethod, reference, notes, allocations } = req.body;
      
      // Generate a payment number
      const paymentNumber = `PMT-${faker.string.alphanumeric(6).toUpperCase()}`;
      
      // Create the payment object
      const payment = {
        id: faker.string.uuid(),
        paymentNumber,
        customerId,
        customerName: `Customer ${customerId}`, // In a real app, this would fetch the customer name
        paymentDate: new Date().toISOString(),
        amount,
        paymentMethod,
        reference,
        notes,
        status: 'completed',
        allocations: allocations.map((allocation: any) => ({
          id: faker.string.uuid(),
          invoiceId: allocation.invoiceId,
          invoiceNumber: allocation.invoiceNumber,
          amount: allocation.amount
        }))
      };
      
      res.status(201).json(payment);
    } catch (error) {
      console.error("Error creating payment:", error);
      res.status(500).json({ error: "Failed to create payment" });
    }
  });
}