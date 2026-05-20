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

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json(),
  ),
  transports: [
    new transports.Console(),
    ...(process.env.LOKI_URL
      ? [new LokiTransport({
          host: process.env.LOKI_URL,
          basicAuth: process.env.LOKI_AUTH,
          labels: { app: 'tareas-api' },
          json: true,
          batching: false,
          format: format.combine(lokiMeta(), format.json()),
          gracefulShutdown: false,
          onConnectionError: (err: unknown) => console.error('[loki] connection error:', err),
        })]
      : []),
  ],
})

export default logger
