import './instrumentation'
import app from './app'
import * as simulator from './trafficSimulator'

const PORT = process.env.PORT ?? 3000
const ts = () => new Date().toLocaleTimeString('es-AR', { hour12: false })

app.listen(PORT, () => {
  console.log(`[${ts()}] Servidor corriendo en el puerto ${PORT}`)
})
