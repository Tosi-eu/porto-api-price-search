"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsultaRemediosStrategy = void 0;
const axios_1 = __importDefault(require("axios"));
const cheerio_1 = require("cheerio");
const logger_1 = require("../logger");
class ConsultaRemediosStrategy {
    sourceName = 'consulta_remedios';
    supports(itemType) {
        return itemType === 'medicine';
    }
    async fetchPrices({ itemName, dosage, measurementUnit, }) {
        try {
            const normalizedPath = this.normalizeForUrl(itemName, dosage, measurementUnit);
            const urls = [
                `https://www.consultaremedios.com.br/b/${normalizedPath}`,
                `https://www.consultaremedios.com.br/busca?q=${encodeURIComponent(normalizedPath.replace(/-/g, ' '))}`,
            ];
            logger_1.logger.debug('Buscando preços na Consulta Remédios', {
                source: this.sourceName,
                urls,
                normalizedPath,
            });
            for (const url of urls) {
                try {
                    const response = await axios_1.default.get(url, {
                        timeout: 15000,
                        maxRedirects: 5,
                        validateStatus: s => s >= 200 && s < 400,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
                        },
                    });
                    if (!response.data)
                        continue;
                    const prices = this.extractPrices(response.data);
                    if (prices.length > 0)
                        return prices;
                }
                catch {
                    continue;
                }
            }
            return [];
        }
        catch (error) {
            logger_1.logger.error('Erro no ConsultaRemediosStrategy', {
                error: error.message,
            });
            return [];
        }
    }
    normalizeForUrl(name, dosage, measurementUnit) {
        let normalized = name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-');
        if (dosage) {
            let d = dosage.toLowerCase().replace(/\s+/g, '');
            if (measurementUnit && !d.includes(measurementUnit.toLowerCase())) {
                d += measurementUnit.toLowerCase();
            }
            normalized += `-${d}`;
        }
        return normalized;
    }
    extractPrices(html) {
        const $ = (0, cheerio_1.load)(html);
        const prices = [];
        $('div:contains("R$")').each((_, el) => {
            const text = $(el).text();
            const price = this.parsePrice(text);
            if (price)
                prices.push(price);
        });
        return prices;
    }
    parsePrice(text) {
        const match = text.match(/R\$\s*(\d+(?:\.\d{3})*(?:,\d{2})?)/);
        if (!match)
            return null;
        return parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
    }
}
exports.ConsultaRemediosStrategy = ConsultaRemediosStrategy;
//# sourceMappingURL=consulta-remedios.strategy.js.map