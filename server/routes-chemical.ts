import { Express, Request, Response } from "express";

export function registerChemicalRoutes(app: Express) {
  // Raw materials endpoint for chemical orders
  app.get("/api/products/raw-materials", (req: Request, res: Response) => {
    try {
      // Sample raw materials data for chemical manufacturing
      const rawMaterials = [
        { id: 101, name: "Sulfuric Acid", chemicalFormula: "H2SO4", purity: "98%", unitPrice: 12.50, unit: "L", hazardLevel: "High" },
        { id: 102, name: "Hydrochloric Acid", chemicalFormula: "HCl", purity: "37%", unitPrice: 9.75, unit: "L", hazardLevel: "High" },
        { id: 103, name: "Sodium Hydroxide", chemicalFormula: "NaOH", purity: "99%", unitPrice: 8.25, unit: "kg", hazardLevel: "Medium" },
        { id: 104, name: "Potassium Chloride", chemicalFormula: "KCl", purity: "99.5%", unitPrice: 15.30, unit: "kg", hazardLevel: "Low" },
        { id: 105, name: "Ethanol", chemicalFormula: "C2H5OH", purity: "96%", unitPrice: 22.40, unit: "L", hazardLevel: "Medium" },
        { id: 106, name: "Methanol", chemicalFormula: "CH3OH", purity: "99.9%", unitPrice: 18.75, unit: "L", hazardLevel: "High" },
        { id: 107, name: "Acetic Acid", chemicalFormula: "CH3COOH", purity: "99%", unitPrice: 14.20, unit: "L", hazardLevel: "Medium" },
        { id: 108, name: "Acetone", chemicalFormula: "C3H6O", purity: "99.5%", unitPrice: 16.80, unit: "L", hazardLevel: "Medium" },
        { id: 109, name: "Toluene", chemicalFormula: "C7H8", purity: "99.8%", unitPrice: 24.50, unit: "L", hazardLevel: "Medium" },
        { id: 110, name: "Hydrogen Peroxide", chemicalFormula: "H2O2", purity: "30%", unitPrice: 10.90, unit: "L", hazardLevel: "Medium" },
        { id: 111, name: "Phosphoric Acid", chemicalFormula: "H3PO4", purity: "85%", unitPrice: 19.35, unit: "L", hazardLevel: "Medium" },
        { id: 112, name: "Ammonium Chloride", chemicalFormula: "NH4Cl", purity: "99.5%", unitPrice: 12.45, unit: "kg", hazardLevel: "Low" },
        { id: 113, name: "Calcium Chloride", chemicalFormula: "CaCl2", purity: "96%", unitPrice: 9.95, unit: "kg", hazardLevel: "Low" },
        { id: 114, name: "Sodium Bicarbonate", chemicalFormula: "NaHCO3", purity: "99.7%", unitPrice: 7.30, unit: "kg", hazardLevel: "Low" },
        { id: 115, name: "Citric Acid", chemicalFormula: "C6H8O7", purity: "99.5%", unitPrice: 23.15, unit: "kg", hazardLevel: "Low" }
      ];
      res.json(rawMaterials);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });
  
  // Semi-finished products endpoint for chemical orders
  app.get("/api/products/semi-finished", (req: Request, res: Response) => {
    try {
      // Sample semi-finished products for pharmaceutical manufacturing
      const semiFinishedProducts = [
        { id: 201, name: "Acetylsalicylic Acid Crude", chemicalFormula: "C9H8O4", purity: "96%", unitPrice: 35.75, unit: "kg", stage: "Crystallization" },
        { id: 202, name: "Paracetamol Base", chemicalFormula: "C8H9NO2", purity: "98%", unitPrice: 42.50, unit: "kg", stage: "Purification" },
        { id: 203, name: "Ibuprofen Intermediate", chemicalFormula: "C13H18O2", purity: "95%", unitPrice: 53.20, unit: "kg", stage: "Synthesis" },
        { id: 204, name: "Amoxicillin Trihydrate Pre-Form", chemicalFormula: "C16H19N3O5S", purity: "97%", unitPrice: 87.40, unit: "kg", stage: "Fermentation" },
        { id: 205, name: "Metformin Hydrochloride Base", chemicalFormula: "C4H11N5", purity: "99%", unitPrice: 65.30, unit: "kg", stage: "Filtration" },
        { id: 206, name: "Omeprazole Sodium Crude", chemicalFormula: "C17H19N3O3S", purity: "93%", unitPrice: 112.75, unit: "kg", stage: "Precipitation" },
        { id: 207, name: "Losartan Potassium Intermediate", chemicalFormula: "C22H23ClN6O", purity: "96%", unitPrice: 135.90, unit: "kg", stage: "Synthesis" },
        { id: 208, name: "Atorvastatin Calcium Core", chemicalFormula: "C33H35FN2O5", purity: "94%", unitPrice: 225.60, unit: "kg", stage: "Crystallization" },
        { id: 209, name: "Simvastatin Intermediate", chemicalFormula: "C25H38O5", purity: "95%", unitPrice: 185.45, unit: "kg", stage: "Purification" },
        { id: 210, name: "Fluoxetine Hydrochloride Base", chemicalFormula: "C17H18F3NO", purity: "97%", unitPrice: 143.25, unit: "kg", stage: "Synthesis" }
      ];
      res.json(semiFinishedProducts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });
}