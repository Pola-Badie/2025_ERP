import { Express, Request, Response } from 'express';
import { db } from './db';
import { suppliers, purchaseOrders, purchaseOrderItems, purchaseOrderDocuments, accounts, journalEntries, journalLines } from '@shared/schema';
import { eq, desc, like, or, and, sql } from 'drizzle-orm';

export function registerProcurementRoutes(app: Express) {
  // Get all suppliers
  app.get("/api/procurement/suppliers", async (req: Request, res: Response) => {
    try {
      const allSuppliers = await db.select().from(suppliers).orderBy(desc(suppliers.createdAt));
      res.json(allSuppliers);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      res.status(500).json({ error: 'Failed to fetch suppliers' });
    }
  });

  // Create new supplier
  app.post("/api/procurement/suppliers", async (req: Request, res: Response) => {
    try {
      const [newSupplier] = await db.insert(suppliers).values(req.body).returning();
      res.json(newSupplier);
    } catch (error) {
      console.error('Error creating supplier:', error);
      res.status(500).json({ error: 'Failed to create supplier' });
    }
  });

  // Get all purchase orders with supplier details
  app.get("/api/procurement/purchase-orders", async (req: Request, res: Response) => {
    try {
      const { status, search } = req.query;
      
      let whereConditions = [];
      
      if (status && status !== 'all') {
        whereConditions.push(eq(purchaseOrders.status, status as string));
      }

      if (search) {
        whereConditions.push(
          or(
            like(purchaseOrders.poNumber, `%${search}%`),
            like(suppliers.name, `%${search}%`)
          )
        );
      }

      const baseQuery = db
        .select({
          id: purchaseOrders.id,
          poNumber: purchaseOrders.poNumber,
          supplier: suppliers.name,
          supplierId: purchaseOrders.supplierId,
          orderDate: purchaseOrders.orderDate,
          expectedDeliveryDate: purchaseOrders.expectedDeliveryDate,
          status: purchaseOrders.status,
          subtotal: purchaseOrders.subtotal,
          taxRate: purchaseOrders.taxRate,
          taxAmount: purchaseOrders.taxAmount,
          totalAmount: purchaseOrders.totalAmount,
          paymentMethod: purchaseOrders.paymentMethod,
          paymentTerms: purchaseOrders.paymentTerms,
          paymentDueDate: purchaseOrders.paymentDueDate,
          receivedDate: purchaseOrders.receivedDate,
          notes: purchaseOrders.notes,
          createdAt: purchaseOrders.createdAt,
        })
        .from(purchaseOrders)
        .leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id));

      const query = whereConditions.length > 0 
        ? baseQuery.where(and(...whereConditions))
        : baseQuery;

      const orders = await query.orderBy(desc(purchaseOrders.createdAt));
      res.json(orders);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      res.status(500).json({ error: 'Failed to fetch purchase orders' });
    }
  });

  // Get purchase order details with items
  app.get("/api/procurement/purchase-orders/:id", async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.id);
      
      // Get purchase order with supplier details
      const [order] = await db
        .select({
          id: purchaseOrders.id,
          poNumber: purchaseOrders.poNumber,
          supplier: suppliers.name,
          supplierId: purchaseOrders.supplierId,
          orderDate: purchaseOrders.orderDate,
          expectedDeliveryDate: purchaseOrders.expectedDeliveryDate,
          status: purchaseOrders.status,
          subtotal: purchaseOrders.subtotal,
          taxRate: purchaseOrders.taxRate,
          taxAmount: purchaseOrders.taxAmount,
          totalAmount: purchaseOrders.totalAmount,
          paymentMethod: purchaseOrders.paymentMethod,
          paymentTerms: purchaseOrders.paymentTerms,
          paymentDueDate: purchaseOrders.paymentDueDate,
          receivedDate: purchaseOrders.receivedDate,
          notes: purchaseOrders.notes,
          createdAt: purchaseOrders.createdAt,
        })
        .from(purchaseOrders)
        .leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
        .where(eq(purchaseOrders.id, orderId));

      if (!order) {
        return res.status(404).json({ error: 'Purchase order not found' });
      }

      // Get purchase order items
      const items = await db
        .select()
        .from(purchaseOrderItems)
        .where(eq(purchaseOrderItems.purchaseOrderId, orderId));

      // Get documents
      const documents = await db
        .select()
        .from(purchaseOrderDocuments)
        .where(eq(purchaseOrderDocuments.purchaseOrderId, orderId));

      res.json({
        ...order,
        items,
        documents
      });
    } catch (error) {
      console.error('Error fetching purchase order:', error);
      res.status(500).json({ error: 'Failed to fetch purchase order' });
    }
  });

  // Create new purchase order
  app.post("/api/procurement/purchase-orders", async (req: Request, res: Response) => {
    try {
      const { items, ...orderData } = req.body;
      
      // Generate PO number if not provided
      if (!orderData.poNumber) {
        const year = new Date().getFullYear();
        const count = await db.select({ count: sql`count(*)` }).from(purchaseOrders);
        const nextNumber = (count[0]?.count as number || 0) + 1;
        orderData.poNumber = `PO-${year}-${String(nextNumber).padStart(4, '0')}`;
      }

      // Create purchase order
      const [newOrder] = await db.insert(purchaseOrders).values(orderData).returning();
      
      // Create purchase order items if provided
      if (items && items.length > 0) {
        const orderItems = items.map((item: any) => ({
          ...item,
          purchaseOrderId: newOrder.id
        }));
        await db.insert(purchaseOrderItems).values(orderItems);
      }

      // Sync with accounting - create journal entry for purchase
      await createPurchaseJournalEntry(newOrder);

      res.json(newOrder);
    } catch (error) {
      console.error('Error creating purchase order:', error);
      res.status(500).json({ error: 'Failed to create purchase order' });
    }
  });

  // Update purchase order status
  app.patch("/api/procurement/purchase-orders/:id/status", async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.id);
      const { status } = req.body;
      
      const updateData: any = { status };
      if (status === 'received') {
        updateData.receivedDate = new Date().toISOString().split('T')[0];
      }

      const [updatedOrder] = await db
        .update(purchaseOrders)
        .set(updateData)
        .where(eq(purchaseOrders.id, orderId))
        .returning();

      // If order is received, sync with accounting
      if (status === 'received') {
        await createReceivedPurchaseJournalEntry(updatedOrder);
      }

      res.json(updatedOrder);
    } catch (error) {
      console.error('Error updating purchase order status:', error);
      res.status(500).json({ error: 'Failed to update purchase order status' });
    }
  });

  // Delete purchase order
  app.delete("/api/procurement/purchase-orders/:id", async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.id);
      
      // Delete related items and documents first
      await db.delete(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, orderId));
      await db.delete(purchaseOrderDocuments).where(eq(purchaseOrderDocuments.purchaseOrderId, orderId));
      
      // Delete the purchase order
      await db.delete(purchaseOrders).where(eq(purchaseOrders.id, orderId));
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting purchase order:', error);
      res.status(500).json({ error: 'Failed to delete purchase order' });
    }
  });

  // Sync procurement with accounting purchases
  app.post("/api/procurement/sync-accounting", async (req: Request, res: Response) => {
    try {
      // Get all received purchase orders that haven't been synced to accounting
      const receivedOrders = await db
        .select()
        .from(purchaseOrders)
        .where(eq(purchaseOrders.status, 'received'));

      const syncResults = [];

      for (const order of receivedOrders) {
        // Check if already exists in journal entries
        const existingEntry = await db
          .select()
          .from(journalEntries)
          .where(
            and(
              eq(journalEntries.sourceType, 'purchase_order'),
              eq(journalEntries.sourceId, order.id)
            )
          );

        if (existingEntry.length === 0) {
          await createReceivedPurchaseJournalEntry(order);
          syncResults.push({
            poNumber: order.poNumber,
            status: 'synced',
            amount: order.totalAmount
          });
        } else {
          syncResults.push({
            poNumber: order.poNumber,
            status: 'already_synced',
            amount: order.totalAmount
          });
        }
      }

      res.json({
        message: 'Procurement data synced with accounting',
        results: syncResults,
        totalSynced: syncResults.filter(r => r.status === 'synced').length
      });
    } catch (error) {
      console.error('Error syncing procurement with accounting:', error);
      res.status(500).json({ error: 'Failed to sync procurement with accounting' });
    }
  });
}

// Helper function to create journal entry for purchase order
async function createPurchaseJournalEntry(order: any) {
  try {
    // Get relevant accounts
    const inventoryAccount = await db.select().from(accounts).where(eq(accounts.code, '1200')); // Inventory
    const payableAccount = await db.select().from(accounts).where(eq(accounts.code, '2100')); // Accounts Payable

    if (inventoryAccount.length === 0 || payableAccount.length === 0) {
      console.warn('Required accounts not found for purchase journal entry');
      return;
    }

    // Generate entry number
    const year = new Date().getFullYear();
    const count = await db.select({ count: sql`count(*)` }).from(journalEntries);
    const nextNumber = (count[0]?.count as number || 0) + 1;
    const entryNumber = `JE-${year}-${String(nextNumber).padStart(4, '0')}`;

    // Create journal entry
    const [journalEntry] = await db.insert(journalEntries).values({
      entryNumber,
      date: order.orderDate,
      reference: order.poNumber,
      memo: `Purchase Order: ${order.poNumber}`,
      status: 'posted',
      totalDebit: order.totalAmount,
      totalCredit: order.totalAmount,
      sourceType: 'purchase_order',
      sourceId: order.id,
      userId: order.userId
    }).returning();

    // Create journal lines
    await db.insert(journalLines).values([
      {
        journalId: journalEntry.id,
        accountId: inventoryAccount[0].id,
        description: `Inventory purchase - ${order.poNumber}`,
        debit: order.totalAmount,
        credit: '0',
        position: 1
      },
      {
        journalId: journalEntry.id,
        accountId: payableAccount[0].id,
        description: `Accounts payable - ${order.poNumber}`,
        debit: '0',
        credit: order.totalAmount,
        position: 2
      }
    ]);

  } catch (error) {
    console.error('Error creating purchase journal entry:', error);
  }
}

// Helper function to create journal entry when purchase is received
async function createReceivedPurchaseJournalEntry(order: any) {
  try {
    // This would typically update inventory levels and confirm the purchase
    // For now, we'll just mark the journal entry as confirmed
    await db
      .update(journalEntries)
      .set({ memo: `Purchase Order Received: ${order.poNumber}` })
      .where(
        and(
          eq(journalEntries.sourceType, 'purchase_order'),
          eq(journalEntries.sourceId, order.id)
        )
      );
  } catch (error) {
    console.error('Error updating received purchase journal entry:', error);
  }
}