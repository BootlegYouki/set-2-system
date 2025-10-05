/**
 * General API Protection Middleware
 * Provides comprehensive protection for all API endpoints including
 * rate limiting, request validation, and security headers
 */

import { json } from '@sveltejs/kit';
import { createRateLimitMiddleware } from './rateLimiter.js';

// Create general rate limiter instance
const generalRateLimit = createRateLimitMiddleware();

/**
 * Request size limits (in bytes)
 */
const REQUEST_SIZE_LIMITS = {
  default: 1024 * 1024, // 1MB default
  auth: 1024, // 1KB for auth requests
  upload: 10 * 1024 * 1024, // 10MB for file uploads
  bulk: 5 * 1024 * 1024 // 5MB for bulk operations
};

/**
 * Validate request size
 */
function validateRequestSize(request, maxSize = REQUEST_SIZE_LIMITS.default) {
  const contentLength = request.headers.get('content-length');
  
  if (contentLength && parseInt(contentLength) > maxSize) {
    return {
      valid: false,
      error: 'Request payload too large',
      status: 413
    };
  }
  
  return { valid: true };
}

/**
 * Validate request headers for security
 */
function validateRequestHeaders(request) {
  const userAgent = request.headers.get('user-agent');
  const contentType = request.headers.get('content-type');
  
  // Block requests without user agent (likely bots)
  if (!userAgent || userAgent.length < 10) {
    return {
      valid: false,
      error: 'Invalid user agent',
      status: 400
    };
  }
  
  // Check for suspicious user agents
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
    /go-http/i
  ];
  
  // Allow legitimate bots but block obvious attack tools
  const maliciousPatterns = [
    /sqlmap/i,
    /nikto/i,
    /nmap/i,
    /masscan/i,
    /zap/i,
    /burp/i
  ];
  
  for (const pattern of maliciousPatterns) {
    if (pattern.test(userAgent)) {
      return {
        valid: false,
        error: 'Blocked user agent',
        status: 403
      };
    }
  }
  
  // For POST/PUT requests, validate content type
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    if (!contentType) {
      return {
        valid: false,
        error: 'Content-Type header required',
        status: 400
      };
    }
    
    // Only allow specific content types
    const allowedContentTypes = [
      'application/json',
      'application/x-www-form-urlencoded',
      'multipart/form-data',
      'text/plain'
    ];
    
    const isAllowed = allowedContentTypes.some(type => 
      contentType.toLowerCase().includes(type)
    );
    
    if (!isAllowed) {
      return {
        valid: false,
        error: 'Unsupported content type',
        status: 415
      };
    }
  }
  
  return { valid: true };
}

/**
 * Validate request method
 */
function validateRequestMethod(request, allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']) {
  if (!allowedMethods.includes(request.method)) {
    return {
      valid: false,
      error: 'Method not allowed',
      status: 405
    };
  }
  
  return { valid: true };
}

/**
 * Add security headers to response
 */
function getSecurityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'",
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };
}

/**
 * Main API protection middleware
 */
export async function protectAPI(request, getClientAddress, options = {}) {
  const {
    maxRequestSize = REQUEST_SIZE_LIMITS.default,
    allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    skipRateLimit = false,
    skipValidation = false
  } = options;
  
  try {
    // 1. Validate request method
    if (!skipValidation) {
      const methodValidation = validateRequestMethod(request, allowedMethods);
      if (!methodValidation.valid) {
        return json(
          { error: methodValidation.error },
          { 
            status: methodValidation.status,
            headers: getSecurityHeaders()
          }
        );
      }
    }
    
    // 2. Validate request headers
    if (!skipValidation) {
      const headerValidation = validateRequestHeaders(request);
      if (!headerValidation.valid) {
        return json(
          { error: headerValidation.error },
          { 
            status: headerValidation.status,
            headers: getSecurityHeaders()
          }
        );
      }
    }
    
    // 3. Validate request size
    if (!skipValidation) {
      const sizeValidation = validateRequestSize(request, maxRequestSize);
      if (!sizeValidation.valid) {
        return json(
          { error: sizeValidation.error },
          { 
            status: sizeValidation.status,
            headers: getSecurityHeaders()
          }
        );
      }
    }
    
    // 4. Apply rate limiting
    if (!skipRateLimit) {
      const rateLimitResult = await generalRateLimit(request, getClientAddress);
      
      if (rateLimitResult.blocked) {
        return json(
          rateLimitResult.body,
          { 
            status: rateLimitResult.status,
            headers: {
              ...getSecurityHeaders(),
              ...rateLimitResult.headers
            }
          }
        );
      }
      
      // Return success with rate limit headers
      return {
        success: true,
        headers: {
          ...getSecurityHeaders(),
          ...rateLimitResult.headers
        }
      };
    }
    
    // Return success with security headers only
    return {
      success: true,
      headers: getSecurityHeaders()
    };
    
  } catch (error) {
    console.error('API protection middleware error:', error);
    
    return json(
      { error: 'Internal server error' },
      { 
        status: 500,
        headers: getSecurityHeaders()
      }
    );
  }
}

/**
 * Create a protection middleware for specific endpoint types
 */
export function createEndpointProtection(endpointType) {
  const configs = {
    auth: {
      maxRequestSize: REQUEST_SIZE_LIMITS.auth,
      allowedMethods: ['POST']
    },
    upload: {
      maxRequestSize: REQUEST_SIZE_LIMITS.upload,
      allowedMethods: ['POST', 'PUT']
    },
    bulk: {
      maxRequestSize: REQUEST_SIZE_LIMITS.bulk,
      allowedMethods: ['POST', 'PUT']
    },
    readonly: {
      allowedMethods: ['GET']
    }
  };
  
  const config = configs[endpointType] || {};
  
  return async function(request, getClientAddress) {
    return await protectAPI(request, getClientAddress, config);
  };
}

/**
 * Utility function to add protection to any API handler
 */
export function withAPIProtection(handler, options = {}) {
  return async function(event) {
    const { request, getClientAddress } = event;
    
    // Apply protection
    const protectionResult = await protectAPI(request, getClientAddress, options);
    
    // If protection failed, return the error response
    if (protectionResult.status) {
      return protectionResult;
    }
    
    // If protection succeeded, call the original handler
    try {
      const response = await handler(event);
      
      // Add security headers to the response
      if (response && typeof response.headers === 'object') {
        Object.assign(response.headers, protectionResult.headers);
      } else if (response && response.headers && response.headers.set) {
        // For Response objects
        Object.entries(protectionResult.headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      }
      
      return response;
    } catch (error) {
      console.error('Handler error:', error);
      
      return json(
        { error: 'Internal server error' },
        { 
          status: 500,
          headers: protectionResult.headers
        }
      );
    }
  };
}

export default protectAPI;