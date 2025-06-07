// Ultra-aggressive caching system for maximum performance
interface UltraCacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
  hits: number;
}

class UltraCache {
  private cache = new Map<string, UltraCacheEntry>();
  private readonly defaultTTL = 300000; // 5 minutes
  private readonly maxSize = 1000;
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup every 2 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 120000);
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    entry.hits++;
    return entry.data;
  }

  set(key: string, data: any, ttl: number = this.defaultTTL): void {
    // Auto-cleanup if cache is getting too large
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    this.cache.set(key, {
      data: JSON.parse(JSON.stringify(data)), // Deep clone to prevent mutation
      timestamp: Date.now(),
      ttl,
      hits: 0
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    const entriesToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        entriesToDelete.push(key);
      }
    }

    // Remove expired entries
    entriesToDelete.forEach(key => this.cache.delete(key));

    // If still too large, remove least used entries
    if (this.cache.size > this.maxSize * 0.8) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].hits - b[1].hits)
        .slice(0, Math.floor(this.maxSize * 0.2));
      
      entries.forEach(([key]) => this.cache.delete(key));
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      usage: Math.round((this.cache.size / this.maxSize) * 100)
    };
  }
}

export const ultraCache = new UltraCache();

// Ultra-fast middleware for aggressive caching
export const ultraCacheMiddleware = (cacheKey: string, ttl: number = 300000) => {
  return (req: any, res: any, next: any) => {
    const key = `${cacheKey}_${req.url}_${JSON.stringify(req.query)}`;
    const cached = ultraCache.get(key);
    
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('Cache-Control', 'public, max-age=300');
      return res.json(cached);
    }

    const originalJson = res.json;
    res.json = function(data: any) {
      ultraCache.set(key, data, ttl);
      res.setHeader('X-Cache', 'MISS');
      res.setHeader('Cache-Control', 'public, max-age=300');
      return originalJson.call(this, data);
    };

    next();
  };
};