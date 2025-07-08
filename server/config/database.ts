import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { logger } from '../middleware/errorHandler.js';
import * as schema from "@shared/schema";

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Database configuration - optimized for better performance and error handling
const dbConfig = {
  connectionString: process.env.DATABASE_URL || 'postgresql://erp_user:erp_secure_password@localhost:5432/premier_erp',
  ssl: false, // Disable SSL for Replit database
  max: 3, // Reduced pool size for stability
  idleTimeoutMillis: 30000, // 30 seconds idle timeout
  connectionTimeoutMillis: 5000, // 5 seconds connection timeout
  maxUses: 1000, // Connection reuse
  allowExitOnIdle: true, // Allow pool to exit when idle
};

// Create connection pool with error handling
export const pool = new Pool(dbConfig);

// Create Drizzle instance with schema
export const db = drizzle(pool, { schema });

// Database health check with better error handling
export const checkDatabaseHealth = async (): Promise<boolean> => {
  let client;
  try {
    client = await pool.connect();
    await client.query('SELECT 1');
    return true;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  } finally {
    if (client) {
      client.release();
    }
  }
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
  if (err.code === '57P01') {
    logger.warn('Database connection terminated by administrator - will reconnect automatically');
  }
});

pool.on('remove', (client) => {
  if (isDevelopment) {
    logger.info('Database client removed from pool');
  }
});

export default db;