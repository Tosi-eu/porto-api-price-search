"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuscapeStrategy = void 0;
const axios_1 = __importDefault(require("axios"));
const cheerio_1 = require("cheerio");
const logger_1 = require("../logger");
class BuscapeStrategy {
    sourceName = 'buscape';
    supports(itemType) {
        return itemType === 'input';
    }
    async fetchPrices({ itemName }) {
        try {
            const searchTerm = encodeURIComponent(itemName.toLowerCase().replace(/[^\w\s]/g, ' '));
            const url = `https://www.buscape.com.br/search?q=${searchTerm}`;
            const response = await axios_1.default.get(url, {
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
                },
            });
            if (!response.data)
                return [];
            const $ = (0, cheerio_1.load)(response.data);
            const prices = [];
            $('[class*="price"], [class*="preco"]').each((_, el) => {
                const text = $(el).text();
                const price = this.parsePrice(text);
                if (price && price >= 0.5 && price <= 10000) {
                    prices.push(price);
                }
            });
            return prices;
        }
        catch (error) {
            logger_1.logger.error('Erro no BuscapeStrategy', {
                error: error.message,
            });
            return [];
        }
    }
    parsePrice(text) {
        const match = text.match(/R\$\s*(\d+(?:\.\d{3})*(?:,\d{2})?)/);
        if (!match)
            return null;
        return parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
    }
}
exports.BuscapeStrategy = BuscapeStrategy;
//# sourceMappingURL=buscape.strategy.js.map