const NodeCache = require('node-cache');

// Create a cache instance with 5 minute TTL
const cache = new NodeCache({ stdTTL: 300, checkperiod: 120 });

const cacheMiddleware = (duration = 300) => {
    return (req, res, next) => {
        const key = req.originalUrl || req.url;
        const cachedResponse = cache.get(key);
        
        if (cachedResponse) {
            console.log(`Cache HIT for ${key}`);
            return res.json(cachedResponse);
        }
        
        console.log(`Cache MISS for ${key}`);
        
        // Override res.json to cache the response
        const originalJson = res.json;
        res.json = function(data) {
            cache.set(key, data, duration);
            return originalJson.call(this, data);
        };
        
        next();
    };
};

// Clear cache utility
const clearCache = (pattern) => {
    const keys = cache.keys();
    if (pattern) {
        const regex = new RegExp(pattern);
        const matchingKeys = keys.filter(key => regex.test(key));
        matchingKeys.forEach(key => cache.del(key));
        console.log(`Cleared cache for pattern: ${pattern}`);
    } else {
        cache.flushAll();
        console.log('Cleared all cache');
    }
};

// Get cache stats
const getCacheStats = () => {
    return cache.getStats();
};

module.exports = {
    cacheMiddleware,
    clearCache,
    getCacheStats
};
