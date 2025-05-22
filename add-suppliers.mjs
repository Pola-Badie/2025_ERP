import { Pool } from '@neondatabase/serverless';
import ws from 'ws';
import { config } from 'dotenv';

config();

// Configure neon with websocket support
import { neonConfig } from '@neondatabase/serverless';
neonConfig.webSocketConstructor = ws;

(async () => {
  try {
    // Connect to the database
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    // Sample suppliers
    const sampleSuppliers = [
      {
        name: 'Pharma Chemicals Inc.',
        contact_person: 'John Smith',
        email: 'john@pharmachemicals.com',
        phone: '+1 123-456-7890',
        address: '123 Chemical Way',
        city: 'Boston',
        state: 'MA',
        zip_code: '02115',
        materials: 'Raw chemicals, Solvents, Reagents',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Medical Supplies Co.',
        contact_person: 'Sarah Johnson',
        email: 'sarah@medicalsupplies.com',
        phone: '+1 234-567-8901',
        address: '456 Medical Blvd',
        city: 'Chicago',
        state: 'IL',
        zip_code: '60601',
        materials: 'Packaging materials, Vials, Syringes',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Lab Equipment Ltd.',
        contact_person: 'Michael Chen',
        email: 'mchen@labequipment.com',
        phone: '+1 345-678-9012',
        address: '789 Lab Street',
        city: 'San Francisco',
        state: 'CA',
        zip_code: '94107',
        materials: 'Laboratory equipment, Testing supplies',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Global Pharma Solutions',
        contact_person: 'Emma Williams',
        email: 'emma@globalpharma.com',
        phone: '+1 456-789-0123',
        address: '101 Pharma Road',
        city: 'New York',
        state: 'NY',
        zip_code: '10001',
        materials: 'Active pharmaceutical ingredients, Excipients',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Quality Containers Ltd.',
        contact_person: 'David Lee',
        email: 'david@qualitycontainers.com',
        phone: '+1 567-890-1234',
        address: '222 Container Ave',
        city: 'Seattle',
        state: 'WA',
        zip_code: '98101',
        materials: 'Bottles, Tubes, Blister packs, Containers',
        created_at: new Date(),
        updated_at: new Date()
      }
    ];
    
    // Insert suppliers
    for (const supplier of sampleSuppliers) {
      const result = await pool.query(
        `INSERT INTO suppliers 
         (name, contact_person, email, phone, address, city, state, zip_code, materials, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (name) DO UPDATE 
         SET contact_person = $2, email = $3, phone = $4, address = $5, 
             city = $6, state = $7, zip_code = $8, materials = $9, updated_at = $11
         RETURNING *`,
        [
          supplier.name,
          supplier.contact_person,
          supplier.email,
          supplier.phone,
          supplier.address,
          supplier.city,
          supplier.state,
          supplier.zip_code,
          supplier.materials,
          supplier.created_at,
          supplier.updated_at
        ]
      );
      
      console.log(`Upserted supplier: ${supplier.name}`);
    }
    
    console.log('Sample suppliers added successfully!');
    await pool.end();
  } catch (error) {
    console.error('Error adding sample suppliers:', error);
    process.exit(1);
  }
})();
