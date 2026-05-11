import { Router } from 'express'
import { salud, listo } from '../controllers/saludController'

const router = Router()

router.get('/salud', salud)
router.get('/listo', listo)

export default router
