import { createLogger, transports, format } from 'winston'
import LokiTransport from 'winston-loki'

// Loki structured metadata requires all values to be strings.
// winston-loki passes log metadata directly as structured metadata (3rd element in values[]).
const lokiMeta = format((info) => {
  for (const key of Object.keys(info)) {
    if (typeof (info as Record<string, unknown>)[key] === 'number') {
      (info as Record<string, unknown>)[key] = String((info as Record<string, unknown>)[key])
    }
  }
  return info
})

const consoleLine = format.printf((info) => {
  const { timestamp, level, message, ...meta } = info as Record<string, unknown>
  const metaKeys = Object.keys(meta).filter((key) => !['service', 'label'].includes(key))
  const metaText = metaKeys.length === 0
    ? ''
    : ` ${metaKeys.map((key) => `${key}=${JSON.stringify(meta[key])}`).join(' ')}`

  return `${String(timestamp)} ${String(level)} ${String(message)}${metaText}`
})

const logger = createLogger({
  level: 'info',
  silent: process.env.NODE_ENV === 'test',
  format: format.combine(format.timestamp()),
  // In test mode we silence the logger entirely; transports are omitted so that
  // Winston does not create internal stream pipelines that keep open async handles
  // and prevent the Jest worker process from exiting cleanly.
  transports: process.env.NODE_ENV === 'test' ? [] : [
    new transports.Console({
      format: format.combine(
        format.colorize({ all: true }),
        consoleLine,
      ),
    }),
    ...(process.env.LOKI_URL
      ? [new LokiTransport({
          host: process.env.LOKI_URL,
          basicAuth: process.env.LOKI_AUTH,
          labels: { app: 'tareas-api' },
          json: true,
          format: format.combine(format.timestamp(), lokiMeta(), format.json()),
          gracefulShutdown: false,
          onConnectionError: (err: unknown) => console.error('[loki] connection error:', err),
        })]
      : []),
  ],
})

export default logger
