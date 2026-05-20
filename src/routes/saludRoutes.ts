import { Router } from 'express'
import { salud, listo } from '../controllers/saludController'
import logger from '../logger'

const router = Router()

router.get('/salud', salud)
router.get('/listo', listo)

/* forzar un error en la ruta de salud para probar el manejo de errores */
router.get('/salud/error', (_req, res) => {
  try {
    throw new Error('fallo simulado en /salud/error')
  } catch (err) {
    logger.error('Error en salud', { status: 500, error: String(err) })
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

export default router
