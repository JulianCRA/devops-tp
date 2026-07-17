import { Request, Response, NextFunction } from 'express'

interface LatencyConfig {
  enabled: boolean
  minMs: number
  maxMs: number
}

const config: LatencyConfig = {
  enabled: false,
  minMs: 0,
  maxMs: 500,
}

export function getConfig(): Readonly<LatencyConfig> {
  return { ...config }
}

export function setConfig(patch: Partial<LatencyConfig>): void {
  if (patch.enabled !== undefined) config.enabled = patch.enabled
  if (patch.minMs !== undefined) config.minMs = patch.minMs
  if (patch.maxMs !== undefined) config.maxMs = patch.maxMs
}

const CONTROL_ROUTE = /^\/(latencia|error|trigger|alerta|reset)(\/|$)/

export function latencyMiddleware(req: Request, _res: Response, next: NextFunction): void {
  if (!config.enabled || CONTROL_ROUTE.test(req.originalUrl.split('?')[0])) {
    next()
    return
  }
  const delay = Math.floor(Math.random() * (config.maxMs - config.minMs + 1)) + config.minMs
  setTimeout(next, delay)
}
