import { Router } from 'express'
import { salud, listo } from '../controllers/saludController'

const router = Router()

router.get('/salud', salud)
router.get('/listo', listo)

/* forzar un error en la ruta de salud para probar el manejo de errores */
router.get('/salud/error', (_req, res) => {
  res.status(500).json({ error: 'Error 500 forzado' })
})

export default router
