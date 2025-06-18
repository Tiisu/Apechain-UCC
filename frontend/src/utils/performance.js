/**
 * Performance optimization utilities for Ghana mobile users
 * Optimized for low-bandwidth, high-latency connections
 */

// Network detection and optimization
export class NetworkOptimizer {
  constructor() {
    this.connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    this.isSlowConnection = this.detectSlowConnection();
    this.setupNetworkMonitoring();
  }

  detectSlowConnection() {
    if (!this.connection) return false;
    
    // Consider 2G, slow-2g, or effective type as slow
    const slowTypes = ['slow-2g', '2g'];
    const slowEffectiveTypes = ['slow-2g', '2g'];
    
    return (
      slowTypes.includes(this.connection.type) ||
      slowEffectiveTypes.includes(this.connection.effectiveType) ||
      this.connection.downlink < 1.5 || // Less than 1.5 Mbps
      this.connection.rtt > 300 // Round trip time > 300ms
    );
  }

  setupNetworkMonitoring() {
    if (this.connection) {
      this.connection.addEventListener('change', () => {
        this.isSlowConnection = this.detectSlowConnection();
        this.notifyNetworkChange();
      });
    }
  }

  notifyNetworkChange() {
    const event = new CustomEvent('networkchange', {
      detail: { isSlowConnection: this.isSlowConnection }
    });
    window.dispatchEvent(event);
  }

  getOptimizedSettings() {
    return {
      imageQuality: this.isSlowConnection ? 'low' : 'high',
      animationsEnabled: !this.isSlowConnection,
      autoRefresh: !this.isSlowConnection,
      batchRequests: this.isSlowConnection,
      cacheStrategy: this.isSlowConnection ? 'aggressive' : 'normal'
    };
  }
}

// Image optimization for mobile
export const optimizeImage = (src, quality = 'medium') => {
  const qualitySettings = {
    low: { width: 300, quality: 60 },
    medium: { width: 600, quality: 80 },
    high: { width: 1200, quality: 90 }
  };
  
  const settings = qualitySettings[quality] || qualitySettings.medium;
  
  // In production, use a service like Cloudinary or ImageKit
  return `${src}?w=${settings.width}&q=${settings.quality}&f=webp`;
};

// Lazy loading utility
export const useLazyLoading = () => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return [ref, isVisible];
};

// Request batching for slow connections
export class RequestBatcher {
  constructor(delay = 500) {
    this.delay = delay;
    this.queue = [];
    this.timeoutId = null;
  }

  add(request) {
    this.queue.push(request);
    this.scheduleFlush();
  }

  scheduleFlush() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    
    this.timeoutId = setTimeout(() => {
      this.flush();
    }, this.delay);
  }

  async flush() {
    if (this.queue.length === 0) return;
    
    const requests = [...this.queue];
    this.queue = [];
    
    try {
      // Execute all requests in parallel
      const results = await Promise.allSettled(
        requests.map(req => req.execute())
      );
      
      // Handle results
      results.forEach((result, index) => {
        const request = requests[index];
        if (result.status === 'fulfilled') {
          request.resolve(result.value);
        } else {
          request.reject(result.reason);
        }
      });
    } catch (error) {
      console.error('Batch request failed:', error);
    }
  }
}

// Cache management for offline support
export class CacheManager {
  constructor(maxAge = 5 * 60 * 1000) { // 5 minutes default
    this.cache = new Map();
    this.maxAge = maxAge;
  }

  set(key, value, customMaxAge) {
    const maxAge = customMaxAge || this.maxAge;
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      maxAge
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.maxAge) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  clear() {
    this.cache.clear();
  }

  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.maxAge) {
        this.cache.delete(key);
      }
    }
  }
}

// Progressive Web App utilities
export const PWAUtils = {
  // Check if app is installed
  isInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
  },

  // Prompt for installation
  async promptInstall() {
    if (window.deferredPrompt) {
      window.deferredPrompt.prompt();
      const { outcome } = await window.deferredPrompt.userChoice;
      window.deferredPrompt = null;
      return outcome === 'accepted';
    }
    return false;
  },

  // Register service worker
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }
};

// Ghana-specific optimizations
export const GhanaOptimizations = {
  // Format currency for Ghana
  formatCurrency(amount, currency = 'GHS') {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  },

  // Format phone numbers for Ghana
  formatPhoneNumber(phone) {
    // Convert to Ghana format
    let formatted = phone.replace(/\D/g, '');
    
    if (formatted.startsWith('233')) {
      formatted = '+' + formatted;
    } else if (formatted.startsWith('0')) {
      formatted = '+233' + formatted.substring(1);
    } else if (!formatted.startsWith('+233')) {
      formatted = '+233' + formatted;
    }
    
    return formatted;
  },

  // Get optimal server region
  getOptimalRegion() {
    // For Ghana users, prefer West Africa or Europe servers
    return 'eu-west-1'; // AWS Ireland is often good for Ghana
  },

  // Time zone handling
  getGhanaTime() {
    return new Date().toLocaleString('en-GH', {
      timeZone: 'Africa/Accra'
    });
  }
};

// Performance monitoring
export class PerformanceMonitor {
  constructor() {
    this.metrics = {
      pageLoad: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      cumulativeLayoutShift: 0,
      firstInputDelay: 0
    };
    
    this.setupMonitoring();
  }

  setupMonitoring() {
    // Page load time
    window.addEventListener('load', () => {
      this.metrics.pageLoad = performance.now();
    });

    // Web Vitals
    if ('PerformanceObserver' in window) {
      // First Contentful Paint
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.firstContentfulPaint = entry.startTime;
          }
        }
      }).observe({ entryTypes: ['paint'] });

      // Largest Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.largestContentfulPaint = lastEntry.startTime;
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // Cumulative Layout Shift
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            this.metrics.cumulativeLayoutShift += entry.value;
          }
        }
      }).observe({ entryTypes: ['layout-shift'] });

      // First Input Delay
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.metrics.firstInputDelay = entry.processingStart - entry.startTime;
        }
      }).observe({ entryTypes: ['first-input'] });
    }
  }

  getMetrics() {
    return { ...this.metrics };
  }

  reportMetrics() {
    // Send metrics to analytics service
    console.log('Performance Metrics:', this.getMetrics());
  }
}

// Initialize performance optimizations
export const initializePerformanceOptimizations = () => {
  const networkOptimizer = new NetworkOptimizer();
  const performanceMonitor = new PerformanceMonitor();
  
  // Register service worker for PWA
  PWAUtils.registerServiceWorker();
  
  // Setup performance reporting
  setTimeout(() => {
    performanceMonitor.reportMetrics();
  }, 5000);
  
  return {
    networkOptimizer,
    performanceMonitor,
    isSlowConnection: networkOptimizer.isSlowConnection
  };
};
