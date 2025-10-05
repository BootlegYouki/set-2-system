/**
 * Rate Limiting Middleware for DDoS Protection
 * Implements multiple layers of protection including IP-based rate limiting,
 * progressive delays, and suspicious activity detection
 */

class RateLimiter {
  constructor() {
    // Store for tracking requests per IP
    this.requests = new Map();
    // Store for tracking failed login attempts
    this.failedAttempts = new Map();
    // Store for blocked IPs
    this.blockedIPs = new Map();
    // Store for suspicious activity tracking
    this.suspiciousActivity = new Map();
    
    // Configuration
    this.config = {
      // General API rate limiting
      general: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 100, // Max requests per window
        blockDuration: 30 * 60 * 1000 // 30 minutes block
      },
      // Login-specific rate limiting
      login: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxAttempts: 5, // Max login attempts per window
        blockDuration: 15 * 60 * 1000, // 15 minutes block
        progressiveDelay: true
      },
      // Suspicious activity thresholds
      suspicious: {
        rapidRequests: 50, // Requests in 1 minute
        multipleFailures: 10, // Failed attempts in 5 minutes
        blockDuration: 24 * 60 * 60 * 1000 // 24 hours block
      }
    };

    // Clean up old entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Get client IP address from request
   */
  getClientIP(request, getClientAddress) {
    // Try to get real IP from headers (for reverse proxy setups)
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const cfIP = request.headers.get('cf-connecting-ip');
    
    return cfIP || realIP || (forwarded && forwarded.split(',')[0]) || getClientAddress();
  }

  /**
   * Check if IP is currently blocked
   */
  isBlocked(ip) {
    const blockInfo = this.blockedIPs.get(ip);
    if (!blockInfo) return false;
    
    if (Date.now() > blockInfo.expiresAt) {
      this.blockedIPs.delete(ip);
      return false;
    }
    
    return true;
  }

  /**
   * Block an IP address
   */
  blockIP(ip, duration, reason = 'Rate limit exceeded') {
    const expiresAt = Date.now() + duration;
    this.blockedIPs.set(ip, {
      blockedAt: Date.now(),
      expiresAt,
      reason
    });
    
    console.warn(`IP ${ip} blocked for ${duration}ms. Reason: ${reason}`);
  }

  /**
   * Track suspicious activity
   */
  trackSuspiciousActivity(ip, type) {
    const now = Date.now();
    const key = `${ip}:${type}`;
    
    if (!this.suspiciousActivity.has(key)) {
      this.suspiciousActivity.set(key, []);
    }
    
    const activities = this.suspiciousActivity.get(key);
    activities.push(now);
    
    // Keep only recent activities (last 5 minutes)
    const fiveMinutesAgo = now - (5 * 60 * 1000);
    const recentActivities = activities.filter(time => time > fiveMinutesAgo);
    this.suspiciousActivity.set(key, recentActivities);
    
    // Check for suspicious patterns
    if (type === 'rapid_requests' && recentActivities.length > this.config.suspicious.rapidRequests) {
      this.blockIP(ip, this.config.suspicious.blockDuration, 'Suspicious rapid requests');
      return true;
    }
    
    if (type === 'failed_login' && recentActivities.length > this.config.suspicious.multipleFailures) {
      this.blockIP(ip, this.config.suspicious.blockDuration, 'Multiple failed login attempts');
      return true;
    }
    
    return false;
  }

  /**
   * General rate limiting for all API endpoints
   */
  checkGeneralRateLimit(ip) {
    const now = Date.now();
    const windowStart = now - this.config.general.windowMs;
    
    if (!this.requests.has(ip)) {
      this.requests.set(ip, []);
    }
    
    const ipRequests = this.requests.get(ip);
    
    // Remove old requests outside the window
    const recentRequests = ipRequests.filter(time => time > windowStart);
    this.requests.set(ip, recentRequests);
    
    // Check if limit exceeded
    if (recentRequests.length >= this.config.general.maxRequests) {
      this.blockIP(ip, this.config.general.blockDuration, 'General rate limit exceeded');
      return false;
    }
    
    // Add current request
    recentRequests.push(now);
    
    // Track rapid requests for suspicious activity
    const lastMinute = now - (60 * 1000);
    const rapidRequests = recentRequests.filter(time => time > lastMinute);
    if (rapidRequests.length > 20) {
      this.trackSuspiciousActivity(ip, 'rapid_requests');
    }
    
    return true;
  }

  /**
   * Login-specific rate limiting with progressive delays
   */
  checkLoginRateLimit(ip) {
    const now = Date.now();
    const windowStart = now - this.config.login.windowMs;
    
    if (!this.failedAttempts.has(ip)) {
      this.failedAttempts.set(ip, []);
    }
    
    const attempts = this.failedAttempts.get(ip);
    
    // Remove old attempts outside the window
    const recentAttempts = attempts.filter(time => time > windowStart);
    this.failedAttempts.set(ip, recentAttempts);
    
    // Check if limit exceeded
    if (recentAttempts.length >= this.config.login.maxAttempts) {
      this.blockIP(ip, this.config.login.blockDuration, 'Login rate limit exceeded');
      return false;
    }
    
    return true;
  }

  /**
   * Record a failed login attempt
   */
  recordFailedLogin(ip) {
    const now = Date.now();
    
    if (!this.failedAttempts.has(ip)) {
      this.failedAttempts.set(ip, []);
    }
    
    const attempts = this.failedAttempts.get(ip);
    attempts.push(now);
    
    // Track for suspicious activity
    this.trackSuspiciousActivity(ip, 'failed_login');
    
    // Calculate progressive delay based on recent failures
    if (this.config.login.progressiveDelay) {
      const recentFailures = attempts.filter(time => time > (now - this.config.login.windowMs));
      return Math.min(recentFailures.length * 1000, 10000); // Max 10 second delay
    }
    
    return 0;
  }

  /**
   * Clear failed attempts for successful login
   */
  clearFailedAttempts(ip) {
    this.failedAttempts.delete(ip);
  }

  /**
   * Get rate limit info for headers
   */
  getRateLimitInfo(ip, type = 'general') {
    const config = this.config[type];
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    let requests = [];
    if (type === 'login') {
      requests = this.failedAttempts.get(ip) || [];
    } else {
      requests = this.requests.get(ip) || [];
    }
    
    const recentRequests = requests.filter(time => time > windowStart);
    const remaining = Math.max(0, (config.maxRequests || config.maxAttempts) - recentRequests.length);
    const resetTime = Math.ceil((windowStart + config.windowMs) / 1000);
    
    return {
      limit: config.maxRequests || config.maxAttempts,
      remaining,
      reset: resetTime,
      retryAfter: remaining === 0 ? Math.ceil(config.windowMs / 1000) : null
    };
  }

  /**
   * Clean up old entries to prevent memory leaks
   */
  cleanup() {
    const now = Date.now();
    const oldestAllowed = now - (24 * 60 * 60 * 1000); // 24 hours
    
    // Clean up requests
    for (const [ip, requests] of this.requests.entries()) {
      const recentRequests = requests.filter(time => time > oldestAllowed);
      if (recentRequests.length === 0) {
        this.requests.delete(ip);
      } else {
        this.requests.set(ip, recentRequests);
      }
    }
    
    // Clean up failed attempts
    for (const [ip, attempts] of this.failedAttempts.entries()) {
      const recentAttempts = attempts.filter(time => time > oldestAllowed);
      if (recentAttempts.length === 0) {
        this.failedAttempts.delete(ip);
      } else {
        this.failedAttempts.set(ip, recentAttempts);
      }
    }
    
    // Clean up expired blocks
    for (const [ip, blockInfo] of this.blockedIPs.entries()) {
      if (now > blockInfo.expiresAt) {
        this.blockedIPs.delete(ip);
      }
    }
    
    // Clean up suspicious activity
    for (const [key, activities] of this.suspiciousActivity.entries()) {
      const recentActivities = activities.filter(time => time > oldestAllowed);
      if (recentActivities.length === 0) {
        this.suspiciousActivity.delete(key);
      } else {
        this.suspiciousActivity.set(key, recentActivities);
      }
    }
  }

  /**
   * Get statistics for monitoring
   */
  getStats() {
    return {
      totalTrackedIPs: this.requests.size,
      blockedIPs: this.blockedIPs.size,
      suspiciousActivities: this.suspiciousActivity.size,
      failedAttempts: this.failedAttempts.size
    };
  }
}

// Create singleton instance
export const rateLimiter = new RateLimiter();

/**
 * Middleware function for general API rate limiting
 */
export function createRateLimitMiddleware(options = {}) {
  return async function rateLimitMiddleware(request, getClientAddress) {
    const ip = rateLimiter.getClientIP(request, getClientAddress);
    
    // Check if IP is blocked
    if (rateLimiter.isBlocked(ip)) {
      const blockInfo = rateLimiter.blockedIPs.get(ip);
      const retryAfter = Math.ceil((blockInfo.expiresAt - Date.now()) / 1000);
      
      return {
        blocked: true,
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Blocked': 'true',
          'X-RateLimit-Reason': blockInfo.reason
        },
        body: {
          retryAfter,
          retryAfterSeconds: retryAfter,
          error: `Too many requests. Please wait ${retryAfter} seconds before trying again.`
        }
      };
    }
    
    // Check general rate limit
    if (!rateLimiter.checkGeneralRateLimit(ip)) {
      const rateLimitInfo = rateLimiter.getRateLimitInfo(ip, 'general');
      
      return {
        blocked: true,
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitInfo.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitInfo.reset.toString(),
          'Retry-After': rateLimitInfo.retryAfter.toString()
        },
        body: {
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: rateLimitInfo.retryAfter
        }
      };
    }
    
    // Add rate limit headers for successful requests
    const rateLimitInfo = rateLimiter.getRateLimitInfo(ip, 'general');
    
    return {
      blocked: false,
      headers: {
        'X-RateLimit-Limit': rateLimitInfo.limit.toString(),
        'X-RateLimit-Remaining': rateLimitInfo.remaining.toString(),
        'X-RateLimit-Reset': rateLimitInfo.reset.toString()
      }
    };
  };
}

/**
 * Middleware function specifically for login endpoints
 */
export function createLoginRateLimitMiddleware() {
  return async function loginRateLimitMiddleware(request, getClientAddress) {
    const ip = rateLimiter.getClientIP(request, getClientAddress);
    
    // Check if IP is blocked
    if (rateLimiter.isBlocked(ip)) {
      const blockInfo = rateLimiter.blockedIPs.get(ip);
      const retryAfter = Math.ceil((blockInfo.expiresAt - Date.now()) / 1000);
      
      return {
        blocked: true,
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Blocked': 'true',
          'X-RateLimit-Reason': blockInfo.reason
        },
        body: {
          error: 'Too many login attempts. IP temporarily blocked.',
          retryAfter
        }
      };
    }
    
    // Check login-specific rate limit
    if (!rateLimiter.checkLoginRateLimit(ip)) {
      const rateLimitInfo = rateLimiter.getRateLimitInfo(ip, 'login');
      
      return {
        blocked: true,
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitInfo.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitInfo.reset.toString(),
          'Retry-After': rateLimitInfo.retryAfter.toString()
        },
        body: {
          error: 'Too many login attempts. Please try again later.',
          retryAfter: rateLimitInfo.retryAfter
        }
      };
    }
    
    return {
      blocked: false,
      ip
    };
  };
}