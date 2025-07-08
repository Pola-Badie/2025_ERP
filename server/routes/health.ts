
import express from 'express';
import { checkDatabaseConnection } from '../config/database';

const router = express.Router();

router.get('/health', async (req, res) => {
  const dbHealth = await checkDatabaseConnection();
  
  const health = {
    status: dbHealth ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbHealth ? 'connected' : 'disconnected',
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0'
  };

  res.status(dbHealth ? 200 : 503).json(health);
});

router.get('/ready', async (req, res) => {
  const dbHealth = await checkDatabaseConnection();
  
  if (dbHealth) {
    res.status(200).json({ status: 'ready' });
  } else {
    res.status(503).json({ status: 'not ready' });
  }
});

export default router;
