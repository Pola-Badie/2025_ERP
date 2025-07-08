import pkg from 'pg';
const { Pool } = pkg;
import { config } from 'dotenv';
config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addDiverseProducts() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // First, let's create categories if they don't exist
    const categories = [
      { name: 'Pharmaceuticals', description: 'Medical drugs and medications' },
      { name: 'Chemicals', description: 'Industrial and laboratory chemicals' },
      { name: 'Raw Materials', description: 'Basic manufacturing materials' },
      { name: 'Packaging Materials', description: 'Containers and packaging supplies' },
      { name: 'Equipment & Supplies', description: 'Tools and laboratory equipment' },
      { name: 'Office Supplies', description: 'General office materials' }
    ];

    for (const category of categories) {
      await client.query(`
        INSERT INTO product_categories (name, description) 
        VALUES ($1, $2) 
        ON CONFLICT (name) DO NOTHING
      `, [category.name, category.description]);
    }

    // Get category IDs
    const categoryResult = await client.query('SELECT id, name FROM product_categories');
    const categoryMap = {};
    categoryResult.rows.forEach(row => {
      categoryMap[row.name] = row.id;
    });

    // Ensure we have warehouses
    const warehouseResult = await client.query('SELECT id, name FROM warehouses ORDER BY id LIMIT 3');
    let warehouses = warehouseResult.rows;
    
    if (warehouses.length < 3) {
      // Create missing warehouses
      const warehouseNames = ['Main Storage Facility', 'Cold Storage Unit', 'Hazardous Materials Storage'];
      for (let i = warehouses.length; i < 3; i++) {
        const result = await client.query(`
          INSERT INTO warehouses (name, location, capacity, current_stock, manager_id) 
          VALUES ($1, $2, $3, $4, $5) 
          RETURNING id, name
        `, [warehouseNames[i], `Location ${i + 1}`, 1000, 0, 1]);
        warehouses.push(result.rows[0]);
      }
    }

    // Products to add
    const products = [
      // PHARMACEUTICALS
      { name: 'Aspirin 500mg', category: 'Pharmaceuticals', warehouse: 0, stock: 150, reorder: 50, expiry: '2025-08-15', price: 5.50, unit: 'tablets' },
      { name: 'Paracetamol 250mg', category: 'Pharmaceuticals', warehouse: 1, stock: 5, reorder: 30, expiry: '2025-03-20', price: 8.75, unit: 'tablets' },
      { name: 'Amoxicillin 500mg', category: 'Pharmaceuticals', warehouse: 0, stock: 0, reorder: 25, expiry: '2025-12-10', price: 15.25, unit: 'capsules' },
      { name: 'Ibuprofen 400mg', category: 'Pharmaceuticals', warehouse: 2, stock: 200, reorder: 40, expiry: '2025-01-15', price: 12.00, unit: 'tablets' },
      { name: 'Vitamin C Tablets', category: 'Pharmaceuticals', warehouse: 1, stock: 8, reorder: 20, expiry: '2023-11-30', price: 18.50, unit: 'tablets' },
      { name: 'Insulin Vials', category: 'Pharmaceuticals', warehouse: 0, stock: 25, reorder: 15, expiry: '2025-06-01', price: 85.00, unit: 'vials' },
      { name: 'Blood Pressure Pills', category: 'Pharmaceuticals', warehouse: 2, stock: 75, reorder: 30, expiry: '2025-09-15', price: 22.75, unit: 'tablets' },

      // CHEMICALS
      { name: 'Sulfuric Acid 98%', category: 'Chemicals', warehouse: 0, stock: 12, reorder: 20, expiry: '2026-01-01', price: 125.75, unit: 'liters' },
      { name: 'Sodium Hydroxide', category: 'Chemicals', warehouse: 1, stock: 500, reorder: 100, expiry: '2025-12-31', price: 45.00, unit: 'kg' },
      { name: 'Hydrochloric Acid', category: 'Chemicals', warehouse: 0, stock: 0, reorder: 50, expiry: '2025-10-15', price: 95.50, unit: 'liters' },
      { name: 'Methanol', category: 'Chemicals', warehouse: 2, stock: 300, reorder: 75, expiry: '2025-02-28', price: 35.25, unit: 'liters' },
      { name: 'Ethanol 95%', category: 'Chemicals', warehouse: 1, stock: 150, reorder: 40, expiry: '2025-11-20', price: 28.90, unit: 'liters' },
      { name: 'Acetone', category: 'Chemicals', warehouse: 0, stock: 3, reorder: 25, expiry: '2023-12-15', price: 42.00, unit: 'liters' },

      // RAW MATERIALS
      { name: 'Aluminum Powder', category: 'Raw Materials', warehouse: 0, stock: 45, reorder: 50, expiry: null, price: 2500.00, unit: 'kg' },
      { name: 'Iron Oxide', category: 'Raw Materials', warehouse: 1, stock: 800, reorder: 200, expiry: null, price: 1200.00, unit: 'kg' },
      { name: 'Titanium Dioxide', category: 'Raw Materials', warehouse: 2, stock: 0, reorder: 100, expiry: null, price: 3200.00, unit: 'kg' },
      { name: 'Calcium Carbonate', category: 'Raw Materials', warehouse: 0, stock: 600, reorder: 150, expiry: null, price: 850.00, unit: 'kg' },
      { name: 'Magnesium Sulfate', category: 'Raw Materials', warehouse: 1, stock: 15, reorder: 40, expiry: '2025-01-30', price: 650.00, unit: 'kg' },

      // PACKAGING MATERIALS
      { name: 'Glass Vials 10ml', category: 'Packaging Materials', warehouse: 0, stock: 2000, reorder: 500, expiry: null, price: 0.75, unit: 'pcs' },
      { name: 'Plastic Bottles 100ml', category: 'Packaging Materials', warehouse: 1, stock: 45, reorder: 200, expiry: null, price: 1.25, unit: 'pcs' },
      { name: 'Labels - Product', category: 'Packaging Materials', warehouse: 2, stock: 0, reorder: 1000, expiry: null, price: 0.05, unit: 'pcs' },
      { name: 'Cardboard Boxes', category: 'Packaging Materials', warehouse: 0, stock: 300, reorder: 100, expiry: null, price: 2.50, unit: 'boxes' },
      { name: 'Bubble Wrap', category: 'Packaging Materials', warehouse: 1, stock: 25, reorder: 50, expiry: null, price: 15.00, unit: 'rolls' },

      // EQUIPMENT & SUPPLIES
      { name: 'Digital Scale', category: 'Equipment & Supplies', warehouse: 0, stock: 5, reorder: 2, expiry: null, price: 450.00, unit: 'pcs' },
      { name: 'Safety Goggles', category: 'Equipment & Supplies', warehouse: 1, stock: 1, reorder: 10, expiry: null, price: 25.00, unit: 'pcs' },
      { name: 'Latex Gloves', category: 'Equipment & Supplies', warehouse: 2, stock: 0, reorder: 100, expiry: '2024-12-31', price: 12.50, unit: 'boxes' },
      { name: 'pH Test Strips', category: 'Equipment & Supplies', warehouse: 0, stock: 50, reorder: 20, expiry: '2025-03-15', price: 18.75, unit: 'pcs' },
      { name: 'Thermometers', category: 'Equipment & Supplies', warehouse: 1, stock: 8, reorder: 15, expiry: null, price: 65.00, unit: 'pcs' },

      // OFFICE SUPPLIES
      { name: 'Printer Paper', category: 'Office Supplies', warehouse: 0, stock: 100, reorder: 25, expiry: null, price: 8.50, unit: 'reams' },
      { name: 'Ink Cartridges', category: 'Office Supplies', warehouse: 1, stock: 2, reorder: 10, expiry: null, price: 45.00, unit: 'pcs' },
      { name: 'Staplers', category: 'Office Supplies', warehouse: 2, stock: 0, reorder: 5, expiry: null, price: 15.75, unit: 'pcs' },
      { name: 'Pens', category: 'Office Supplies', warehouse: 0, stock: 200, reorder: 50, expiry: null, price: 1.25, unit: 'pcs' }
    ];

    let addedCount = 0;
    
    for (const product of products) {
      // Check if product already exists
      const existingProduct = await client.query(
        'SELECT id FROM products WHERE name = $1',
        [product.name]
      );

      if (existingProduct.rows.length === 0) {
        // Generate SKU and batch number
        const sku = `SKU-${product.name.replace(/\s+/g, '').substring(0, 8).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
        const batchNumber = `BA-2024-${String(addedCount + 1).padStart(3, '0')}`;

        // Insert product
        const productResult = await client.query(`
          INSERT INTO products (
            name, description, sku, cost_price, selling_price, 
            unit_of_measure, low_stock_threshold, expiry_date, 
            status, product_type, manufacturer, category_id,
            batch_number
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING id
        `, [
          product.name,
          `High-quality ${product.name.toLowerCase()} for ${product.category.toLowerCase()}`,
          sku,
          product.price * 0.7, // cost price (70% of selling)
          product.price,
          product.unit,
          product.reorder,
          product.expiry,
          product.stock === 0 ? 'out_of_stock' : (product.stock <= product.reorder ? 'low_stock' : 'active'),
          'finished_goods',
          'Premier Manufacturing',
          categoryMap[product.category],
          batchNumber
        ]);

        const productId = productResult.rows[0].id;

        // Insert into product_warehouses
        await client.query(`
          INSERT INTO product_warehouses (product_id, warehouse_id, quantity, location, shelf)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          productId,
          warehouses[product.warehouse].id,
          product.stock,
          `Aisle ${String.fromCharCode(65 + product.warehouse)}`,
          `Shelf ${Math.floor(Math.random() * 10) + 1}`
        ]);

        addedCount++;
        console.log(`Added: ${product.name} to ${warehouses[product.warehouse].name}`);
      }
    }

    await client.query('COMMIT');
    console.log(`\n✅ Successfully added ${addedCount} diverse products across warehouses!`);
    console.log(`📊 Products distributed across:
    - ${warehouses[0].name}: ${products.filter(p => p.warehouse === 0).length} products
    - ${warehouses[1].name}: ${products.filter(p => p.warehouse === 1).length} products  
    - ${warehouses[2].name}: ${products.filter(p => p.warehouse === 2).length} products`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding diverse products:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

addDiverseProducts();