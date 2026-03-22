"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRedisCache = createRedisCache;
exports.createNoopCache = createNoopCache;
exports.getCacheKey = getCacheKey;
function createRedisCache(redis) {
    return {
        async get(key) {
            const raw = await redis.get(key);
            if (raw == null)
                return null;
            try {
                return JSON.parse(raw);
            }
            catch {
                return null;
            }
        },
        async set(key, value, ttlSeconds = 86400) {
            await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
        },
        async invalidate(key) {
            await redis.del(key);
        },
    };
}
function createNoopCache() {
    return {
        async get(_key) {
            return null;
        },
        async set(_key, _value, _ttl) { },
        async invalidate(_key) { },
    };
}
function getCacheKey(itemName, dosage, itemType) {
    const key = `${itemType}:price:${itemName.toLowerCase().trim()}${dosage ? `:${dosage}` : ''}`;
    return `pricing:${key.replace(/\s+/g, '_')}`;
}
//# sourceMappingURL=cache.js.map