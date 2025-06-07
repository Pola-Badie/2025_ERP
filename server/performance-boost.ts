import type { Express, Request, Response, NextFunction } from "express";
import compression from "compression";

// Ultra-aggressive compression and optimization middleware
export const performanceBoost = {
  // Maximum compression for all responses
  compression: compression({
    level: 9,
    threshold: 0,
    filter: () => true,
    memLevel: 9
  }),

  // Aggressive response headers for caching
  cacheHeaders: (req: Request, res: Response, next: NextFunction) => {
    // Set aggressive cache headers
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('ETag', `"${Date.now()}"`);
    res.setHeader('Last-Modified', new Date().toUTCString());
    
    // Enable compression
    res.setHeader('Content-Encoding', 'gzip');
    res.setHeader('Vary', 'Accept-Encoding');
    
    next();
  },

  // Preload critical resources
  preloadHeaders: (req: Request, res: Response, next: NextFunction) => {
    if (req.path === '/') {
      res.setHeader('Link', [
        '</src/main.tsx>; rel=preload; as=script',
        '</src/App.tsx>; rel=preload; as=script',
        '</src/index.css>; rel=preload; as=style',
        '</src/pages/Dashboard.tsx>; rel=preload; as=script'
      ].join(', '));
    }
    next();
  },

  // Optimize JSON responses
  jsonOptimization: (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    res.json = function(obj: any) {
      // Minify JSON response
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return originalJson.call(this, obj);
    };
    next();
  },

  // Early response for cached requests
  earlyResponse: (req: Request, res: Response, next: NextFunction) => {
    const ifNoneMatch = req.headers['if-none-match'];
    const ifModifiedSince = req.headers['if-modified-since'];
    
    if (ifNoneMatch || ifModifiedSince) {
      res.status(304).end();
      return;
    }
    
    next();
  }
};

// Database query optimization
export const queryOptimizations = {
  // Limit query results by default
  limitResults: (baseQuery: any, limit: number = 100) => {
    return baseQuery.limit(limit);
  },

  // Select only necessary fields
  selectFields: (fields: string[]) => {
    return fields.reduce((acc, field) => {
      acc[field] = true;
      return acc;
    }, {} as Record<string, boolean>);
  },

  // Batch queries together
  batchQueries: async (queries: Promise<any>[]) => {
    return Promise.all(queries);
  }
};