type Level = 'debug' | 'info' | 'warn' | 'error'

const ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 }
const threshold = ORDER[(process.env.LOG_LEVEL as Level) ?? 'info']

function emit(level: Level, msg: string, meta?: Record<string, unknown>) {
  if (ORDER[level] < threshold) return
  const line = {
    t: new Date().toISOString(),
    level,
    msg,
    ...meta,
  }
  // Structured JSON logs — friendly to Loki/Datadog/CloudWatch.
  const out = level === 'error' || level === 'warn' ? console.error : console.log
  out(JSON.stringify(line))
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => emit('debug', msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => emit('info', msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => emit('warn', msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => emit('error', msg, meta),
  child: (bindings: Record<string, unknown>) => ({
    debug: (msg: string, meta?: Record<string, unknown>) =>
      emit('debug', msg, { ...bindings, ...meta }),
    info: (msg: string, meta?: Record<string, unknown>) =>
      emit('info', msg, { ...bindings, ...meta }),
    warn: (msg: string, meta?: Record<string, unknown>) =>
      emit('warn', msg, { ...bindings, ...meta }),
    error: (msg: string, meta?: Record<string, unknown>) =>
      emit('error', msg, { ...bindings, ...meta }),
  }),
}
