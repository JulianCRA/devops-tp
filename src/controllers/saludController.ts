import { Request, Response } from 'express'
import repo from '../repositories/tareasRepository'

export function salud(_req: Request, res: Response): void {
  res.status(200).json({ estado: 'ok' })
}

export async function listo(_req: Request, res: Response): Promise<void> {
  try {
    await repo.verificarConexion()
    res.status(200).json({ listo: true, db: 'conectada' })
  } catch {
    res.status(503).json({ listo: false, db: 'no disponible' })
  }
}
