"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const ioredis_1 = __importDefault(require("ioredis"));
const config_1 = require("./config");
const logger_1 = require("./logger");
const cache_1 = require("./lib/cache");
const aggregator_1 = require("./lib/aggregator");
const price_search_service_1 = require("./services/price-search.service");
const strategies_1 = require("./strategies");
const search_routes_1 = require("./routes/search.routes");
const config = (0, config_1.loadConfig)();
let redis;
if (config.REDIS_HOST) {
    redis = new ioredis_1.default({
        host: config.REDIS_HOST,
        port: config.REDIS_PORT,
        maxRetriesPerRequest: 3,
    });
    redis.on('error', err => {
        logger_1.logger.error('Redis error', { error: err.message });
    });
}
const cache = redis ? (0, cache_1.createRedisCache)(redis) : (0, cache_1.createNoopCache)();
if (!config.REDIS_HOST) {
    logger_1.logger.warn('REDIS_HOST não definido — cache de preços desativado');
}
const priceSearchService = new price_search_service_1.PriceSearchService(cache, (0, strategies_1.createDefaultStrategies)(), new aggregator_1.PriceAggregator(), new aggregator_1.OutlierFilter());
const app = (0, express_1.default)();
app.set('trust proxy', 1);
app.use((0, helmet_1.default)());
app.use(express_1.default.json({ limit: '256kb' }));
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'porto-api-price-search' });
});
const globalLimiter = (0, express_rate_limit_1.default)({
    windowMs: config.GLOBAL_RATE_LIMIT_WINDOW_MS,
    max: config.GLOBAL_RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Muitas requisições. Tente novamente em breve.' },
});
app.use('/v1', globalLimiter, (0, search_routes_1.createSearchRouter)(priceSearchService, config));
app.listen(config.PORT, '0.0.0.0', () => {
    logger_1.logger.info('porto-api-price-search escutando', {
        port: config.PORT,
        redis: Boolean(config.REDIS_HOST),
    });
});
//# sourceMappingURL=server.js.map