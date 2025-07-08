
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { logger } from '../middleware/errorHandler.js';

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Database configuration
const dbConfig = {
  connectionString: process.env.DATABASE_URL || 'postgresql://erp_user:erp_secure_password@localhost:5432/premier_erp',
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection could not be established
  maxUses: 7500, // Close (and replace) a connection after it has been used 7500 times
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

// Graceful shutdown
export const closeDatabaseConnection = async (): Promise<void> => {
  try {
    await pool.end();
    logger.info('Database connection pool closed');
  } catch (error) {
    logger.error('Error closing database connection:', error);
  }
};

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

// Initialize database connection
export const initializeDatabase = async (): Promise<void> => {
  try {
    const isHealthy = await checkDatabaseHealth();
    if (isHealthy) {
      logger.info('Database connection established successfully');
    } else {
      throw new Error('Database health check failed');
    }
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    throw error;
  }
};

export default db;
