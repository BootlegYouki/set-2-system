/**
 * SvelteKit Server Hooks
 * Global middleware for DDoS protection and security
 */

import { protectAPI } from './lib/middleware/apiProtection.js';
import { json } from '@sveltejs/kit';

/**
 * Handle function - runs on every request
 */
export async function handle({ event, resolve }) {
  const { request, url } = event;
  const getClientAddress = () => event.getClientAddress();
  
  // Apply rate limiting only to login endpoints
  const loginEndpoints = ['/api/login'];
  const shouldApplyRateLimit = loginEndpoints.some(endpoint => url.pathname === endpoint);
  
  if (url.pathname.startsWith('/api/')) {
    // For login endpoints, apply full protection including rate limiting
    if (shouldApplyRateLimit) {
      const protectionResult = await protectAPI(request, getClientAddress);
      
      // If protection failed, return the error response immediately
      if (protectionResult.status) {
        return protectionResult;
      }
      
      // Store protection headers to add to the final response
      event.locals.securityHeaders = protectionResult.headers;
    } else {
      // For other API endpoints, apply protection but skip rate limiting
      const protectionResult = await protectAPI(request, getClientAddress, { skipRateLimit: true });
      
      // If protection failed, return the error response immediately
      if (protectionResult.status) {
        return protectionResult;
      }
      
      // Store protection headers to add to the final response
      event.locals.securityHeaders = protectionResult.headers;
    }
  }
  
  // Continue with the request
  const response = await resolve(event);
  
  // Add security headers to all responses
  if (event.locals.securityHeaders) {
    Object.entries(event.locals.securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }
  
  // Add general security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return response;
}

/**
 * HandleError function - runs when an error occurs
 */
export async function handleError({ error, event }) {
  const { url, getClientAddress } = event;
  
  console.error('Server error:', {
    error: error.message,
    stack: error.stack,
    url: url.pathname,
    ip: getClientAddress(),
    timestamp: new Date().toISOString()
  });
  
  // Don't expose internal errors to clients
  return {
    message: 'Internal server error',
    code: 'INTERNAL_ERROR'
  };
}

/**
 * HandleFetch function - runs on server-side fetch calls
 */
export async function handleFetch({ request, fetch }) {
  // Add any custom headers or modifications to server-side fetch calls
  return fetch(request);
}