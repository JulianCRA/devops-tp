import { createLogger, transports, format } from 'winston'
import LokiTransport from 'winston-loki'

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
          format: format.json(),
          gracefulShutdown: false,
          onConnectionError: (err: unknown) => logger.error('[loki] connection error', { err }),
        })]
      : []),
  ],
})

export default logger
