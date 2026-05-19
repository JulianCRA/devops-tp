import { Request, Response } from 'express'
import repo from '../repositories/tareasRepository'

const ts = () => new Date().toLocaleTimeString('es-AR', { hour12: false })

export function salud(_req: Request, res: Response): void {
  console.log(`[${ts()}] GET /salud - ok`)
  res.status(200).json({ estado: 'ok' })
}

export async function listo(_req: Request, res: Response): Promise<void> {
  try {
    await repo.verificarConexion()
    console.log(`[${ts()}] GET /listo - db conectada`)
    res.status(200).json({ listo: true, db: 'conectada' })
  } catch (err) {
    console.error(`[${ts()}] GET /listo - db no disponible:`, err)
    res.status(503).json({ listo: false, db: 'no disponible' })
  }
}
