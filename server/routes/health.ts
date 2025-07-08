
import { Router, Request, Response } from 'express';
import { checkDatabaseHealth } from '../config/database.js';
import { logger } from '../middleware/errorHandler.js';

const router = Router();

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: 'healthy' | 'unhealthy';
    server: 'healthy' | 'unhealthy';
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
}

router.get('/health', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    
    // Check database health
    const databaseHealthy = await checkDatabaseHealth();
    
    // Memory usage
    const memoryUsage = process.memoryUsage();
    const totalMemory = memoryUsage.heapTotal;
    const usedMemory = memoryUsage.heapUsed;
    const memoryPercentage = Math.round((usedMemory / totalMemory) * 100);

    const healthStatus: HealthStatus = {
      status: databaseHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: databaseHealthy ? 'healthy' : 'unhealthy',
        server: 'healthy',
      },
      memory: {
        used: Math.round(usedMemory / 1024 / 1024), // MB
        total: Math.round(totalMemory / 1024 / 1024), // MB
        percentage: memoryPercentage,
      },
    };

    const responseTime = Date.now() - startTime;
    
    if (healthStatus.status === 'healthy') {
      logger.info(`Health check passed in ${responseTime}ms`);
      res.status(200).json(healthStatus);
    } else {
      logger.warn(`Health check failed in ${responseTime}ms`);
      res.status(503).json(healthStatus);
    }
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Internal server error during health check',
    });
  }
});

router.get('/readiness', async (req: Request, res: Response) => {
  try {
    const databaseHealthy = await checkDatabaseHealth();
    
    if (databaseHealthy) {
      res.status(200).json({ status: 'ready' });
    } else {
      res.status(503).json({ status: 'not ready', reason: 'database unavailable' });
    }
  } catch (error) {
    logger.error('Readiness check error:', error);
    res.status(503).json({ status: 'not ready', reason: 'internal error' });
  }
});

router.get('/liveness', (req: Request, res: Response) => {
  res.status(200).json({ status: 'alive' });
});

export default router;
