import { logger } from '../logger';
import type { PriceCache } from '../lib/cache';
import { getCacheKey } from '../lib/cache';
import { OutlierFilter, PriceAggregator } from '../lib/aggregator';
import type { PriceSearchResult, PriceSourceStrategy } from '../types';

export class PriceSearchService {
  constructor(
    private readonly cache: PriceCache,
    private readonly strategies: PriceSourceStrategy[],
    private readonly aggregator: PriceAggregator,
    private readonly outlierFilter: OutlierFilter,
  ) {}

  async searchPrice(
    itemName: string,
    itemType: 'medicine' | 'input',
    dosage?: string,
    measurementUnit?: string,
  ): Promise<PriceSearchResult | null> {
    const cacheKey = getCacheKey(itemName, dosage, itemType);

    const cached = await this.cache.get<PriceSearchResult>(cacheKey);
    if (cached && cached.averagePrice !== null) {
      logger.info('Busca de preço (cache hit)', {
        operation: 'price_search',
        itemName,
        itemType,
        precoMedio: cached.averagePrice,
        source: cached.source,
      });
      return {
        ...cached,
        lastUpdated: new Date(cached.lastUpdated),
      };
    }

    const supportedStrategies = this.strategies.filter(strategy =>
      strategy.supports(itemType),
    );

    if (supportedStrategies.length === 0) {
      logger.warn('Nenhuma strategy suporta o tipo informado', {
        operation: 'price_search',
        itemType,
      });
      return null;
    }

    logger.debug('Strategies selecionadas', {
      operation: 'price_search',
      itemType,
      strategies: supportedStrategies.map(s => s.sourceName),
    });

    const results = new Map<string, number[]>();

    await Promise.allSettled(
      supportedStrategies.map(async strategy => {
        try {
          logger.debug('Iniciando strategy', {
            source: strategy.sourceName,
          });

          const prices = await strategy.fetchPrices({
            itemName,
            dosage,
            measurementUnit,
          });

          logger.debug('Strategy finalizada', {
            source: strategy.sourceName,
            pricesFound: prices.length,
          });

          if (prices.length > 0) {
            results.set(strategy.sourceName, prices);
          }

          await new Promise(r => setTimeout(r, 800));
        } catch (error) {
          logger.error('Erro na strategy', {
            operation: 'price_search',
            source: strategy.sourceName,
            error: (error as Error).message,
          });
        }
      }),
    );

    if (results.size === 0) {
      logger.info('Nenhum preço encontrado em nenhuma fonte', {
        operation: 'price_search',
        itemType,
        itemName,
      });
      return null;
    }

    const aggregatedPrices = this.aggregator.aggregate(results);
    if (aggregatedPrices.length === 0) return null;

    const filteredPrices = this.outlierFilter.remove(aggregatedPrices);
    if (filteredPrices.length === 0) return null;

    const averagePrice =
      filteredPrices.reduce((sum, price) => sum + price, 0) /
      filteredPrices.length;

    const response: PriceSearchResult = {
      averagePrice: Math.round(averagePrice * 100) / 100,
      source: Array.from(results.keys()).join(','),
      lastUpdated: new Date(),
    };

    await this.cache.set(cacheKey, response, 60 * 60 * 24);

    logger.info('Busca de preço concluída', {
      operation: 'price_search',
      itemName,
      itemType,
      precoMedio: response.averagePrice,
      fontes: response.source,
    });

    return response;
  }

  async invalidatePriceCache(
    itemName: string,
    dosage: string | undefined,
    itemType: 'medicine' | 'input' = 'medicine',
  ): Promise<void> {
    const cacheKey = getCacheKey(itemName, dosage, itemType);
    await this.cache.invalidate(cacheKey);
  }
}
