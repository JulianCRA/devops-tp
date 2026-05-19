import express from 'express'
import tareasRouter from './routes/tareasRoutes'
import saludRouter from './routes/saludRoutes'

const app = express()
const ts = () => new Date().toLocaleTimeString('es-AR', { hour12: false })

app.use(express.json())

/* simular errores 401 y 403 en rutas específicas */
app.use('/tareas/privada', (_req, res) => {
  console.warn(`[${ts()}] 401 No autorizado en /tareas/privada`)
  res.status(401).json({ error: 'No autorizado (401)' })
})

app.use('/tareas/administrativa', (_req, res) => {
  console.warn(`[${ts()}] 403 Prohibido en /tareas/administrativa`)
  res.status(403).json({ error: 'Prohibido (403)' })
})


app.use('/', saludRouter)
app.use('/tareas', tareasRouter)

export default app
