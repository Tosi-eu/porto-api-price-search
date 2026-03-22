import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(3010),
  NODE_ENV: z.string().optional(),
  PRICING_API_KEY: z.string().min(8, 'PRICING_API_KEY deve ter pelo menos 8 caracteres'),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.coerce.number().default(6379),
  SEARCH_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60_000),
  SEARCH_RATE_LIMIT_MAX: z.coerce.number().default(40),
  GLOBAL_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60_000),
  GLOBAL_RATE_LIMIT_MAX: z.coerce.number().default(300),
});

export type AppConfig = z.infer<typeof envSchema>;

export function loadConfig(): AppConfig {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors;
    throw new Error(`Config inválida: ${JSON.stringify(msg)}`);
  }
  return parsed.data;
}
