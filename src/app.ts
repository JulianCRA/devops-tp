import express from 'express'
import tareasRouter from './routes/tareasRoutes'
import saludRouter from './routes/saludRoutes'
import * as simulator from './trafficSimulator'
import logger from './logger'

const app = express()

app.use(express.json())

/* simular errores 401 y 403 en rutas específicas */
app.use('/tareas/privada', (_req, res) => {
  logger.warn('401 No autorizado en /tareas/privada')
  res.status(401).json({ error: 'No autorizado (401)' })
})

app.use('/tareas/administrativa', (_req, res) => {
  logger.warn('403 Prohibido en /tareas/administrativa')
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

// Endpoint manual para disparar una alerta en Grafana.
// Llámalo con: POST /alerta-test
// Filtrarlo en Grafana/Loki con: {level="error"} |= "ALERTA_MANUAL"
app.post('/alerta-test', (_req, res) => {
  logger.error('ALERTA_MANUAL', { alert_test: true })
  res.status(200).json({ alerta: 'disparada' })
})

export default app
