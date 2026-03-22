"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const rank = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
};
function minLevel() {
    const v = (process.env.LOG_LEVEL || 'info').toLowerCase();
    if (v === 'debug' || v === 'warn' || v === 'error')
        return v;
    return 'info';
}
function emit(level, msg, meta) {
    if (rank[level] < rank[minLevel()])
        return;
    const payload = meta ? { msg, ...meta } : { msg };
    const line = JSON.stringify(payload);
    if (level === 'error')
        console.error(line);
    else if (level === 'warn')
        console.warn(line);
    else
        console.log(line);
}
exports.logger = {
    debug: (msg, meta) => emit('debug', msg, meta),
    info: (msg, meta) => emit('info', msg, meta),
    warn: (msg, meta) => emit('warn', msg, meta),
    error: (msg, meta) => emit('error', msg, meta),
};
//# sourceMappingURL=logger.js.map