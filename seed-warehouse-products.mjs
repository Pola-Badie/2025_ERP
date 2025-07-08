import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function seedWarehouseProducts() {
  try {
    console.log('Starting warehouse product distribution...');

    // First, create warehouses if they don't exist
    const warehouses = await sql`
      INSERT INTO warehouses (name, code, address, is_active) 
      VALUES 
        ('Main Warehouse', 'MAIN-01', '123 Industrial Ave, Cairo', true),
        ('North Branch', 'NORTH-01', '456 Medical District, Alexandria', true),
        ('South Storage', 'SOUTH-01', '789 Pharma Park, Aswan', true),
        ('East Facility', 'EAST-01', '321 Chemical Zone, Port Said', true),
        ('West Distribution', 'WEST-01', '654 Supply Center, Luxor', true),
        ('Central Hub', 'CENT-01', '987 Logistics Blvd, Giza', true)
      ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
      RETURNING id, name, code
    `;
    
    console.log('Warehouses created/updated:', warehouses.length);

    // Get all products
    const products = await sql`SELECT id, name FROM products`;
    console.log('Found products:', products.length);

    // Clear existing product-warehouse associations
    await sql`DELETE FROM product_warehouses`;

    // Distribute products across warehouses
    const distributions = [
      // Main Warehouse (MAIN-01) - Raw materials and common pharmaceuticals
      { warehouseId: warehouses[0].id, productIds: [1, 2, 3, 7, 8, 15, 16, 17] },
      
      // North Branch (NORTH-01) - Antibiotics and specialized drugs
      { warehouseId: warehouses[1].id, productIds: [4, 5, 11, 12, 18, 19] },
      
      // South Storage (SOUTH-01) - Pain relievers and anti-inflammatory
      { warehouseId: warehouses[2].id, productIds: [1, 6, 9, 10, 13] },
      
      // East Facility (EAST-01) - Raw chemicals and compounds
      { warehouseId: warehouses[3].id, productIds: [14, 15, 16, 17, 18, 19, 20, 21] },
      
      // West Distribution (WEST-01) - Finished products and vitamins
      { warehouseId: warehouses[4].id, productIds: [2, 3, 7, 8, 13, 14] },
      
      // Central Hub (CENT-01) - Emergency stock and high-demand items
      { warehouseId: warehouses[5].id, productIds: [1, 4, 5, 6, 9, 10, 11, 12] }
    ];

    // Insert product-warehouse associations
    for (const dist of distributions) {
      for (const productId of dist.productIds) {
        const product = products.find(p => p.id === productId);
        if (product) {
          // Generate random quantities based on warehouse type
          const baseQuantity = Math.floor(Math.random() * 500) + 100;
          const location = `Zone ${String.fromCharCode(65 + Math.floor(Math.random() * 4))}`; // Zone A-D
          const shelf = `${Math.floor(Math.random() * 10) + 1}-${String.fromCharCode(65 + Math.floor(Math.random() * 5))}`; // 1-10 A-E

          await sql`
            INSERT INTO product_warehouses (product_id, warehouse_id, quantity, location, shelf)
            VALUES (${productId}, ${dist.warehouseId}, ${baseQuantity}, ${location}, ${shelf})
          `;
        }
      }
    }

    console.log('Product-warehouse associations created successfully!');

    // Display distribution summary
    const summary = await sql`
      SELECT 
        w.name as warehouse_name,
        COUNT(pw.id) as product_count,
        SUM(pw.quantity) as total_quantity
      FROM warehouses w
      LEFT JOIN product_warehouses pw ON w.id = pw.warehouse_id
      GROUP BY w.id, w.name
      ORDER BY w.name
    `;

    console.log('\nWarehouse Distribution Summary:');
    summary.forEach(row => {
      console.log(`${row.warehouse_name}: ${row.product_count} products, ${row.total_quantity} total units`);
    });

  } catch (error) {
    console.error('Error seeding warehouse products:', error);
  }
}

seedWarehouseProducts();