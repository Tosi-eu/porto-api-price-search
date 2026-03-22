"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPricingApiKeyMiddleware = createPricingApiKeyMiddleware;
const crypto_1 = __importDefault(require("crypto"));
function readKey(req) {
    const h = req.header('x-pricing-api-key') ?? req.header('X-Pricing-API-Key') ?? '';
    if (h.trim())
        return h.trim();
    const auth = req.header('authorization');
    if (auth?.startsWith('Bearer '))
        return auth.slice(7).trim();
    return '';
}
function safeEqual(a, b) {
    const x = Buffer.from(a, 'utf8');
    const y = Buffer.from(b, 'utf8');
    if (x.length !== y.length)
        return false;
    return crypto_1.default.timingSafeEqual(x, y);
}
function createPricingApiKeyMiddleware(expectedKey) {
    return (req, res, next) => {
        const provided = readKey(req);
        if (!provided || !safeEqual(provided, expectedKey)) {
            return res.status(401).json({
                error: 'API key inválida ou ausente (header X-Pricing-API-Key ou Authorization: Bearer).',
            });
        }
        next();
    };
}
//# sourceMappingURL=pricing-auth.middleware.js.map