import { Express, Request, Response } from 'express';

export function registerOrderRoutes(app: Express) {
  // Get all orders (main endpoint)
  app.get("/api/orders", async (req: Request, res: Response) => {
    try {
      // Return pharmaceutical orders data
      const orders = [
        {
          id: 1,
          orderNumber: "ORD-PHM-2025-001",
          batchNumber: "BATCH-IBU-001",
          type: "manufacturing",
          customerName: "Cairo Medical Center",
          customerCompany: "Cairo Medical Center",
          targetProduct: "Ibuprofen Tablets 400mg",
          orderDate: "2025-01-15",
          completionDate: "2025-02-14",
          status: "completed",
          totalCost: 45000,
          revenue: 54150,
          profit: 9150,
        },
        {
          id: 2,
          orderNumber: "ORD-PHM-2025-002",
          batchNumber: "BATCH-PCM-002",
          type: "manufacturing",
          customerName: "Alexandria Pharmaceuticals",
          customerCompany: "Alexandria Pharmaceuticals Ltd.",
          targetProduct: "Paracetamol Tablets 500mg",
          orderDate: "2025-01-20",
          completionDate: "2025-02-18",
          status: "completed",
          totalCost: 32000,
          revenue: 41600,
          profit: 9600,
        },
        {
          id: 3,
          orderNumber: "ORD-PHM-2025-003",
          batchNumber: "BATCH-AMX-003",
          type: "manufacturing",
          customerName: "MedPharma Solutions",
          customerCompany: "MedPharma Solutions Inc.",
          targetProduct: "Amoxicillin Capsules 250mg",
          orderDate: "2025-02-01",
          completionDate: "2025-03-01",
          status: "in-progress",
          totalCost: 68000,
          revenue: 89000,
          profit: 21000,
        }
      ];
      res.json(orders);
    } catch (error) {
      console.error("Error in orders endpoint:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Get production order history with batch numbers
  app.get("/api/orders/production-history", async (req: Request, res: Response) => {
    try {
      // Pharmaceutical production order history data
      const pharmaceuticalOrderHistory = [
        {
          id: 1,
          orderNumber: "ORD-PHM-2025-001",
          batchNumber: "BATCH-IBU-001",
          type: "manufacturing",
          customerName: "Cairo Medical Center",
          customerCompany: "Cairo Medical Center",
          targetProduct: "Ibuprofen Tablets 400mg",
          orderDate: "2025-01-15",
          completionDate: "2025-02-14",
          status: "completed",
          totalCost: 45000,
          revenue: 54150,
          profit: 9150,
          rawMaterials: ["Isobutylbenzene", "Acetic Anhydride", "Aluminum Chloride", "Microcrystalline Cellulose"],
          additionalCosts: {
            transportation: 2500,
            labor: 3200,
            equipment: 1800,
            qualityControl: 1200,
            storage: 800
          }
        },
        {
          id: 2,
          orderNumber: "ORD-PHM-2025-002",
          batchNumber: "BATCH-PCM-002",
          type: "manufacturing",
          customerName: "Alexandria Pharmaceuticals",
          customerCompany: "Alexandria Pharmaceuticals Ltd.",
          targetProduct: "Paracetamol Tablets 500mg",
          orderDate: "2025-01-20",
          completionDate: "2025-02-18",
          status: "completed",
          totalCost: 32000,
          revenue: 41600,
          profit: 9600,
          rawMaterials: ["Para-aminophenol", "Acetic Anhydride", "Lactose Monohydrate", "Magnesium Stearate"],
          additionalCosts: {
            transportation: 1800,
            labor: 2800,
            equipment: 1500,
            qualityControl: 900,
            storage: 600
          }
        },
        {
          id: 3,
          orderNumber: "ORD-PHM-2025-003",
          batchNumber: "BATCH-AMX-003",
          type: "manufacturing",
          customerName: "MedPharma Solutions",
          customerCompany: "MedPharma Solutions Inc.",
          targetProduct: "Amoxicillin Capsules 250mg",
          orderDate: "2025-02-01",
          completionDate: "2025-03-01",
          status: "in-progress",
          totalCost: 68000,
          revenue: 89000,
          profit: 21000,
          rawMaterials: ["6-Aminopenicillanic Acid", "p-Hydroxybenzaldehyde", "Gelatin Capsules", "Talc Powder"],
          additionalCosts: {
            transportation: 3200,
            labor: 4500,
            equipment: 2800,
            qualityControl: 1800,
            storage: 1200
          }
        },
        {
          id: 4,
          orderNumber: "ORD-PHM-2025-004",
          batchNumber: "BATCH-ASP-004",
          type: "refining",
          customerName: "ChemLab Solutions",
          customerCompany: "ChemLab Solutions Ltd.",
          targetProduct: "Purified Aspirin API",
          orderDate: "2025-02-10",
          completionDate: "2025-03-10",
          status: "pending",
          totalCost: 28000,
          revenue: 36400,
          profit: 8400,
          rawMaterials: ["Raw Aspirin Extract", "Recrystallization Solvent", "Activated Carbon"],
          additionalCosts: {
            transportation: 1500,
            labor: 2200,
            equipment: 1300,
            qualityControl: 800,
            storage: 500
          }
        },
        {
          id: 5,
          orderNumber: "ORD-PHM-2025-005",
          batchNumber: "BATCH-VIT-005",
          type: "manufacturing",
          customerName: "Health Plus Pharmacy",
          customerCompany: "Health Plus Pharmacy Chain",
          targetProduct: "Vitamin C Tablets 1000mg",
          orderDate: "2025-02-15",
          completionDate: "2025-03-15",
          status: "in-progress",
          totalCost: 15000,
          revenue: 21000,
          profit: 6000,
          rawMaterials: ["L-Ascorbic Acid", "Sodium Bicarbonate", "Orange Flavoring", "Citric Acid"],
          additionalCosts: {
            transportation: 800,
            labor: 1200,
            equipment: 700,
            qualityControl: 400,
            storage: 300
          }
        }
      ];

      res.json(pharmaceuticalOrderHistory);
    } catch (error) {
      console.error("Error fetching production order history:", error);
      res.status(500).json({ message: "Failed to fetch production order history" });
    }
  });
}