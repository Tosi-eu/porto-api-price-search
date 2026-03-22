"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withRetry = withRetry;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_INITIAL_DELAY_MS = 500;
const DEFAULT_MAX_DELAY_MS = 5000;
async function withRetry(fn, options) {
    const maxRetries = options?.maxRetries ?? DEFAULT_MAX_RETRIES;
    const initialDelayMs = options?.initialDelayMs ?? DEFAULT_INITIAL_DELAY_MS;
    const maxDelayMs = options?.maxDelayMs ?? DEFAULT_MAX_DELAY_MS;
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (err) {
            lastError = err;
            if (attempt === maxRetries)
                break;
            const delay = Math.min(initialDelayMs * Math.pow(2, attempt), maxDelayMs);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw lastError;
}
//# sourceMappingURL=retry.js.map