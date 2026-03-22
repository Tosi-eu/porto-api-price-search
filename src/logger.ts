type Level = 'debug' | 'info' | 'warn' | 'error';

const rank: Record<Level, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function minLevel(): Level {
  const v = (process.env.LOG_LEVEL || 'info').toLowerCase();
  if (v === 'debug' || v === 'warn' || v === 'error') return v as Level;
  return 'info';
}

function emit(level: Level, msg: string, meta?: Record<string, unknown>) {
  if (rank[level] < rank[minLevel()]) return;
  const payload = meta ? { msg, ...meta } : { msg };
  const line = JSON.stringify(payload);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) =>
    emit('debug', msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) =>
    emit('info', msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) =>
    emit('warn', msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) =>
    emit('error', msg, meta),
};
