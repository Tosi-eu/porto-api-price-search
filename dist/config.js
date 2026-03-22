"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = loadConfig;
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    PORT: zod_1.z.coerce.number().default(3010),
    NODE_ENV: zod_1.z.string().optional(),
    PRICING_API_KEY: zod_1.z.string().min(8, 'PRICING_API_KEY deve ter pelo menos 8 caracteres'),
    REDIS_HOST: zod_1.z.string().optional(),
    REDIS_PORT: zod_1.z.coerce.number().default(6379),
    SEARCH_RATE_LIMIT_WINDOW_MS: zod_1.z.coerce.number().default(60_000),
    SEARCH_RATE_LIMIT_MAX: zod_1.z.coerce.number().default(40),
    GLOBAL_RATE_LIMIT_WINDOW_MS: zod_1.z.coerce.number().default(15 * 60_000),
    GLOBAL_RATE_LIMIT_MAX: zod_1.z.coerce.number().default(300),
});
function loadConfig() {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
        const msg = parsed.error.flatten().fieldErrors;
        throw new Error(`Config inválida: ${JSON.stringify(msg)}`);
    }
    return parsed.data;
}
//# sourceMappingURL=config.js.map