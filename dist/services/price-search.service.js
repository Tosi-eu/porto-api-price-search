"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceSearchService = void 0;
const logger_1 = require("../logger");
const cache_1 = require("../lib/cache");
class PriceSearchService {
    cache;
    strategies;
    aggregator;
    outlierFilter;
    constructor(cache, strategies, aggregator, outlierFilter) {
        this.cache = cache;
        this.strategies = strategies;
        this.aggregator = aggregator;
        this.outlierFilter = outlierFilter;
    }
    async searchPrice(itemName, itemType, dosage, measurementUnit) {
        const cacheKey = (0, cache_1.getCacheKey)(itemName, dosage, itemType);
        const cached = await this.cache.get(cacheKey);
        if (cached && cached.averagePrice !== null) {
            logger_1.logger.info('Busca de preço (cache hit)', {
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
        const supportedStrategies = this.strategies.filter(strategy => strategy.supports(itemType));
        if (supportedStrategies.length === 0) {
            logger_1.logger.warn('Nenhuma strategy suporta o tipo informado', {
                operation: 'price_search',
                itemType,
            });
            return null;
        }
        logger_1.logger.debug('Strategies selecionadas', {
            operation: 'price_search',
            itemType,
            strategies: supportedStrategies.map(s => s.sourceName),
        });
        const results = new Map();
        await Promise.allSettled(supportedStrategies.map(async (strategy) => {
            try {
                logger_1.logger.debug('Iniciando strategy', {
                    source: strategy.sourceName,
                });
                const prices = await strategy.fetchPrices({
                    itemName,
                    dosage,
                    measurementUnit,
                });
                logger_1.logger.debug('Strategy finalizada', {
                    source: strategy.sourceName,
                    pricesFound: prices.length,
                });
                if (prices.length > 0) {
                    results.set(strategy.sourceName, prices);
                }
                await new Promise(r => setTimeout(r, 800));
            }
            catch (error) {
                logger_1.logger.error('Erro na strategy', {
                    operation: 'price_search',
                    source: strategy.sourceName,
                    error: error.message,
                });
            }
        }));
        if (results.size === 0) {
            logger_1.logger.info('Nenhum preço encontrado em nenhuma fonte', {
                operation: 'price_search',
                itemType,
                itemName,
            });
            return null;
        }
        const aggregatedPrices = this.aggregator.aggregate(results);
        if (aggregatedPrices.length === 0)
            return null;
        const filteredPrices = this.outlierFilter.remove(aggregatedPrices);
        if (filteredPrices.length === 0)
            return null;
        const averagePrice = filteredPrices.reduce((sum, price) => sum + price, 0) /
            filteredPrices.length;
        const response = {
            averagePrice: Math.round(averagePrice * 100) / 100,
            source: Array.from(results.keys()).join(','),
            lastUpdated: new Date(),
        };
        await this.cache.set(cacheKey, response, 60 * 60 * 24);
        logger_1.logger.info('Busca de preço concluída', {
            operation: 'price_search',
            itemName,
            itemType,
            precoMedio: response.averagePrice,
            fontes: response.source,
        });
        return response;
    }
    async invalidatePriceCache(itemName, dosage, itemType = 'medicine') {
        const cacheKey = (0, cache_1.getCacheKey)(itemName, dosage, itemType);
        await this.cache.invalidate(cacheKey);
    }
}
exports.PriceSearchService = PriceSearchService;
//# sourceMappingURL=price-search.service.js.map