import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import Redis from 'ioredis';
import { loadConfig } from './config';
import { logger } from './logger';
import { createRedisCache, createNoopCache } from './lib/cache';
import { OutlierFilter, PriceAggregator } from './lib/aggregator';
import { PriceSearchService } from './services/price-search.service';
import { createDefaultStrategies } from './strategies';
import { createSearchRouter } from './routes/search.routes';

const config = loadConfig();

let redis: Redis | undefined;
if (config.REDIS_HOST) {
  redis = new Redis({
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
    maxRetriesPerRequest: 3,
  });
  redis.on('error', err => {
    logger.error('Redis error', { error: err.message });
  });
}

const cache = redis ? createRedisCache(redis) : createNoopCache();

if (!config.REDIS_HOST) {
  logger.warn('REDIS_HOST não definido — cache de preços desativado');
}

const priceSearchService = new PriceSearchService(
  cache,
  createDefaultStrategies(),
  new PriceAggregator(),
  new OutlierFilter(),
);

const app = express();
app.set('trust proxy', 1);
app.use(helmet());
app.use(express.json({ limit: '256kb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'porto-api-price-search' });
});

const globalLimiter = rateLimit({
  windowMs: config.GLOBAL_RATE_LIMIT_WINDOW_MS,
  max: config.GLOBAL_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente em breve.' },
});

app.use('/v1', globalLimiter, createSearchRouter(priceSearchService, config));

app.listen(config.PORT, '0.0.0.0', () => {
  logger.info('porto-api-price-search escutando', {
    port: config.PORT,
    redis: Boolean(config.REDIS_HOST),
  });
});
