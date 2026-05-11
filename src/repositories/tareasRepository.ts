import { PrismaClient, Estado, Prioridad, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

export interface FiltrosTareas {
  estado?: Estado
  usuarioAsignado?: string
}

export interface CrearTareaDTO {
  titulo: string
  descripcion: string
  usuarioCreador: string
  fechaEntrega?: Date
  prioridad?: Prioridad
  usuarioAsignado?: string
}

export interface ActualizarTareaDTO {
  titulo?: string
  descripcion?: string
  fechaEntrega?: Date | null
  usuarioAsignado?: string | null
  prioridad?: Prioridad
}

async function listarTareas(filtros: FiltrosTareas = {}) {
  const where: Prisma.TareaWhereInput = {}
  if (filtros.estado !== undefined) where.estado = filtros.estado
  if (filtros.usuarioAsignado !== undefined) where.usuarioAsignado = filtros.usuarioAsignado
  return prisma.tarea.findMany({ where, orderBy: { fechaCreacion: 'desc' } })
}

async function obtenerTareaPorId(id: string) {
  return prisma.tarea.findUnique({ where: { id } })
}

async function crearTarea(datos: CrearTareaDTO) {
  return prisma.tarea.create({ data: datos })
}

async function actualizarTarea(id: string, datos: ActualizarTareaDTO) {
  return prisma.tarea.update({ where: { id }, data: datos })
}

async function cambiarEstado(id: string, estado: Estado) {
  return prisma.tarea.update({ where: { id }, data: { estado } })
}

async function eliminarTarea(id: string) {
  return prisma.tarea.delete({ where: { id } })
}

async function verificarConexion() {
  await prisma.$queryRaw`SELECT 1`
}

export default {
  listarTareas,
  obtenerTareaPorId,
  crearTarea,
  actualizarTarea,
  cambiarEstado,
  eliminarTarea,
  verificarConexion,
}
