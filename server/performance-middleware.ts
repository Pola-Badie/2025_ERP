import { Request, Response, NextFunction } from 'express';
import compression from 'compression';

// Performance optimization middleware
export const performanceMiddleware = {
  // Compression middleware for faster response times
  compression: compression({
    level: 6,
    threshold: 1024,
    filter: (req: Request, res: Response) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    }
  }),

  // Cache headers for static assets
  cacheHeaders: (req: Request, res: Response, next: NextFunction) => {
    if (req.url.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
    } else if (req.url.startsWith('/api/')) {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    }
    next();
  },

  // Response time tracking
  responseTime: (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (!res.headersSent) {
        res.setHeader('X-Response-Time', `${duration}ms`);
      }
    });
    next();
  },

  // JSON optimization
  jsonOptimization: (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    res.json = function(obj: any) {
      // Remove null values and optimize response size
      const optimized = JSON.parse(JSON.stringify(obj, (key, value) => {
        if (value === null) return undefined;
        return value;
      }));
      return originalJson.call(this, optimized);
    };
    next();
  },

  // Memory optimization headers
  memoryOptimization: (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  }
};

// Database query optimization utilities
export const queryOptimization = {
  // Batch queries to reduce database roundtrips
  batchQuery: async (queries: (() => Promise<any>)[]) => {
    return Promise.all(queries.map(query => query()));
  },

  // Result caching for frequently accessed data
  resultCache: new Map<string, { data: any; timestamp: number; ttl: number }>(),

  getCached: (key: string): any | null => {
    const cached = queryOptimization.resultCache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    queryOptimization.resultCache.delete(key);
    return null;
  },

  setCache: (key: string, data: any, ttl: number = 60000) => {
    queryOptimization.resultCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  },

  clearExpiredCache: () => {
    const now = Date.now();
    queryOptimization.resultCache.forEach((value, key) => {
      if (now - value.timestamp > value.ttl) {
        queryOptimization.resultCache.delete(key);
      }
    });
  }
};

// Cleanup expired cache every 5 minutes
setInterval(queryOptimization.clearExpiredCache, 5 * 60 * 1000);