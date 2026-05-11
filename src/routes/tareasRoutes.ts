import { Router } from 'express'
import {
  listarTareas,
  obtenerTarea,
  crearTarea,
  actualizarTarea,
  cambiarEstado,
  eliminarTarea,
} from '../controllers/tareasController'

const router = Router()

router.get('/', listarTareas)
router.get('/:id', obtenerTarea)
router.post('/', crearTarea)
router.patch('/:id/estado', cambiarEstado)
router.patch('/:id', actualizarTarea)
router.delete('/:id', eliminarTarea)

export default router
