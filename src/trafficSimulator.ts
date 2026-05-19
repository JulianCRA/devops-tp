import logger from './logger'

const idPool: string[] = []
let timer: ReturnType<typeof setTimeout> | null = null
let running = false
let base = ''

const VERBOS   = ['Implementar', 'Revisar', 'Migrar', 'Documentar', 'Optimizar', 'Refactorizar', 'Desplegar', 'Testear', 'Configurar', 'Analizar']
const OBJETOS  = ['autenticación', 'pipeline de CI', 'base de datos', 'caché de Redis', 'logs de auditoría', 'API de pagos', 'servicio de emails', 'dashboard de métricas', 'módulo de reportes', 'integración con S3']
const USUARIOS = ['ana.garcia', 'carlos.lopez', 'maria.torres', 'pedro.ruiz', 'lucia.fernandez', 'simulador']

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function buildTarea() {
  return {
    titulo: `${randomItem(VERBOS)} ${randomItem(OBJETOS)}`,
    descripcion: `Tarea generada automáticamente por el simulador de tráfico.`,
    usuarioCreador: randomItem(USUARIOS),
    prioridad: randomItem(['BAJA', 'MEDIA', 'ALTA']),
  }
}

type Req = { url: string; method?: string; body?: Record<string, unknown> }
const json = { 'Content-Type': 'application/json' }

function buildNormalRequests(): Req[] {
  return [
    { url: base + '/salud' },
    { url: base + '/tareas' },
    { url: base + '/tareas/privada' },
    { url: base + '/tareas/administrativa' },
  ]
}

async function tick() {
  const roll = Math.random()

  if (roll < 0.25) {
    if (idPool.length >= 200) {
      logger.warn('Pool lleno, ignorando creación', { size: idPool.length })
      return
    }
    try {
      const res = await fetch(`${base}/tareas`, {
        method: 'POST',
        headers: json,
        body: JSON.stringify(buildTarea()),
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

    const evict = () => {
      const current = idPool.indexOf(id)
      if (current !== -1) idPool.splice(current, 1)
    }

    if (action < 0.33) {
      const res = await fetch(`${base}/tareas/${id}`, {
        method: 'PATCH', headers: json,
        body: JSON.stringify({ titulo: 'Tarea actualizada' }),
      }).catch(() => null)
      if (res?.status === 404) evict()
    } else if (action < 0.66) {
      const res = await fetch(`${base}/tareas/${id}/estado`, {
        method: 'PATCH', headers: json,
        body: JSON.stringify({ estado: 'EN_PROGRESO' }),
      }).catch(() => null)
      if (res?.status === 404) evict()
    } else {
      const res = await fetch(`${base}/tareas/${id}`, { method: 'DELETE' })
        .catch(() => null)
      if (res?.ok) evict()
      else if (res?.status === 404) evict()
    }
    return
  }

  const reqs = buildNormalRequests()
  const req = reqs[Math.floor(Math.random() * reqs.length)]
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
  logger.info('Simulador de tráfico iniciado')
  try {
    const res = await fetch(`${base}/tareas`)
    if (res.ok) {
      const tareas = await res.json() as { id: string }[]
      const ids = tareas.slice(0, 200).map((t) => t.id)
      idPool.push(...ids)
      logger.info('Pool inicializado', { tareas: idPool.length })
    }
  } catch { /* ignorar */ }
  scheduleNext()
}

export function stop() {
  if (!running) return
  running = false
  if (timer) { clearTimeout(timer); timer = null }
  idPool.length = 0
  logger.info('Simulador de tráfico detenido')
}

export function isRunning() {
  return running
}

export function clearPool() {
  idPool.length = 0
}
