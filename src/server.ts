import './instrumentation'
import app from './app'

const PORT = process.env.PORT ?? 3000
const ts = () => new Date().toLocaleTimeString('es-AR', { hour12: false })

app.listen(PORT, () => {
  console.log(`[${ts()}] Servidor corriendo en el puerto ${PORT}`)

  const base = `http://localhost:${PORT}`
  const json = { 'Content-Type': 'application/json' }

  // Pool de IDs reales creados por el simulador
  const idPool: string[] = []

  type Req = { url: string; method?: string; body?: Record<string, unknown> }

  const staticRequests: Req[] = [
    // 2xx
    { url: base + '/salud' },
    { url: base + '/tareas' },
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

  async function tick() {
    const roll = Math.random()

    // 25 %: crear tarea real y guardar el ID
    if (roll < 0.25) {
      try {
        const res = await fetch(`${base}/tareas`, {
          method: 'POST',
          headers: json,
          body: JSON.stringify({
            titulo: 'Tarea simulada',
            descripcion: 'Descripción de prueba',
            usuarioCreador: 'simulador',
            prioridad: 'MEDIA',
          }),
        })
        if (res.ok) {
          const tarea = await res.json() as { id: string }
          idPool.push(tarea.id)
        }
      } catch { /* ignorar */ }
      return
    }

    // 35 %: operar sobre un ID real del pool (si hay)
    if (roll < 0.60 && idPool.length > 0) {
      const idx = Math.floor(Math.random() * idPool.length)
      const id = idPool[idx]
      const action = Math.random()

      if (action < 0.33) {
        // PATCH titulo
        await fetch(`${base}/tareas/${id}`, {
          method: 'PATCH', headers: json,
          body: JSON.stringify({ titulo: 'Tarea actualizada' }),
        }).catch(() => { /* ignorar */ })
      } else if (action < 0.66) {
        // PATCH estado
        await fetch(`${base}/tareas/${id}/estado`, {
          method: 'PATCH', headers: json,
          body: JSON.stringify({ estado: 'EN_PROGRESO' }),
        }).catch(() => { /* ignorar */ })
      } else {
        // DELETE — sacar del pool
        await fetch(`${base}/tareas/${id}`, { method: 'DELETE' })
          .catch(() => { /* ignorar */ })
        idPool.splice(idx, 1)
      }
      return
    }

    // resto: request estática aleatoria
    const req = staticRequests[Math.floor(Math.random() * staticRequests.length)]
    fetch(req.url, {
      method: req.method ?? 'GET',
      headers: req.body ? json : undefined,
      body: req.body ? JSON.stringify(req.body) : undefined,
    }).catch(() => { /* ignorar */ })
  }

  setInterval(() => { tick().catch(() => { /* ignorar */ }) }, 5000)
})
