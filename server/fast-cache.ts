// Ultra-fast in-memory cache for instant API responses
interface FastCache {
  [key: string]: {
    data: any;
    timestamp: number;
    ttl: number;
  };
}

const cache: FastCache = {};

export const fastCache = {
  get: (key: string) => {
    const item = cache[key];
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.ttl) {
      delete cache[key];
      return null;
    }
    
    return item.data;
  },

  set: (key: string, data: any, ttl: number = 30000) => {
    cache[key] = {
      data,
      timestamp: Date.now(),
      ttl
    };
  },

  clear: () => {
    Object.keys(cache).forEach(key => delete cache[key]);
  }
};

// Middleware for automatic caching
export const cacheMiddleware = (cacheKey: string, ttl: number = 30000) => {
  return (req: any, res: any, next: any) => {
    const cached = fastCache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    
    const originalJson = res.json;
    res.json = function(data: any) {
      fastCache.set(cacheKey, data, ttl);
      return originalJson.call(this, data);
    };
    
    next();
  };
};