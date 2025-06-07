// Performance optimization configuration
export const PERFORMANCE_CONFIG = {
  // Query client settings
  queries: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
  },
  
  // Component lazy loading thresholds
  lazyLoading: {
    intersectionThreshold: 0.1,
    rootMargin: '50px',
  },
  
  // Bundle splitting
  chunkSize: {
    maxSize: 250000, // 250KB
    minSize: 20000,  // 20KB
  },
  
  // Cache settings
  cache: {
    maxAge: 1000 * 60 * 60, // 1 hour
    maxSize: 100, // Maximum number of cached items
  },
  
  // Network optimization
  network: {
    timeout: 10000, // 10 seconds
    retryDelay: 1000, // 1 second
    maxRetries: 2,
  },
  
  // UI optimization
  ui: {
    debounceDelay: 300, // 300ms for search inputs
    throttleDelay: 100, // 100ms for scroll events
    animationDuration: 200, // 200ms for transitions
  },
};

// Performance monitoring utilities
export const performanceMonitor = {
  startTiming: (label: string) => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.mark(`${label}-start`);
    }
  },
  
  endTiming: (label: string) => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.mark(`${label}-end`);
      performance.measure(label, `${label}-start`, `${label}-end`);
    }
  },
  
  logMetrics: () => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const measures = performance.getEntriesByType('measure');
      measures.forEach(measure => {
        console.log(`${measure.name}: ${measure.duration.toFixed(2)}ms`);
      });
    }
  },
};

// Preload critical resources
export const preloadResources = () => {
  if (typeof window !== 'undefined') {
    // Preload critical CSS
    const linkElement = document.createElement('link');
    linkElement.rel = 'preload';
    linkElement.as = 'style';
    linkElement.href = '/src/index.css';
    document.head.appendChild(linkElement);
    
    // Preconnect to API endpoints
    const preconnectElement = document.createElement('link');
    preconnectElement.rel = 'preconnect';
    preconnectElement.href = window.location.origin;
    document.head.appendChild(preconnectElement);
  }
};