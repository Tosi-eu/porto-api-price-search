import { Inject, Injectable } from '@nestjs/common';
import { getCacheKey, type PriceCache } from '../lib/cache';
import type { PriceSearchResult } from '../types';
import { PRICE_CACHE } from '../lib/injection-tokens';

@Injectable()
export class PriceSearchRepository {
  constructor(@Inject(PRICE_CACHE) private readonly cache: PriceCache) {}

  async getByItem(
    itemName: string,
    itemType: 'medicine' | 'input',
    dosage?: string,
  ): Promise<PriceSearchResult | null> {
    const key = getCacheKey(itemName, dosage, itemType);
    return this.cache.get<PriceSearchResult>(key);
  }

  async save(
    itemName: string,
    itemType: 'medicine' | 'input',
    dosage: string | undefined,
    result: PriceSearchResult,
    ttlSeconds: number,
  ): Promise<void> {
    const key = getCacheKey(itemName, dosage, itemType);
    await this.cache.set(key, result, ttlSeconds);
  }

  async invalidate(
    itemName: string,
    dosage: string | undefined,
    itemType: 'medicine' | 'input',
  ): Promise<void> {
    const key = getCacheKey(itemName, dosage, itemType);
    await this.cache.invalidate(key);
  }
}
