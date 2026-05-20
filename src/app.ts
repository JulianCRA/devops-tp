import express from 'express'
import tareasRouter from './routes/tareasRoutes'
import saludRouter from './routes/saludRoutes'
import errorRouter from './routes/errorRoutes'
import * as simulator from './trafficSimulator'
import { resetDB } from './repositories/tareasRepository'
import logger from './logger'

const app = express()

app.use(express.json())

app.use((req, res, next) => {
  // Outer trigger requests (/error/*, /trigger, /alerta, /reset) are control-plane,
  // not real traffic — skip so triggered errors are indistinguishable from organic ones.
  const route = req.originalUrl.split('?')[0]
  if (/^\/(error|trigger|alerta|reset)(\/|$)/.test(route)) {
    next()
    return
  }
  // Skip Render's initial HEAD / connectivity probe — not real traffic
  if (req.method === 'HEAD' && route === '/') {
    res.sendStatus(200)
    return
  }
  res.on('finish', () => {
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info'
    logger[level]('http response', {
      method: req.method,
      route,
      status: res.statusCode,
    })
  })
  next()
})

/* simular errores 401 y 403 en rutas específicas */
app.use('/tareas/privada', (_req, res) => {
  logger.warn('No autorizado', { status: 401 })
  res.status(401).json({ error: 'No autorizado (401)' })
})

app.use('/tareas/administrativa', (_req, res) => {
  logger.warn('Prohibido', { status: 403 })
  res.status(403).json({ error: 'Prohibido (403)' })
})

app.post('/trigger', (_req, res) => {
  const port = process.env.PORT ?? 3000
  if (simulator.isRunning()) {
    simulator.stop()
  } else {
    simulator.start(port)
  }
  res.json({ simulador: simulator.isRunning() ? 'activo' : 'detenido' })
})

app.use('/', saludRouter)
app.use('/tareas', tareasRouter)
app.use('/error', errorRouter)

// Endpoint manual para disparar una alerta en Grafana.
app.post('/alerta', (_req, res) => {
  logger.error('ALERTA_MANUAL', { alert_test: true })
  res.status(200).json({ alerta: 'disparada' })
})

app.post('/reset', async (_req, res) => {
  const { count } = await resetDB()
  simulator.clearPool()
  logger.warn('Base de datos reseteada', { eliminadas: count })
  res.json({ eliminadas: count })
})

export default app
