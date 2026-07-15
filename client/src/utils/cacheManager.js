/**
 * Cache Manager Utility
 * Simple in-memory cache for API responses with TTL support
 * 
 * @module cacheManager
 */

/**
 * Cache store
 * @private
 */
const cache = new Map();

/**
 * Cache configuration
 * @typedef {Object} CacheConfig
 * @property {number} ttl - Time to live in milliseconds
 * @property {string} key - Cache key
 */

/**
 * Default TTL values (in milliseconds)
 * @enum {number}
 */
export const CacheTTL = {
  SHORT: 1 * 60 * 1000, // 1 minute
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  LONG: 15 * 60 * 1000, // 15 minutes
  HOUR: 60 * 60 * 1000, // 1 hour
};

/**
 * Cache entry structure
 * @typedef {Object} CacheEntry
 * @property {*} data - Cached data
 * @property {number} timestamp - Cache creation timestamp
 * @property {number} ttl - Time to live in milliseconds
 */

/**
 * Set cache entry
 * 
 * @param {string} key - Cache key
 * @param {*} data - Data to cache
 * @param {number} [ttl=CacheTTL.MEDIUM] - Time to live in milliseconds
 * @returns {void}
 * 
 * @example
 * setCache('dashboard-overview', data, CacheTTL.LONG);
 */
export const setCache = (key, data, ttl = CacheTTL.MEDIUM) => {
  const entry = {
    data,
    timestamp: Date.now(),
    ttl,
  };
  cache.set(key, entry);
};

/**
 * Get cache entry
 * 
 * @param {string} key - Cache key
 * @returns {*|null} Cached data or null if expired/not found
 * 
 * @example
 * const data = getCache('dashboard-overview');
 * if (data) {
 *   // Use cached data
 * }
 */
export const getCache = (key) => {
  const entry = cache.get(key);

  if (!entry) {
    return null;
  }

  // Check if cache is expired
  const isExpired = Date.now() - entry.timestamp > entry.ttl;

  if (isExpired) {
    cache.delete(key);
    return null;
  }

  return entry.data;
};

/**
 * Check if cache entry exists and is valid
 * 
 * @param {string} key - Cache key
 * @returns {boolean} True if cache exists and is valid
 * 
 * @example
 * if (hasCache('dashboard-overview')) {
 *   // Cache exists
 * }
 */
export const hasCache = (key) => {
  return getCache(key) !== null;
};

/**
 * Invalidate specific cache entry
 * 
 * @param {string} key - Cache key to invalidate
 * @returns {boolean} True if cache was deleted
 * 
 * @example
 * invalidateCache('dashboard-overview');
 */
export const invalidateCache = (key) => {
  return cache.delete(key);
};

/**
 * Invalidate all cache entries matching a pattern
 * 
 * @param {string} pattern - Pattern to match (supports wildcards with *)
 * @returns {number} Number of cache entries invalidated
 * 
 * @example
 * invalidateCachePattern('dashboard-*'); // Invalidates all dashboard caches
 */
export const invalidateCachePattern = (pattern) => {
  const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
  let count = 0;

  for (const key of cache.keys()) {
    if (regex.test(key)) {
      cache.delete(key);
      count++;
    }
  }

  return count;
};

/**
 * Clear all cache entries
 * 
 * @returns {void}
 * 
 * @example
 * clearCache(); // Clear everything
 */
export const clearCache = () => {
  cache.clear();
};

/**
 * Get cache statistics
 * 
 * @returns {Object} Cache statistics
 * @property {number} size - Number of cache entries
 * @property {number} validEntries - Number of valid (non-expired) entries
 * @property {number} expiredEntries - Number of expired entries
 * 
 * @example
 * const stats = getCacheStats();
 * console.log(`Cache has ${stats.validEntries} valid entries`);
 */
export const getCacheStats = () => {
  const now = Date.now();
  let validEntries = 0;
  let expiredEntries = 0;

  for (const entry of cache.values()) {
    const isExpired = now - entry.timestamp > entry.ttl;
    if (isExpired) {
      expiredEntries++;
    } else {
      validEntries++;
    }
  }

  return {
    size: cache.size,
    validEntries,
    expiredEntries,
  };
};

/**
 * Cleanup expired cache entries
 * 
 * @returns {number} Number of expired entries removed
 * 
 * @example
 * const removed = cleanupExpiredCache();
 * console.log(`Removed ${removed} expired entries`);
 */
export const cleanupExpiredCache = () => {
  const now = Date.now();
  let removed = 0;

  for (const [key, entry] of cache.entries()) {
    const isExpired = now - entry.timestamp > entry.ttl;
    if (isExpired) {
      cache.delete(key);
      removed++;
    }
  }

  return removed;
};

/**
 * Get or set cache with a factory function
 * 
 * @template T
 * @param {string} key - Cache key
 * @param {Function} factory - Factory function to generate data if cache miss
 * @param {number} [ttl=CacheTTL.MEDIUM] - Time to live in milliseconds
 * @returns {Promise<T>} Cached or newly generated data
 * 
 * @example
 * const data = await getOrSetCache(
 *   'dashboard-overview',
 *   () => api.get('/dashboard/overview'),
 *   CacheTTL.LONG
 * );
 */
export const getOrSetCache = async (key, factory, ttl = CacheTTL.MEDIUM) => {
  // Try to get from cache
  const cached = getCache(key);
  if (cached !== null) {
    return cached;
  }

  // Cache miss - generate data
  const data = await factory();
  setCache(key, data, ttl);
  return data;
};

/**
 * Create a memoized version of an async function with caching
 * 
 * @template T
 * @param {Function} fn - Async function to memoize
 * @param {Object} options - Memoization options
 * @param {Function} [options.keyGenerator] - Function to generate cache key from arguments
 * @param {number} [options.ttl=CacheTTL.MEDIUM] - Time to live in milliseconds
 * @returns {Function} Memoized function
 * 
 * @example
 * const fetchDashboard = memoize(
 *   async (userId) => api.get(`/dashboard/${userId}`),
 *   { ttl: CacheTTL.LONG }
 * );
 */
export const memoize = (fn, options = {}) => {
  const { keyGenerator = (...args) => JSON.stringify(args), ttl = CacheTTL.MEDIUM } = options;

  return async function (...args) {
    const key = `memoized:${fn.name}:${keyGenerator(...args)}`;
    return getOrSetCache(key, () => fn(...args), ttl);
  };
};

/**
 * Auto-cleanup expired cache entries every interval
 * 
 * @param {number} [interval=300000] - Cleanup interval in milliseconds (default: 5 minutes)
 * @returns {Function} Function to stop auto-cleanup
 * 
 * @example
 * const stopCleanup = startAutoCleanup(); // Start auto-cleanup
 * // Later...
 * stopCleanup(); // Stop auto-cleanup
 */
export const startAutoCleanup = (interval = 5 * 60 * 1000) => {
  const timer = setInterval(() => {
    const removed = cleanupExpiredCache();
    if (removed > 0 && process.env.NODE_ENV === 'development') {
      console.log(`[Cache] Auto-cleanup removed ${removed} expired entries`);
    }
  }, interval);

  return () => clearInterval(timer);
};

export default {
  setCache,
  getCache,
  hasCache,
  invalidateCache,
  invalidateCachePattern,
  clearCache,
  getCacheStats,
  cleanupExpiredCache,
  getOrSetCache,
  memoize,
  startAutoCleanup,
  CacheTTL,
};
