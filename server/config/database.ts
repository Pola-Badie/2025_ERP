
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../shared/schema';

const connectionString = process.env.DATABASE_URL || 'postgresql://erp_user:erp_secure_password@localhost:5432/premier_erp';

// Connection pool configuration
const client = postgres(connectionString, {
  max: 20,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false,
});

export const db = drizzle(client, { schema });

// Health check function
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    await client`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Closing database connection...');
  await client.end();
  process.exit(0);
});
