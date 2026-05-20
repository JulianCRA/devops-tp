import { Request, Response } from 'express'
import repo from '../repositories/tareasRepository'
import logger from '../logger'

export function salud(_req: Request, res: Response): void {
  logger.info('Salud ok', { status: 200 })
  res.status(200).json({ estado: 'ok' })
}

export async function listo(_req: Request, res: Response): Promise<void> {
  try {
    await repo.verificarConexion()
    logger.info('DB conectada', { status: 200 })
    res.status(200).json({ listo: true, db: 'conectada' })
  } catch (err) {
    logger.error('DB no disponible', { status: 503, error: String(err) })
    res.status(503).json({ listo: false, db: 'no disponible' })
  }
}
