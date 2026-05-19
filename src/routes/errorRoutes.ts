import { Router } from 'express'

const router = Router()

type Trigger = { path: string; method?: string; body?: Record<string, unknown> }

const triggers: Record<string, Trigger> = {
  '400': { path: '/tareas', method: 'POST', body: {} },
  '401': { path: '/tareas/privada' },
  '403': { path: '/tareas/administrativa' },
  '404': { path: '/tareas/00000000-0000-0000-0000-000000000000' },
  '500': { path: '/salud/error' },
}

router.get('/:code', async (req, res) => {
  const trigger = triggers[req.params.code]

  if (!trigger) {
    res.status(400).json({ error: `Código no soportado: ${req.params.code}` })
    return
  }

  const base = `http://localhost:${process.env.PORT ?? 3000}`
  const upstream = await fetch(`${base}${trigger.path}`, {
    method: trigger.method ?? 'GET',
    headers: trigger.body ? { 'Content-Type': 'application/json' } : undefined,
    body: trigger.body ? JSON.stringify(trigger.body) : undefined,
  })

  const data = await upstream.json()
  res.status(upstream.status).json(data)
})

export default router
