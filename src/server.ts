import './instrumentation'
import app from './app'

const PORT = process.env.PORT ?? 3000
const ts = () => new Date().toLocaleTimeString('es-AR', { hour12: false })

app.listen(PORT, () => {
  console.log(`[${ts()}] Servidor corriendo en el puerto ${PORT}`)

  const base = `http://localhost:${PORT}`
  const json = { 'Content-Type': 'application/json' }

  type Req = { url: string; method?: string; body?: Record<string, unknown> }

  const requests: Req[] = [
    // 2xx
    { url: base + '/salud' },
    { url: base + '/tareas' },
    { url: base + '/tareas', method: 'POST', body: {
      titulo: 'Tarea simulada',
      descripcion: 'Descripción de prueba',
      usuarioCreador: 'simulador',
      prioridad: 'MEDIA',
    }},
    { url: base + '/tareas/id-simulado', method: 'PATCH', body: { titulo: 'Tarea actualizada' } },
    { url: base + '/tareas/id-simulado/estado', method: 'PATCH', body: { estado: 'EN_PROGRESO' } },
    { url: base + '/tareas/id-simulado', method: 'DELETE' },
    // 4xx
    { url: base + '/tareas/privada' },                          // 401
    { url: base + '/tareas/administrativa' },                   // 403
    { url: base + '/tareas/id-inexistente' },                   // 404
    { url: base + '/tareas', method: 'POST', body: {} },        // 400 - body vacío
    { url: base + '/tareas', method: 'POST', body: {            // 400 - prioridad inválida
      titulo: 'X', descripcion: 'X', usuarioCreador: 'X', prioridad: 'ULTRA',
    }},
    // 5xx
    { url: base + '/salud/error' },
  ]

  setInterval(() => {
    const req = requests[Math.floor(Math.random() * requests.length)]
    fetch(req.url, {
      method: req.method ?? 'GET',
      headers: req.body ? json : undefined,
      body: req.body ? JSON.stringify(req.body) : undefined,
    }).catch(() => {/* errores de red se ignoran */})
  }, 5000)
})
