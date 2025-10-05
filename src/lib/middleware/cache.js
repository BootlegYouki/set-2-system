/**
 * Simple in-memory cache middleware for reducing database requests
 * Implements TTL (Time To Live) based caching with automatic cleanup
 */

class SimpleCache {
  constructor() {
    this.cache = new Map();
    this.ttl = new Map(); // Time to live for each cache entry
    
    // Default TTL values (in milliseconds)
    this.defaultTTL = {
      dashboard: 2 * 60 * 1000,      // 2 minutes for dashboard stats
      users: 5 * 60 * 1000,         // 5 minutes for user lists
      sections: 3 * 60 * 1000,      // 3 minutes for sections
      subjects: 10 * 60 * 1000,     // 10 minutes for subjects (rarely change)
      rooms: 10 * 60 * 1000,        // 10 minutes for rooms
      schedules: 5 * 60 * 1000,     // 5 minutes for schedules
      grades: 1 * 60 * 1000,        // 1 minute for grades (more dynamic)
      students: 3 * 60 * 1000,      // 3 minutes for student lists
      notifications: 30 * 1000,     // 30 seconds for notifications
      default: 2 * 60 * 1000        // 2 minutes default
    };
    
    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  /**
   * Generate cache key from request details
   */
  generateKey(url, method = 'GET', userId = null) {
    const urlObj = new URL(url, 'http://localhost');
    const path = urlObj.pathname;
    const params = Array.from(urlObj.searchParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    
    return `${method}:${path}${params ? '?' + params : ''}${userId ? ':user:' + userId : ''}`;
  }

  /**
   * Get TTL for specific endpoint
   */
  getTTL(path) {
    if (path.includes('/dashboard')) return this.defaultTTL.dashboard;
    if (path.includes('/users')) return this.defaultTTL.users;
    if (path.includes('/sections')) return this.defaultTTL.sections;
    if (path.includes('/subjects')) return this.defaultTTL.subjects;
    if (path.includes('/rooms')) return this.defaultTTL.rooms;
    if (path.includes('/schedules')) return this.defaultTTL.schedules;
    if (path.includes('/grades')) return this.defaultTTL.grades;
    if (path.includes('/students')) return this.defaultTTL.students;
    if (path.includes('/notifications')) return this.defaultTTL.notifications;
    
    return this.defaultTTL.default;
  }

  /**
   * Get cached response
   */
  get(key) {
    const expiry = this.ttl.get(key);
    
    if (!expiry || Date.now() > expiry) {
      // Entry expired or doesn't exist
      this.cache.delete(key);
      this.ttl.delete(key);
      return null;
    }
    
    return this.cache.get(key);
  }

  /**
   * Set cached response
   */
  set(key, value, customTTL = null) {
    const ttl = customTTL || this.defaultTTL.default;
    const expiry = Date.now() + ttl;
    
    this.cache.set(key, value);
    this.ttl.set(key, expiry);
  }

  /**
   * Clear cache entries matching pattern
   */
  invalidate(pattern) {
    const regex = new RegExp(pattern);
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        this.ttl.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
    this.ttl.clear();
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    
    for (const [key, expiry] of this.ttl.entries()) {
      if (now > expiry) {
        this.cache.delete(key);
        this.ttl.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Create global cache instance
const cache = new SimpleCache();

/**
 * Cache middleware function
 */
export function createCacheMiddleware() {
  return {
    // Check if response is cached
    get: (request, userId = null) => {
      const key = cache.generateKey(request.url, request.method, userId);
      return cache.get(key);
    },
    
    // Cache the response
    set: (request, responseData, userId = null) => {
      const key = cache.generateKey(request.url, request.method, userId);
      const url = new URL(request.url, 'http://localhost');
      const ttl = cache.getTTL(url.pathname);
      
      // Only cache successful GET requests
      if (request.method === 'GET' && responseData.status === 200) {
        cache.set(key, responseData, ttl);
      }
    },
    
    // Invalidate cache patterns
    invalidate: (pattern) => {
      cache.invalidate(pattern);
    },
    
    // Clear all cache
    clear: () => {
      cache.clear();
    },
    
    // Get cache stats
    getStats: () => {
      return cache.getStats();
    }
  };
}

export default cache;