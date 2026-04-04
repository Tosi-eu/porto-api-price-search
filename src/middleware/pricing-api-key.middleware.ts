import { Inject, Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { APP_CONFIG } from '../config/app-config.constants';
import type { AppConfig } from '../config/app-config';
import {
  readPricingApiKeyFromRequest,
  timingSafeEqualStrings,
} from '../common/helpers/pricing-key.helper';

@Injectable()
export class PricingApiKeyMiddleware implements NestMiddleware {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const provided = readPricingApiKeyFromRequest(req);
    if (
      !provided ||
      !timingSafeEqualStrings(provided, this.config.PRICING_API_KEY)
    ) {
      res.status(401).json({
        error:
          'API key inválida ou ausente (header X-Pricing-API-Key ou Authorization: Bearer).',
      });
      return;
    }
    next();
  }
}
