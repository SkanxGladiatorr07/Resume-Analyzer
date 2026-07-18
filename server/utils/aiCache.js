/**
 * AI Response Cache
 * Reduces unnecessary API calls by caching identical requests
 * 
 * In production, replace Map with Redis for distributed caching
 */

import crypto from 'crypto';

/**
 * In-memory cache store
 * Key: hash of request parameters
 * Value: { response, timestamp, metadata }
 */
const cache = new Map();

/**
 * Cache configuration
 */
const CACHE_CONFIG = {
  // Cache duration in milliseconds
  ttl: {
    rewrite: 3600000, // 1 hour
    star: 3600000, // 1 hour
    interview: 7200000, // 2 hours
    projects: 14400000, // 4 hours
    roadmap: 14400000, // 4 hours
  },
  // Maximum cache size (entries)
  maxSize: 1000,
  // Enable/disable caching per feature
  enabled: {
    rewrite: true,
    star: true,
    interview: true,
    projects: true,
    roadmap: true,
  },
};

/**
 * Generate cache key from request parameters
 * @param {string} feature - Feature name (rewrite, star, interview, projects, roadmap)
 * @param {Object} params - Request parameters
 * @returns {string} Cache key hash
 */
export const generateCacheKey = (feature, params) => {
  // Sort keys for consistent hashing
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {});

  const dataString = `${feature}:${JSON.stringify(sortedParams)}`;

  return crypto.createHash('sha256').update(dataString).digest('hex');
};

/**
 * Get cached response
 * @param {string} feature - Feature name
 * @param {Object} params - Request parameters
 * @returns {Object|null} Cached response or null
 */
export const getCachedResponse = (feature, params) => {
  if (!CACHE_CONFIG.enabled[feature]) {
    return null;
  }

  const key = generateCacheKey(feature, params);
  const cached = cache.get(key);

  if (!cached) {
    return null;
  }

  // Check if expired
  const ttl = CACHE_CONFIG.ttl[feature] || 3600000;
  const age = Date.now() - cached.timestamp;

  if (age > ttl) {
    cache.delete(key);
    return null;
  }

  console.log(`[Cache] ✅ Hit for ${feature} (age: ${Math.floor(age / 1000)}s)`);

  return {
    ...cached.response,
    fromCache: true,
    cacheAge: age,
  };
};

/**
 * Cache response
 * @param {string} feature - Feature name
 * @param {Object} params - Request parameters
 * @param {Object} response - Response to cache
 * @param {Object} metadata - Additional metadata
 */
export const cacheResponse = (feature, params, response, metadata = {}) => {
  if (!CACHE_CONFIG.enabled[feature]) {
    return;
  }

  // Check cache size limit
  if (cache.size >= CACHE_CONFIG.maxSize) {
    // Remove oldest entry
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
    console.log(`[Cache] ⚠️  Size limit reached, removed oldest entry`);
  }

  const key = generateCacheKey(feature, params);

  cache.set(key, {
    response,
    timestamp: Date.now(),
    metadata,
  });

  console.log(`[Cache] 💾 Stored for ${feature} (total: ${cache.size})`);
};

/**
 * Invalidate cache for a feature
 * @param {string} feature - Feature name (optional, invalidates all if not provided)
 */
export const invalidateCache = (feature = null) => {
  if (feature) {
    let count = 0;
    for (const [key, value] of cache.entries()) {
      if (key.startsWith(feature)) {
        cache.delete(key);
        count++;
      }
    }
    console.log(`[Cache] 🗑️  Invalidated ${count} entries for ${feature}`);
  } else {
    cache.clear();
    console.log(`[Cache] 🗑️  Cleared all cache`);
  }
};

/**
 * Cleanup expired entries
 */
export const cleanupExpiredCache = () => {
  let count = 0;
  const now = Date.now();

  for (const [key, value] of cache.entries()) {
    // Extract feature from key (format: feature:hash)
    const feature = key.split(':')[0];
    const ttl = CACHE_CONFIG.ttl[feature] || 3600000;
    const age = now - value.timestamp;

    if (age > ttl) {
      cache.delete(key);
      count++;
    }
  }

  if (count > 0) {
    console.log(`[Cache] 🧹 Cleaned up ${count} expired entries`);
  }
};

/**
 * Get cache statistics
 * @returns {Object} Cache stats
 */
export const getCacheStats = () => {
  const stats = {
    totalEntries: cache.size,
    byFeature: {},
    oldestEntry: null,
    newestEntry: null,
  };

  let oldest = Infinity;
  let newest = 0;

  for (const [key, value] of cache.entries()) {
    const feature = key.split(':')[0];
    if (!stats.byFeature[feature]) {
      stats.byFeature[feature] = 0;
    }
    stats.byFeature[feature]++;

    if (value.timestamp < oldest) {
      oldest = value.timestamp;
    }
    if (value.timestamp > newest) {
      newest = value.timestamp;
    }
  }

  if (oldest !== Infinity) {
    stats.oldestEntry = new Date(oldest).toISOString();
  }
  if (newest !== 0) {
    stats.newestEntry = new Date(newest).toISOString();
  }

  return stats;
};

/**
 * Enable/disable caching for a feature
 * @param {string} feature - Feature name
 * @param {boolean} enabled - Enable or disable
 */
export const setCacheEnabled = (feature, enabled) => {
  if (CACHE_CONFIG.enabled.hasOwnProperty(feature)) {
    CACHE_CONFIG.enabled[feature] = enabled;
    console.log(`[Cache] ${enabled ? '✅ Enabled' : '❌ Disabled'} for ${feature}`);
  }
};

// Schedule cleanup every 10 minutes
setInterval(cleanupExpiredCache, 10 * 60 * 1000);

export default {
  generateCacheKey,
  getCachedResponse,
  cacheResponse,
  invalidateCache,
  cleanupExpiredCache,
  getCacheStats,
  setCacheEnabled,
};
