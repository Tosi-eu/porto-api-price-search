"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSearchRouter = createSearchRouter;
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const zod_1 = require("zod");
const pricing_auth_middleware_1 = require("../middleware/pricing-auth.middleware");
const logger_1 = require("../logger");
const bodySchema = zod_1.z.object({
    itemName: zod_1.z.string().min(1).max(500),
    itemType: zod_1.z.enum(['medicine', 'input']),
    dosage: zod_1.z.string().max(200).optional(),
    measurementUnit: zod_1.z.string().max(50).optional(),
});
function createSearchRouter(priceSearchService, config) {
    const router = (0, express_1.Router)();
    const searchLimiter = (0, express_rate_limit_1.default)({
        windowMs: config.SEARCH_RATE_LIMIT_WINDOW_MS,
        max: config.SEARCH_RATE_LIMIT_MAX,
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: 'Muitas buscas de preço. Aguarde e tente novamente.' },
    });
    const auth = (0, pricing_auth_middleware_1.createPricingApiKeyMiddleware)(config.PRICING_API_KEY);
    router.post('/search', auth, searchLimiter, async (req, res) => {
        const parsed = bodySchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                error: 'Corpo inválido',
                details: parsed.error.flatten(),
            });
        }
        const { itemName, itemType, dosage, measurementUnit } = parsed.data;
        try {
            const result = await priceSearchService.searchPrice(itemName, itemType, dosage, measurementUnit);
            if (!result) {
                return res.json({
                    averagePrice: null,
                    source: '',
                    lastUpdated: null,
                });
            }
            return res.json({
                averagePrice: result.averagePrice,
                source: result.source,
                lastUpdated: result.lastUpdated.toISOString(),
            });
        }
        catch (e) {
            logger_1.logger.error('Erro na busca de preço', {
                error: e.message,
            });
            return res.status(500).json({ error: 'Erro ao buscar preço' });
        }
    });
    router.post('/cache/invalidate', auth, async (req, res) => {
        const parsed = bodySchema
            .pick({ itemName: true, itemType: true, dosage: true })
            .safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                error: 'Corpo inválido',
                details: parsed.error.flatten(),
            });
        }
        try {
            await priceSearchService.invalidatePriceCache(parsed.data.itemName, parsed.data.dosage, parsed.data.itemType);
            return res.status(204).send();
        }
        catch (e) {
            logger_1.logger.error('Erro ao invalidar cache', {
                error: e.message,
            });
            return res.status(500).json({ error: 'Erro ao invalidar cache' });
        }
    });
    return router;
}
//# sourceMappingURL=search.routes.js.map