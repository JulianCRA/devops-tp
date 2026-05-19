import express from 'express'
import tareasRouter from './routes/tareasRoutes'
import saludRouter from './routes/saludRoutes'

const app = express()

app.use(express.json())

/* simular errores 401 y 403 en rutas específicas */
app.use('/tareas/privada', (_req, res) => {
  res.status(401).json({ error: 'No autorizado' })
})

app.use('/tareas/administrativa', (_req, res) => {
  res.status(403).json({ error: 'Prohibido' })
})


app.use('/', saludRouter)
app.use('/tareas', tareasRouter)

export default app
