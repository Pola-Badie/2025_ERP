import { Request, Response, NextFunction } from 'express';
import compression from 'compression';

// High-performance middleware stack for lightning-fast responses
export const performanceMiddleware = {
  // Aggressive compression for smaller payloads
  compression: compression({
    filter: (req: Request, res: Response) => {
      if (req.headers['x-no-compression']) return false;
      return compression.filter(req, res);
    },
    level: 6,
    threshold: 1024
  }),

  // Cache headers for static content
  cacheHeaders: (req: Request, res: Response, next: NextFunction) => {
    if (req.url.includes('/api/')) {
      res.set({
        'Cache-Control': 'public, max-age=30',
        'ETag': `"${Date.now()}"`,
        'Last-Modified': new Date().toUTCString()
      });
    }
    next();
  },

  // Response time optimization
  responseTime: (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (duration > 100) {
        console.warn(`Slow response: ${req.method} ${req.url} took ${duration}ms`);
      }
    });
    next();
  },

  // JSON optimization
  jsonOptimization: (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    res.json = function(data: any) {
      res.set('Content-Type', 'application/json; charset=utf-8');
      return originalJson.call(this, data);
    };
    next();
  },

  // Memory optimization
  memoryOptimization: (req: Request, res: Response, next: NextFunction) => {
    res.on('finish', () => {
      if (global.gc) {
        global.gc();
      }
    });
    next();
  }
};

// Database query optimization helpers
export const queryOptimization = {
  // Limit query results to prevent memory issues
  limitResults: (limit: number = 1000) => limit,
  
  // Optimize select fields to reduce data transfer
  selectEssentialFields: (table: any) => ({
    id: table.id,
    name: table.name,
    createdAt: table.createdAt
  })
};