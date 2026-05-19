const ts = () => new Date().toLocaleTimeString('es-AR', { hour12: false })

const idPool: string[] = []
let timer: ReturnType<typeof setTimeout> | null = null
let running = false
let base = ''

type Req = { url: string; method?: string; body?: Record<string, unknown> }
const json = { 'Content-Type': 'application/json' }

function buildStaticRequests(): Req[] {
  return [
    { url: base + '/salud' },
    { url: base + '/tareas' },
    { url: base + '/tareas/privada' },
    { url: base + '/tareas/administrativa' },
    { url: base + '/tareas/id-inexistente' },
    { url: base + '/tareas', method: 'POST', body: {} },
    { url: base + '/tareas', method: 'POST', body: {
      titulo: 'X', descripcion: 'X', usuarioCreador: 'X', prioridad: 'ULTRA',
    }},
    { url: base + '/salud/error' },
  ]
}

async function tick() {
  const roll = Math.random()

  if (roll < 0.25) {
    if (idPool.length >= 200) {
      console.warn(`[${ts()}] Pool lleno (${idPool.length} tareas). Ignorando creación.`)
      return
    }
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

  if (roll < 0.60 && idPool.length > 0) {
    const idx = Math.floor(Math.random() * idPool.length)
    const id = idPool[idx]
    const action = Math.random()

    if (action < 0.33) {
      await fetch(`${base}/tareas/${id}`, {
        method: 'PATCH', headers: json,
        body: JSON.stringify({ titulo: 'Tarea actualizada' }),
      }).catch(() => { /* ignorar */ })
    } else if (action < 0.66) {
      await fetch(`${base}/tareas/${id}/estado`, {
        method: 'PATCH', headers: json,
        body: JSON.stringify({ estado: 'EN_PROGRESO' }),
      }).catch(() => { /* ignorar */ })
    } else {
      const res = await fetch(`${base}/tareas/${id}`, { method: 'DELETE' })
        .catch(() => null)
      if (res?.ok) {
        const current = idPool.indexOf(id)
        if (current !== -1) idPool.splice(current, 1)
      }
    }
    return
  }

  const statics = buildStaticRequests()
  const req = statics[Math.floor(Math.random() * statics.length)]
  fetch(req.url, {
    method: req.method ?? 'GET',
    headers: req.body ? json : undefined,
    body: req.body ? JSON.stringify(req.body) : undefined,
  }).catch(() => { /* ignorar */ })
}

// delay aleatorio uniforme entre 1 y 20 segundos
function randomDelay() {
  return Math.floor(Math.random() * 19000) + 1000
}

function scheduleNext() {
  if (!running) return
  const delay = randomDelay()
  timer = setTimeout(async () => {
    // 25% burst (2-5 reqs concurrentes), 75% request única
    if (Math.random() < 0.25) {
      const count = Math.floor(Math.random() * 4) + 2  // 2-5
      await Promise.all(Array.from({ length: count }, () => tick().catch(() => { /* ignorar */ })))
    } else {
      await tick().catch(() => { /* ignorar */ })
    }
    scheduleNext()
  }, delay)
}

export async function start(port: string | number) {
  if (running) return
  base = `http://localhost:${port}`
  running = true
  console.log(`[${ts()}] Simulador de tráfico iniciado`)
  try {
    const res = await fetch(`${base}/tareas`)
    if (res.ok) {
      const tareas = await res.json() as { id: string }[]
      const ids = tareas.slice(0, 200).map((t) => t.id)
      idPool.push(...ids)
      console.log(`[${ts()}] Pool inicializado con ${idPool.length} tareas existentes`)
    }
  } catch { /* ignorar */ }
  scheduleNext()
}

export function stop() {
  if (!running) return
  running = false
  if (timer) { clearTimeout(timer); timer = null }
  idPool.length = 0
  console.log(`[${ts()}] Simulador de tráfico detenido`)
}

export function isRunning() {
  return running
}
