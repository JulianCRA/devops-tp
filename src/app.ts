import express from 'express'
import tareasRouter from './routes/tareasRoutes'
import saludRouter from './routes/saludRoutes'

const app = express()

app.use(express.json())

app.use('/', saludRouter)
app.use('/tareas', tareasRouter)

export default app
