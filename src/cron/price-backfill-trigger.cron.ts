import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';

function envBool(name: string, fallback = false): boolean {
  const raw = process.env[name];
  if (raw == null) return fallback;
  return String(raw).trim().toLowerCase() === 'true';
}

@Injectable()
export class PriceBackfillTriggerCron {
  private readonly log = new Logger(PriceBackfillTriggerCron.name);

  @Cron(process.env.PRICE_BACKFILL_CRON || '15 */2 * * *')
  async handle(): Promise<void> {
    if (!envBool('ENABLE_CRON', false)) return;
    if (!envBool('ENABLE_PRICE_BACKFILL_CRON', true)) return;

    const base = (
      process.env.BACKEND_INTERNAL_URL ||
      process.env.BACKEND_URL ||
      ''
    )
      .trim()
      .replace(/\/$/, '');
    const secret = process.env.INTERNAL_PRICE_BACKFILL_SECRET?.trim();

    if (!base || !secret) {
      this.log.warn(
        'BACKEND_INTERNAL_URL (ou BACKEND_URL) / INTERNAL_PRICE_BACKFILL_SECRET ausentes — cron de backfill não dispara',
      );
      return;
    }

    const url = `${base}/api/v1/internal/price-backfill/cron`;
    const timeout =
      Number(process.env.PRICE_BACKFILL_HTTP_TIMEOUT_MS) || 600_000;

    try {
      const res = await axios.post(url, {}, {
        headers: { 'X-Internal-Secret': secret },
        timeout,
        validateStatus: () => true,
      });

      if (res.status >= 400) {
        this.log.error(
          `[CRON] backend respondeu ${res.status}: ${JSON.stringify(res.data)}`,
        );
        return;
      }

      const data = res.data as {
        skipped?: boolean;
        reason?: string;
        tenants?: number;
        itemsProcessed?: number;
      };

      if (data?.skipped) {
        this.log.debug(
          `[CRON] backfill ignorado: ${data.reason ?? 'unknown'}`,
        );
      } else {
        this.log.log(
          `[CRON] backfill ok tenants=${data?.tenants ?? '?'} items=${data?.itemsProcessed ?? '?'}`,
        );
      }
    } catch (err) {
      this.log.error('[CRON] falha ao chamar backend', err as Error);
    }
  }
}
