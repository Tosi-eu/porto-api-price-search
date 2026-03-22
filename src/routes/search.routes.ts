import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import type { PriceSearchService } from '../services/price-search.service';
import { createPricingApiKeyMiddleware } from '../middleware/pricing-auth.middleware';
import type { AppConfig } from '../config';
import { logger } from '../logger';

const bodySchema = z.object({
  itemName: z.string().min(1).max(500),
  itemType: z.enum(['medicine', 'input']),
  dosage: z.string().max(200).optional(),
  measurementUnit: z.string().max(50).optional(),
});

export function createSearchRouter(
  priceSearchService: PriceSearchService,
  config: AppConfig,
): Router {
  const router = Router();

  const searchLimiter = rateLimit({
    windowMs: config.SEARCH_RATE_LIMIT_WINDOW_MS,
    max: config.SEARCH_RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Muitas buscas de preço. Aguarde e tente novamente.' },
  });

  const auth = createPricingApiKeyMiddleware(config.PRICING_API_KEY);

  router.post(
    '/search',
    auth,
    searchLimiter,
    async (req, res) => {
      const parsed = bodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Corpo inválido',
          details: parsed.error.flatten(),
        });
      }

      const { itemName, itemType, dosage, measurementUnit } = parsed.data;

      try {
        const result = await priceSearchService.searchPrice(
          itemName,
          itemType,
          dosage,
          measurementUnit,
        );

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
      } catch (e) {
        logger.error('Erro na busca de preço', {
          error: (e as Error).message,
        });
        return res.status(500).json({ error: 'Erro ao buscar preço' });
      }
    },
  );

  router.post(
    '/cache/invalidate',
    auth,
    async (req, res) => {
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
        await priceSearchService.invalidatePriceCache(
          parsed.data.itemName,
          parsed.data.dosage,
          parsed.data.itemType,
        );
        return res.status(204).send();
      } catch (e) {
        logger.error('Erro ao invalidar cache', {
          error: (e as Error).message,
        });
        return res.status(500).json({ error: 'Erro ao invalidar cache' });
      }
    },
  );

  return router;
}
