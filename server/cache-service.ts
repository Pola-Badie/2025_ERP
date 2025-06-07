// High-performance caching service for fast page loads
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class CacheService {
  private cache = new Map<string, CacheEntry>();
  private readonly defaultTTL = 60000; // 1 minute

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  set(key: string, data: any, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

export const cacheService = new CacheService();

// Clean cache every 5 minutes
setInterval(() => cacheService.cleanup(), 5 * 60 * 1000);

// Cache middleware
export const withCache = (key: string, ttl?: number) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${key}_${JSON.stringify(args)}`;
      const cached = cacheService.get(cacheKey);
      
      if (cached) {
        return cached;
      }
      
      const result = await method.apply(this, args);
      cacheService.set(cacheKey, result, ttl);
      return result;
    };
  };
};