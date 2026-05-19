import { Router } from 'express'
import { salud, listo } from '../controllers/saludController'

const router = Router()

router.get('/salud', salud)
router.get('/listo', listo)

/* forzar un error en la ruta de salud para probar el manejo de errores */
router.get('/salud/error', (_req, res) => {
  throw new Error('Error forzado en la ruta de salud')
})

export default router
