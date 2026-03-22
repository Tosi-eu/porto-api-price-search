"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DrogaRaiaStrategy = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../logger");
const retry_1 = require("../lib/retry");
class DrogaRaiaStrategy {
    sourceName = 'droga_raia';
    supports(itemType) {
        return itemType === 'medicine';
    }
    async fetchPrices({ itemName, dosage, }) {
        try {
            const query = `${itemName} ${dosage ?? ''}`.trim();
            const url = `https://www.drogaraia.com.br/search?w=${encodeURIComponent(query)}&search-type=direct`;
            logger_1.logger.debug('Buscando preços na Droga Raia', {
                source: this.sourceName,
                url,
                query,
            });
            const response = await (0, retry_1.withRetry)(() => axios_1.default.get(url, {
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0',
                    Accept: 'text/html',
                    'Accept-Language': 'pt-BR,pt;q=0.9',
                },
                validateStatus: status => status >= 200 && status < 400,
            }), { maxRetries: 3, initialDelayMs: 500 });
            const nextData = this.extractNextData(response.data);
            if (!nextData || typeof nextData !== 'object') {
                logger_1.logger.warn('Next Data não encontrado na página', {
                    source: this.sourceName,
                });
                return [];
            }
            const data = nextData;
            const products = data?.props?.pageProps?.pageProps?.results?.products ?? [];
            return products
                .map(product => Number(product.priceService) || null)
                .filter((price) => price !== null);
        }
        catch (error) {
            logger_1.logger.error('Erro ao buscar preços na Droga Raia', {
                source: this.sourceName,
                error: error.message,
            });
            return [];
        }
    }
    extractNextData(html) {
        const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.+?)<\/script>/);
        if (!match || !match[1]) {
            return null;
        }
        try {
            return JSON.parse(match[1]);
        }
        catch {
            return null;
        }
    }
}
exports.DrogaRaiaStrategy = DrogaRaiaStrategy;
//# sourceMappingURL=droga-raia.strategy.js.map