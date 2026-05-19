import { Request, Response, RequestHandler } from 'express'
import { Estado, Prioridad } from '@prisma/client'
import repo from '../repositories/tareasRepository'

const ts = () => new Date().toLocaleTimeString('es-AR', { hour12: false })

type IdParam = { id: string }

const ESTADOS_VALIDOS = Object.values(Estado)
const PRIORIDADES_VALIDAS = Object.values(Prioridad)

export async function listarTareas(req: Request, res: Response): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  try {
    const { estado, usuarioAsignado } = req.query

    if (estado !== undefined && !ESTADOS_VALIDOS.includes(estado as Estado)) {
      res.status(400).json({ error: `estado inválido. Valores permitidos: ${ESTADOS_VALIDOS.join(', ')}` })
      return
    }

    const tareas = await repo.listarTareas({
      estado: estado as Estado | undefined,
      usuarioAsignado: usuarioAsignado as string | undefined,
    })

    res.status(200).json(tareas)
  } catch (err) {
    console.error(`[${ts()}] Error en listarTareas:`, err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export async function obtenerTarea(req: Request, res: Response): Promise<void> {
  try {
    const tarea = await repo.obtenerTareaPorId(String(req.params.id))
    if (!tarea) {
      res.status(404).json({ error: 'Tarea no encontrada' })
      return
    }
    res.status(200).json(tarea)
  } catch (err) {
    console.error(`[${ts()}] Error en obtenerTarea:`, err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export async function crearTarea(req: Request, res: Response): Promise<void> {
  try {
    const { titulo, descripcion, usuarioCreador, fechaEntrega, prioridad, usuarioAsignado } = req.body

    if (!titulo || typeof titulo !== 'string' || titulo.trim() === '') {
      res.status(400).json({ error: 'titulo es obligatorio' })
      return
    }
    if (!descripcion || typeof descripcion !== 'string' || descripcion.trim() === '') {
      res.status(400).json({ error: 'descripcion es obligatoria' })
      return
    }
    if (!usuarioCreador || typeof usuarioCreador !== 'string' || usuarioCreador.trim() === '') {
      res.status(400).json({ error: 'usuarioCreador es obligatorio' })
      return
    }

    let fechaEntregaParsed: Date | undefined
    if (fechaEntrega !== undefined) {
      fechaEntregaParsed = new Date(fechaEntrega as string)
      if (isNaN(fechaEntregaParsed.getTime())) {
        res.status(400).json({ error: 'fechaEntrega debe ser una fecha válida en formato ISO 8601' })
        return
      }
      if (fechaEntregaParsed <= new Date()) {
        res.status(400).json({ error: 'fechaEntrega debe ser una fecha futura' })
        return
      }
    }

    if (prioridad !== undefined && !PRIORIDADES_VALIDAS.includes(prioridad as Prioridad)) {
      res.status(400).json({ error: `prioridad inválida. Valores permitidos: ${PRIORIDADES_VALIDAS.join(', ')}` })
      return
    }

    const tarea = await repo.crearTarea({
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      usuarioCreador: usuarioCreador.trim(),
      fechaEntrega: fechaEntregaParsed,
      prioridad: prioridad as Prioridad | undefined,
      usuarioAsignado: usuarioAsignado as string | undefined,
    })

    console.log(`[${ts()}] Nueva tarea creada: "${tarea.titulo}" (id: ${tarea.id})`)
    res.status(201).json(tarea)
  } catch (err) {
    console.error(`[${ts()}] Error en crearTarea:`, err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export async function actualizarTarea(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id)
  try {
    const tarea = await repo.obtenerTareaPorId(id)
    if (!tarea) {
      res.status(404).json({ error: 'Tarea no encontrada' })
      return
    }

    const { titulo, descripcion, fechaEntrega, usuarioAsignado, prioridad } = req.body
    const datos: Record<string, unknown> = {}

    if (titulo !== undefined) {
      if (typeof titulo !== 'string' || titulo.trim() === '') {
        res.status(400).json({ error: 'titulo no puede estar vacío' })
        return
      }
      datos.titulo = titulo.trim()
    }

    if (descripcion !== undefined) {
      if (typeof descripcion !== 'string' || descripcion.trim() === '') {
        res.status(400).json({ error: 'descripcion no puede estar vacía' })
        return
      }
      datos.descripcion = descripcion.trim()
    }

    if (fechaEntrega !== undefined) {
      if (fechaEntrega === null) {
        datos.fechaEntrega = null
      } else {
        const fecha = new Date(fechaEntrega as string)
        if (isNaN(fecha.getTime())) {
          res.status(400).json({ error: 'fechaEntrega debe ser una fecha válida en formato ISO 8601' })
          return
        }
        if (fecha <= new Date()) {
          res.status(400).json({ error: 'fechaEntrega debe ser una fecha futura' })
          return
        }
        datos.fechaEntrega = fecha
      }
    }

    if (usuarioAsignado !== undefined) {
      datos.usuarioAsignado = usuarioAsignado === null ? null : String(usuarioAsignado)
    }

    if (prioridad !== undefined) {
      if (!PRIORIDADES_VALIDAS.includes(prioridad as Prioridad)) {
        res.status(400).json({ error: `prioridad inválida. Valores permitidos: ${PRIORIDADES_VALIDAS.join(', ')}` })
        return
      }
      datos.prioridad = prioridad as Prioridad
    }

    const tareaActualizada = await repo.actualizarTarea(id, datos)
    console.log(`[${ts()}] Tarea modificada (id: ${id})`)
    res.status(200).json(tareaActualizada)
  } catch (err) {
    console.error(`[${ts()}] Error en actualizarTarea (id: ${id}):`, err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export async function cambiarEstado(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id)
  try {
    const { estado } = req.body

    if (!estado) {
      res.status(400).json({ error: 'estado es obligatorio' })
      return
    }
    if (!ESTADOS_VALIDOS.includes(estado as Estado)) {
      res.status(400).json({ error: `estado inválido. Valores permitidos: ${ESTADOS_VALIDOS.join(', ')}` })
      return
    }

    const tarea = await repo.obtenerTareaPorId(id)
    if (!tarea) {
      res.status(404).json({ error: 'Tarea no encontrada' })
      return
    }

    const tareaActualizada = await repo.cambiarEstado(id, estado as Estado)
    console.log(`[${ts()}] Tarea ${id} cambió estado a: ${estado}`)
    res.status(200).json(tareaActualizada)
  } catch (err) {
    console.error(`[${ts()}] Error en cambiarEstado (id: ${id}):`, err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export async function eliminarTarea(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id)
  try {
    const tarea = await repo.obtenerTareaPorId(id)
    if (!tarea) {
      res.status(404).json({ error: 'Tarea no encontrada' })
      return
    }
    await repo.eliminarTarea(id)
    console.log(`[${ts()}] Tarea eliminada (id: ${id})`)
    res.status(204).send()
  } catch (err) {
    console.error(`[${ts()}] Error en eliminarTarea (id: ${id}):`, err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}
