import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { logger } from '../middleware/errorHandler.js';
import * as schema from "@shared/schema";

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Database configuration - optimized for stability and memory efficiency
const dbConfig = {
  connectionString: process.env.DATABASE_URL || 'postgresql://erp_user:erp_secure_password@localhost:5432/premier_erp',
  ssl: false, // Disable SSL for Replit database
  max: 3, // Increase pool size slightly for stability
  min: 1, // Keep at least one connection open
  idleTimeoutMillis: 30000, // 30 seconds idle timeout
  connectionTimeoutMillis: 20000, // 20 seconds connection timeout - increased for Replit
  maxUses: 1000, // Increase connection reuse
  allowExitOnIdle: false, // Keep pool alive for stability
  statement_timeout: 60000, // 60 second query timeout
  query_timeout: 60000, // 60 second query timeout
};

// Create connection pool with error handling
export const pool = new Pool(dbConfig);

// Create Drizzle instance with schema
export const db = drizzle(pool, { schema });

// Database health check with retry logic
export const checkDatabaseHealth = async (retries = 3): Promise<boolean> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    let client;
    try {
      client = await pool.connect();
      await client.query('SELECT 1');
      return true;
    } catch (error) {
      if (attempt === retries) {
        logger.error('Database health check failed after all retries:', error);
        return false;
      }
      logger.warn(`Database health check attempt ${attempt} failed, retrying...`);
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    } finally {
      if (client) {
        client.release();
      }
    }
  }
  return false;
};

// Initialize database connection
export const initializeDatabase = async (): Promise<void> => {
  try {
    const isHealthy = await checkDatabaseHealth();
    if (isHealthy) {
      logger.info('✅ Database connection established successfully');
    } else {
      throw new Error('Database health check failed');
    }
  } catch (error) {
    logger.error('❌ Failed to initialize database:', error);
    throw error;
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

// Connection event handlers with better error management
pool.on('connect', (client) => {
  if (isDevelopment) {
    logger.info('New database client connected');
  }
});

pool.on('error', (err, client) => {
  logger.error('Database pool error:', err);
  // Don't exit process, just log the error
  if ((err as any).code === '57P01') {
    logger.warn('Database connection terminated by administrator - will reconnect automatically');
  }
});

pool.on('remove', (client) => {
  if (isDevelopment) {
    logger.info('Database client removed from pool');
  }
});

export default db;