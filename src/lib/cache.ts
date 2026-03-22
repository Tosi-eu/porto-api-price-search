import Redis from 'ioredis';

export interface PriceCache {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
  invalidate(key: string): Promise<void>;
}

export function createRedisCache(redis: Redis): PriceCache {
  return {
    async get<T>(key: string): Promise<T | null> {
      const raw = await redis.get(key);
      if (raw == null) return null;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return null;
      }
    },
    async set(key: string, value: unknown, ttlSeconds = 86400): Promise<void> {
      await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    },
    async invalidate(key: string): Promise<void> {
      await redis.del(key);
    },
  };
}

export function createNoopCache(): PriceCache {
  return {
    async get<T>(_key: string): Promise<T | null> {
      return null;
    },
    async set(_key: string, _value: unknown, _ttl?: number): Promise<void> {},
    async invalidate(_key: string): Promise<void> {},
  };
}

export function getCacheKey(
  itemName: string,
  dosage: string | undefined,
  itemType: 'medicine' | 'input',
): string {
  const key = `${itemType}:price:${itemName.toLowerCase().trim()}${
    dosage ? `:${dosage}` : ''
  }`;
  return `pricing:${key.replace(/\s+/g, '_')}`;
}
