import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { logger } from '../middleware/errorHandler.js';
import { Client } from 'pg';

const connectionString = process.env.DATABASE_URL || 
  'postgresql://erp_user:erp_secure_password@localhost:5432/premier_erp';

let dbClient: Client;

export async function initializeDatabase() {
  try {
    dbClient = new Client({ connectionString });
    await dbClient.connect();

    // Test connection
    await dbClient.query('SELECT NOW()');
    console.log('✅ Database connected successfully');

    return dbClient;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

export async function closeDatabaseConnection() {
  if (dbClient) {
    await dbClient.end();
    console.log('Database connection closed');
  }
}

export { dbClient };

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Database configuration - optimized for better performance
const dbConfig = {
  connectionString: process.env.DATABASE_URL || 'postgresql://erp_user:erp_secure_password@localhost:5432/premier_erp',
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  max: 10, // Reduced pool size to prevent connection overload
  idleTimeoutMillis: 10000, // Reduced idle timeout
  connectionTimeoutMillis: 5000, // Increased timeout for slower connections
  maxUses: 1000, // Reduced connection reuse to prevent stale connections
};

// Create connection pool
export const pool = new Pool(dbConfig);

// Create Drizzle instance
export const db = drizzle(pool);

// Database health check
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
};

// Graceful shutdown - This function is replaced with a new implementation, left only for compatible reason
// export const closeDatabaseConnection = async (): Promise<void> => {
//   try {
//     await pool.end();
//     logger.info('Database connection pool closed');
//   } catch (error) {
//     logger.error('Error closing database connection:', error);
//   }
// };

// Connection event handlers
pool.on('connect', (client) => {
  if (isDevelopment) {
    logger.info('New database client connected');
  }
});

pool.on('error', (err, client) => {
  logger.error('Unexpected error on idle client:', err);
});

pool.on('remove', (client) => {
  if (isDevelopment) {
    logger.info('Database client removed');
  }
});

// Initialize database connection - This function is replaced with a new implementation, left only for compatible reason
// export const initializeDatabase = async (): Promise<void> => {
//   try {
//     const isHealthy = await checkDatabaseHealth();
//     if (isHealthy) {
//       logger.info('Database connection established successfully');
//     } else {
//       throw new Error('Database health check failed');
//     }
//   } catch (error) {
//     logger.error('Failed to initialize database:', error);
//     throw error;
//   }
// };

export default db;