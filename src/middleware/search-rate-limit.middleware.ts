import { Inject, Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import type { RequestHandler } from 'express';
import { APP_CONFIG } from '../config/app-config.constants';
import type { AppConfig } from '../config/app-config';

@Injectable()
export class SearchRateLimitMiddleware implements NestMiddleware {
  private readonly limiter: RequestHandler;

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {
    this.limiter = rateLimit({
      windowMs: config.SEARCH_RATE_LIMIT_WINDOW_MS,
      max: config.SEARCH_RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Muitas buscas de preço. Aguarde e tente novamente.' },
    });
  }

  use(req: Request, res: Response, next: NextFunction): void {
    this.limiter(req, res, next);
  }
}
