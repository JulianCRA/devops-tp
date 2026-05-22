import './instrumentation'
import app from './app'
import * as simulator from './trafficSimulator'
import logger from './logger'
import { version } from '../package.json'

const PORT = process.env.PORT ?? 3000

app.listen(PORT, () => {
  logger.info('Servidor corriendo', { port: PORT, version })
})
