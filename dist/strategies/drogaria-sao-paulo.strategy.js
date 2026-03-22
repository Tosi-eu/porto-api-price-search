"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DrogariaSaoPauloStrategy = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../logger");
const retry_1 = require("../lib/retry");
class DrogariaSaoPauloStrategy {
    sourceName = 'drogaria_sao_paulo';
    supports(itemType) {
        return itemType === 'medicine';
    }
    async fetchPrices({ itemName, dosage, }) {
        try {
            const query = `${itemName} ${dosage ?? ''}`.trim();
            const url = 'https://www.drogariasaopaulo.com.br/api/catalog_system/pub/products/search/' +
                encodeURIComponent(query);
            logger_1.logger.debug('Buscando preços na Drogaria São Paulo (VTEX)', {
                source: this.sourceName,
                url,
                query,
            });
            const response = await (0, retry_1.withRetry)(() => axios_1.default.get(url, {
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0',
                    Accept: 'application/json',
                },
                validateStatus: status => status >= 200 && status < 400,
            }), { maxRetries: 3, initialDelayMs: 500 });
            const products = response.data ?? [];
            const prices = [];
            for (const product of products) {
                const item = product?.items?.[0];
                const seller = item?.sellers?.[0];
                const offer = seller?.commertialOffer;
                if (!offer)
                    continue;
                const fullPrice = offer.ListPrice && offer.ListPrice > 0
                    ? offer.ListPrice
                    : offer.Price;
                if (typeof fullPrice === 'number' && fullPrice > 0) {
                    prices.push(fullPrice);
                }
            }
            return prices;
        }
        catch (error) {
            logger_1.logger.error('Erro ao buscar preços na Drogaria São Paulo', {
                source: this.sourceName,
                error: error.message,
            });
            return [];
        }
    }
}
exports.DrogariaSaoPauloStrategy = DrogariaSaoPauloStrategy;
//# sourceMappingURL=drogaria-sao-paulo.strategy.js.map