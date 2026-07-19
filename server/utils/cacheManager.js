/**
 * Cache Manager
 * Centralized caching for AI requests, analytics, and expensive operations
 * 
 * @module utils/cacheManager
 */

/**
 * In-memory cache store
 * In production, consider using Redis for distributed caching
 */
const cache = new Map();

/**
 * Cache configuration
 */
const CACHE_CONFIG = {
  // AI request caching (1 hour)
  AI_REWRITE: { ttl: 60 * 60 * 1000, maxSize: 500 },
  AI_STAR: { ttl: 60 * 60 * 1000, maxSize: 500 },
  AI_INTERVIEW: { ttl: 60 * 60 * 1000, maxSize: 500 },
  AI_PROJECTS: { ttl: 60 * 60 * 1000, maxSize: 500 },
  AI_ROADMAP: { ttl: 60 * 60 * 1000, maxSize: 500 },
  AI_ANALYSIS: { ttl: 30 * 60 * 1000, maxSize: 1000 },
  
  // Analytics caching (5 minutes for real-time feel, but reduces DB load)
  ANALYTICS_DASHBOARD: { ttl: 5 * 60 * 1000, maxSize: 100 },
  ANALYTICS_CHARTS: { ttl: 5 * 60 * 1000, maxSize: 200 },
  ANALYTICS_STATS: { ttl: 5 * 60 * 1000, maxSize: 100 },
  
  // Resume data caching (10 minutes)
  RESUME_LIST: { ttl: 10 * 60 * 1000, maxSize: 1000 },
  RESUME_PARSED: { ttl: 10 * 60 * 1000, maxSize: 500 },
  
  // Job match caching (15 minutes)
  JOB_MATCH: { ttl: 15 * 60 * 1000, maxSize: 500 },
  
  // Search results (5 minutes)
  SEARCH_RESULTS: { ttl: 5 * 60 * 1000, maxSize: 200 },
};

/**
 * Generate cache key from parameters
 * @param {string} type - Cache type
 * @param {Object} params - Parameters to include in key
 * @returns {string} Cache key
 */
export const generateCacheKey = (type, params) => {
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}:${JSON.stringify(params[key])}`)
    .join('|');
  return `${type}:${sortedParams}`;
};

/**
 * Get cached value
 * @param {string} type - Cache type (must match CACHE_CONFIG key)
 * @param {Object} params - Parameters for cache key
 * @returns {*} Cached value or null
 */
export const get = (type, params) => {
  const key = generateCacheKey(type, params);
  const cached = cache.get(key);
  
  if (!cached) {
    return null;
  }
  
  // Check if expired
  const now = Date.now();
  if (now > cached.expiresAt) {
    cache.delete(key);
    return null;
  }
  
  // Update access time for LRU
  cached.lastAccessed = now;
  cached.hits = (cached.hits || 0) + 1;
  
  return cached.value;
};

/**
 * Set cached value
 * @param {string} type - Cache type (must match CACHE_CONFIG key)
 * @param {Object} params - Parameters for cache key
 * @param {*} value - Value to cache
 * @returns {void}
 */
export const set = (type, params, value) => {
  const config = CACHE_CONFIG[type];
  if (!config) {
    console.warn(`[Cache] Unknown cache type: ${type}`);
    return;
  }
  
  const key = generateCacheKey(type, params);
  const now = Date.now();
  
  // Check cache size and evict if necessary
  if (cache.size >= config.maxSize) {
    evictLRU(type, config.maxSize);
  }
  
  cache.set(key, {
    value,
    type,
    createdAt: now,
    expiresAt: now + config.ttl,
    lastAccessed: now,
    hits: 0,
  });
};

/**
 * Invalidate cached value
 * @param {string} type - Cache type
 * @param {Object} params - Parameters for cache key
 * @returns {boolean} True if value was deleted
 */
export const invalidate = (type, params) => {
  const key = generateCacheKey(type, params);
  return cache.delete(key);
};

/**
 * Invalidate all cache entries of a specific type
 * @param {string} type - Cache type
 * @returns {number} Number of entries deleted
 */
export const invalidateType = (type) => {
  let deleted = 0;
  for (const [key, entry] of cache.entries()) {
    if (entry.type === type) {
      cache.delete(key);
      deleted++;
    }
  }
  return deleted;
};

/**
 * Invalidate cache entries matching a pattern
 * @param {string} pattern - Pattern to match (e.g., userId:123)
 * @returns {number} Number of entries deleted
 */
export const invalidatePattern = (pattern) => {
  let deleted = 0;
  for (const [key] of cache.entries()) {
    if (key.includes(pattern)) {
      cache.delete(key);
      deleted++;
    }
  }
  return deleted;
};

/**
 * Clear all cache
 * @returns {void}
 */
export const clear = () => {
  cache.clear();
};

/**
 * Evict least recently used entries
 * @param {string} type - Cache type
 * @param {number} maxSize - Maximum cache size
 * @returns {void}
 */
const evictLRU = (type, maxSize) => {
  const typeEntries = Array.from(cache.entries())
    .filter(([, entry]) => entry.type === type)
    .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
  
  // Remove oldest 20% when cache is full
  const toRemove = Math.ceil(maxSize * 0.2);
  for (let i = 0; i < toRemove && i < typeEntries.length; i++) {
    cache.delete(typeEntries[i][0]);
  }
};

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
export const getStats = () => {
  const stats = {
    totalEntries: cache.size,
    types: {},
    memoryEstimate: 0,
  };
  
  for (const [key, entry] of cache.entries()) {
    if (!stats.types[entry.type]) {
      stats.types[entry.type] = {
        count: 0,
        hits: 0,
        avgAge: 0,
      };
    }
    
    stats.types[entry.type].count++;
    stats.types[entry.type].hits += entry.hits || 0;
    
    // Estimate memory usage (rough estimate)
    stats.memoryEstimate += key.length + JSON.stringify(entry.value).length;
  }
  
  // Calculate average ages
  const now = Date.now();
  for (const [, entry] of cache.entries()) {
    const age = now - entry.createdAt;
    stats.types[entry.type].avgAge += age;
  }
  
  for (const type in stats.types) {
    stats.types[type].avgAge = Math.floor(
      stats.types[type].avgAge / stats.types[type].count / 1000
    ); // Convert to seconds
  }
  
  stats.memoryEstimate = Math.ceil(stats.memoryEstimate / 1024); // Convert to KB
  
  return stats;
};

/**
 * Cleanup expired entries (should be called periodically)
 * @returns {number} Number of entries removed
 */
export const cleanup = () => {
  const now = Date.now();
  let removed = 0;
  
  for (const [key, entry] of cache.entries()) {
    if (now > entry.expiresAt) {
      cache.delete(key);
      removed++;
    }
  }
  
  return removed;
};

/**
 * Middleware to cache AI responses
 * @param {string} type - Cache type
 * @returns {Function} Middleware function
 */
export const cacheMiddleware = (type) => {
  return async (req, res, next) => {
    // Generate cache key from request
    const params = {
      userId: req.user?._id?.toString(),
      ...req.body,
      ...req.query,
    };
    
    const cached = get(type, params);
    if (cached) {
      return res.status(200).json({
        success: true,
        data: cached,
        cached: true,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Store original json method
    const originalJson = res.json.bind(res);
    
    // Override json method to cache response
    res.json = (data) => {
      if (data.success && data.data) {
        set(type, params, data.data);
      }
      return originalJson(data);
    };
    
    next();
  };
};

/**
 * Wrap async function with caching
 * @param {string} type - Cache type
 * @param {Function} fn - Function to wrap
 * @param {Function} keyExtractor - Extract cache key params from args
 * @returns {Function} Wrapped function
 */
export const withCache = (type, fn, keyExtractor) => {
  return async (...args) => {
    const params = keyExtractor(...args);
    
    // Try to get from cache
    const cached = get(type, params);
    if (cached) {
      return cached;
    }
    
    // Execute function
    const result = await fn(...args);
    
    // Cache result
    set(type, params, result);
    
    return result;
  };
};

// Start periodic cleanup (every 5 minutes)
setInterval(() => {
  const removed = cleanup();
  if (removed > 0) {
    console.log(`[Cache] Cleanup removed ${removed} expired entries`);
  }
}, 5 * 60 * 1000);

export default {
  get,
  set,
  invalidate,
  invalidateType,
  invalidatePattern,
  clear,
  getStats,
  cleanup,
  cacheMiddleware,
  withCache,
  generateCacheKey,
};
