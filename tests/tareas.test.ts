import request from 'supertest'
import app from '../src/app'

jest.mock('../src/repositories/tareasRepository', () => ({
  __esModule: true,
  default: {
    listarTareas: jest.fn(),
    obtenerTareaPorId: jest.fn(),
    crearTarea: jest.fn(),
    actualizarTarea: jest.fn(),
    cambiarEstado: jest.fn(),
    eliminarTarea: jest.fn(),
    verificarConexion: jest.fn(),
  },
}))

import repo from '../src/repositories/tareasRepository'

const tareaEjemplo = {
  id: 'uuid-001',
  titulo: 'Tarea de prueba',
  descripcion: 'Descripción de prueba',
  fechaCreacion: new Date().toISOString(),
  fechaEntrega: null,
  estado: 'PENDIENTE',
  prioridad: 'MEDIA',
  usuarioCreador: 'admin',
  usuarioAsignado: null,
  actualizadaEn: new Date().toISOString(),
}

const fechaFutura = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

beforeEach(() => {
  jest.clearAllMocks()
})

// ─── GET /tareas ─────────────────────────────────────────────────────────────

describe('GET /tareas', () => {
  it('responde 200 con un array de tareas', async () => {
    ;(repo.listarTareas as jest.Mock).mockResolvedValueOnce([tareaEjemplo])
    const res = await request(app).get('/tareas')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body).toHaveLength(1)
  })

  it('filtra por estado y devuelve solo las tareas con ese estado', async () => {
    ;(repo.listarTareas as jest.Mock).mockResolvedValueOnce([tareaEjemplo])
    const res = await request(app).get('/tareas?estado=PENDIENTE')
    expect(res.status).toBe(200)
    expect(repo.listarTareas).toHaveBeenCalledWith(
      expect.objectContaining({ estado: 'PENDIENTE' }),
    )
  })

  it('responde 400 si el estado del filtro es inválido', async () => {
    const res = await request(app).get('/tareas?estado=INVALIDO')
    expect(res.status).toBe(400)
  })

  it('filtra por usuarioAsignado', async () => {
    ;(repo.listarTareas as jest.Mock).mockResolvedValueOnce([tareaEjemplo])
    const res = await request(app).get('/tareas?usuarioAsignado=admin')
    expect(res.status).toBe(200)
    expect(repo.listarTareas).toHaveBeenCalledWith(
      expect.objectContaining({ usuarioAsignado: 'admin' }),
    )
  })

  it('responde 500 si el repositorio lanza un error', async () => {
    ;(repo.listarTareas as jest.Mock).mockRejectedValueOnce(new Error('DB error'))
    const res = await request(app).get('/tareas')
    expect(res.status).toBe(500)
  })
})

// ─── GET /tareas/:id ─────────────────────────────────────────────────────────

describe('GET /tareas/:id', () => {
  it('responde 200 con la tarea cuando el id existe', async () => {
    ;(repo.obtenerTareaPorId as jest.Mock).mockResolvedValueOnce(tareaEjemplo)
    const res = await request(app).get('/tareas/uuid-001')
    expect(res.status).toBe(200)
    expect(res.body.id).toBe('uuid-001')
  })

  it('responde 404 cuando el id no existe', async () => {
    ;(repo.obtenerTareaPorId as jest.Mock).mockResolvedValueOnce(null)
    const res = await request(app).get('/tareas/no-existe')
    expect(res.status).toBe(404)
  })

  it('responde 500 si el repositorio lanza un error', async () => {
    ;(repo.obtenerTareaPorId as jest.Mock).mockRejectedValueOnce(new Error('DB error'))
    const res = await request(app).get('/tareas/uuid-001')
    expect(res.status).toBe(500)
  })
})

// ─── POST /tareas ─────────────────────────────────────────────────────────────

describe('POST /tareas', () => {
  it('responde 201 con la tarea creada cuando los campos son válidos', async () => {
    ;(repo.crearTarea as jest.Mock).mockResolvedValueOnce(tareaEjemplo)
    const res = await request(app).post('/tareas').send({
      titulo: 'Nueva tarea',
      descripcion: 'Descripción válida',
      usuarioCreador: 'admin',
    })
    expect(res.status).toBe(201)
    expect(repo.crearTarea).toHaveBeenCalledTimes(1)
  })

  it('responde 201 con fecha de entrega futura válida', async () => {
    ;(repo.crearTarea as jest.Mock).mockResolvedValueOnce({
      ...tareaEjemplo,
      fechaEntrega: fechaFutura,
    })
    const res = await request(app).post('/tareas').send({
      titulo: 'Tarea con fecha',
      descripcion: 'Con fecha de entrega',
      usuarioCreador: 'admin',
      fechaEntrega: fechaFutura,
    })
    expect(res.status).toBe(201)
  })

  it('responde 400 si falta el titulo', async () => {
    const res = await request(app).post('/tareas').send({
      descripcion: 'Sin título',
      usuarioCreador: 'admin',
    })
    expect(res.status).toBe(400)
  })

  it('responde 400 si falta el usuarioCreador', async () => {
    const res = await request(app).post('/tareas').send({
      titulo: 'Sin creador',
      descripcion: 'Descripción',
    })
    expect(res.status).toBe(400)
  })

  it('responde 400 si falta la descripcion', async () => {
    const res = await request(app).post('/tareas').send({
      titulo: 'Sin descripción',
      usuarioCreador: 'admin',
    })
    expect(res.status).toBe(400)
  })

  it('responde 400 si la prioridad es inválida', async () => {
    const res = await request(app).post('/tareas').send({
      titulo: 'Tarea',
      descripcion: 'Descripción',
      usuarioCreador: 'admin',
      prioridad: 'URGENTE',
    })
    expect(res.status).toBe(400)
  })

  it('responde 400 si la fechaEntrega no es una fecha válida', async () => {
    const res = await request(app).post('/tareas').send({
      titulo: 'Tarea',
      descripcion: 'Descripción',
      usuarioCreador: 'admin',
      fechaEntrega: 'no-es-una-fecha',
    })
    expect(res.status).toBe(400)
  })

  it('responde 400 si la fechaEntrega es una fecha pasada', async () => {
    const res = await request(app).post('/tareas').send({
      titulo: 'Tarea',
      descripcion: 'Descripción',
      usuarioCreador: 'admin',
      fechaEntrega: '2020-01-01T00:00:00.000Z',
    })
    expect(res.status).toBe(400)
  })

  it('responde 500 si el repositorio lanza un error', async () => {
    ;(repo.crearTarea as jest.Mock).mockRejectedValueOnce(new Error('DB error'))
    const res = await request(app).post('/tareas').send({
      titulo: 'Tarea',
      descripcion: 'Descripción',
      usuarioCreador: 'admin',
    })
    expect(res.status).toBe(500)
  })
})

// ─── PATCH /tareas/:id ────────────────────────────────────────────────────────

describe('PATCH /tareas/:id', () => {
  it('responde 200 actualizando titulo y descripcion', async () => {
    const tareaActualizada = { ...tareaEjemplo, titulo: 'Nuevo título', descripcion: 'Nueva desc' }
    ;(repo.obtenerTareaPorId as jest.Mock).mockResolvedValueOnce(tareaEjemplo)
    ;(repo.actualizarTarea as jest.Mock).mockResolvedValueOnce(tareaActualizada)
    const res = await request(app).patch('/tareas/uuid-001').send({
      titulo: 'Nuevo título',
      descripcion: 'Nueva desc',
    })
    expect(res.status).toBe(200)
    expect(res.body.titulo).toBe('Nuevo título')
  })

  it('responde 200 actualizando usuarioAsignado a null', async () => {
    const tareaActualizada = { ...tareaEjemplo, usuarioAsignado: null }
    ;(repo.obtenerTareaPorId as jest.Mock).mockResolvedValueOnce(tareaEjemplo)
    ;(repo.actualizarTarea as jest.Mock).mockResolvedValueOnce(tareaActualizada)
    const res = await request(app).patch('/tareas/uuid-001').send({ usuarioAsignado: null })
    expect(res.status).toBe(200)
  })

  it('responde 200 actualizando fechaEntrega a null', async () => {
    const tareaActualizada = { ...tareaEjemplo, fechaEntrega: null }
    ;(repo.obtenerTareaPorId as jest.Mock).mockResolvedValueOnce(tareaEjemplo)
    ;(repo.actualizarTarea as jest.Mock).mockResolvedValueOnce(tareaActualizada)
    const res = await request(app).patch('/tareas/uuid-001').send({ fechaEntrega: null })
    expect(res.status).toBe(200)
  })

  it('responde 200 actualizando fechaEntrega con una fecha futura válida', async () => {
    const tareaActualizada = { ...tareaEjemplo, fechaEntrega: fechaFutura }
    ;(repo.obtenerTareaPorId as jest.Mock).mockResolvedValueOnce(tareaEjemplo)
    ;(repo.actualizarTarea as jest.Mock).mockResolvedValueOnce(tareaActualizada)
    const res = await request(app).patch('/tareas/uuid-001').send({ fechaEntrega: fechaFutura })
    expect(res.status).toBe(200)
  })

  it('responde 404 si la tarea no existe', async () => {
    ;(repo.obtenerTareaPorId as jest.Mock).mockResolvedValueOnce(null)
    const res = await request(app).patch('/tareas/no-existe').send({ titulo: 'X' })
    expect(res.status).toBe(404)
  })

  it('responde 400 si el titulo está vacío', async () => {
    ;(repo.obtenerTareaPorId as jest.Mock).mockResolvedValueOnce(tareaEjemplo)
    const res = await request(app).patch('/tareas/uuid-001').send({ titulo: '   ' })
    expect(res.status).toBe(400)
  })

  it('responde 400 si la descripcion está vacía', async () => {
    ;(repo.obtenerTareaPorId as jest.Mock).mockResolvedValueOnce(tareaEjemplo)
    const res = await request(app).patch('/tareas/uuid-001').send({ descripcion: '' })
    expect(res.status).toBe(400)
  })

  it('responde 400 si la fechaEntrega no es una fecha válida', async () => {
    ;(repo.obtenerTareaPorId as jest.Mock).mockResolvedValueOnce(tareaEjemplo)
    const res = await request(app).patch('/tareas/uuid-001').send({ fechaEntrega: 'no-es-fecha' })
    expect(res.status).toBe(400)
  })

  it('responde 400 si la fechaEntrega es una fecha pasada', async () => {
    ;(repo.obtenerTareaPorId as jest.Mock).mockResolvedValueOnce(tareaEjemplo)
    const res = await request(app).patch('/tareas/uuid-001').send({ fechaEntrega: '2020-01-01T00:00:00.000Z' })
    expect(res.status).toBe(400)
  })

  it('responde 400 si la prioridad es inválida', async () => {
    ;(repo.obtenerTareaPorId as jest.Mock).mockResolvedValueOnce(tareaEjemplo)
    const res = await request(app).patch('/tareas/uuid-001').send({ prioridad: 'URGENTE' })
    expect(res.status).toBe(400)
  })

  it('responde 200 actualizando con una prioridad válida', async () => {
    const tareaActualizada = { ...tareaEjemplo, prioridad: 'ALTA' }
    ;(repo.obtenerTareaPorId as jest.Mock).mockResolvedValueOnce(tareaEjemplo)
    ;(repo.actualizarTarea as jest.Mock).mockResolvedValueOnce(tareaActualizada)
    const res = await request(app).patch('/tareas/uuid-001').send({ prioridad: 'ALTA' })
    expect(res.status).toBe(200)
    expect(res.body.prioridad).toBe('ALTA')
  })

  it('responde 200 actualizando usuarioAsignado con un valor no nulo', async () => {
    const tareaActualizada = { ...tareaEjemplo, usuarioAsignado: 'usuario1' }
    ;(repo.obtenerTareaPorId as jest.Mock).mockResolvedValueOnce(tareaEjemplo)
    ;(repo.actualizarTarea as jest.Mock).mockResolvedValueOnce(tareaActualizada)
    const res = await request(app).patch('/tareas/uuid-001').send({ usuarioAsignado: 'usuario1' })
    expect(res.status).toBe(200)
    expect(res.body.usuarioAsignado).toBe('usuario1')
  })

  it('responde 500 si el repositorio lanza un error', async () => {
    ;(repo.obtenerTareaPorId as jest.Mock).mockRejectedValueOnce(new Error('DB error'))
    const res = await request(app).patch('/tareas/uuid-001').send({ titulo: 'X' })
    expect(res.status).toBe(500)
  })
})

// ─── PATCH /tareas/:id/estado ─────────────────────────────────────────────────

describe('PATCH /tareas/:id/estado', () => {
  it('responde 200 con la tarea actualizada cuando el estado es válido', async () => {
    const tareaActualizada = { ...tareaEjemplo, estado: 'EN_PROGRESO' }
    ;(repo.obtenerTareaPorId as jest.Mock).mockResolvedValueOnce(tareaEjemplo)
    ;(repo.cambiarEstado as jest.Mock).mockResolvedValueOnce(tareaActualizada)
    const res = await request(app).patch('/tareas/uuid-001/estado').send({ estado: 'EN_PROGRESO' })
    expect(res.status).toBe(200)
    expect(res.body.estado).toBe('EN_PROGRESO')
  })

  it('responde 400 si el estado es inválido', async () => {
    const res = await request(app).patch('/tareas/uuid-001/estado').send({ estado: 'VOLANDO' })
    expect(res.status).toBe(400)
  })

  it('responde 400 si no se envía el estado', async () => {
    const res = await request(app).patch('/tareas/uuid-001/estado').send({})
    expect(res.status).toBe(400)
  })

  it('responde 404 cuando el id no existe', async () => {
    ;(repo.obtenerTareaPorId as jest.Mock).mockResolvedValueOnce(null)
    const res = await request(app).patch('/tareas/no-existe/estado').send({ estado: 'COMPLETADA' })
    expect(res.status).toBe(404)
  })

  it('responde 500 si el repositorio lanza un error', async () => {
    ;(repo.obtenerTareaPorId as jest.Mock).mockRejectedValueOnce(new Error('DB error'))
    const res = await request(app).patch('/tareas/uuid-001/estado').send({ estado: 'COMPLETADA' })
    expect(res.status).toBe(500)
  })
})

// ─── DELETE /tareas/:id ───────────────────────────────────────────────────────

describe('DELETE /tareas/:id', () => {
  it('responde 204 cuando la tarea existe', async () => {
    ;(repo.obtenerTareaPorId as jest.Mock).mockResolvedValueOnce(tareaEjemplo)
    ;(repo.eliminarTarea as jest.Mock).mockResolvedValueOnce(tareaEjemplo)
    const res = await request(app).delete('/tareas/uuid-001')
    expect(res.status).toBe(204)
  })

  it('responde 404 cuando el id no existe', async () => {
    ;(repo.obtenerTareaPorId as jest.Mock).mockResolvedValueOnce(null)
    const res = await request(app).delete('/tareas/no-existe')
    expect(res.status).toBe(404)
  })

  it('responde 500 si el repositorio lanza un error', async () => {
    ;(repo.obtenerTareaPorId as jest.Mock).mockRejectedValueOnce(new Error('DB error'))
    const res = await request(app).delete('/tareas/uuid-001')
    expect(res.status).toBe(500)
  })
})

// ─── POST /tareas — strings con solo espacios ─────────────────────────────────

describe('POST /tareas — whitespace-only strings', () => {
  it('responde 400 si el titulo contiene solo espacios', async () => {
    const res = await request(app).post('/tareas').send({
      titulo: '   ',
      descripcion: 'Descripción',
      usuarioCreador: 'admin',
    })
    expect(res.status).toBe(400)
  })

  it('responde 400 si la descripcion contiene solo espacios', async () => {
    const res = await request(app).post('/tareas').send({
      titulo: 'Tarea',
      descripcion: '   ',
      usuarioCreador: 'admin',
    })
    expect(res.status).toBe(400)
  })

  it('responde 400 si el usuarioCreador contiene solo espacios', async () => {
    const res = await request(app).post('/tareas').send({
      titulo: 'Tarea',
      descripcion: 'Descripción',
      usuarioCreador: '   ',
    })
    expect(res.status).toBe(400)
  })
})

// ─── PATCH /tareas/:id — 500 cuando actualizarTarea lanza error ───────────────

describe('PATCH /tareas/:id — error en actualizarTarea', () => {
  it('responde 500 si actualizarTarea lanza un error tras encontrar la tarea', async () => {
    ;(repo.obtenerTareaPorId as jest.Mock).mockResolvedValueOnce(tareaEjemplo)
    ;(repo.actualizarTarea as jest.Mock).mockRejectedValueOnce(new Error('DB error'))
    const res = await request(app).patch('/tareas/uuid-001').send({ titulo: 'Nuevo' })
    expect(res.status).toBe(500)
  })
})

// ─── PATCH /tareas/:id/estado — 500 cuando cambiarEstado lanza error ──────────

describe('PATCH /tareas/:id/estado — error en cambiarEstado', () => {
  it('responde 500 si cambiarEstado lanza un error tras encontrar la tarea', async () => {
    ;(repo.obtenerTareaPorId as jest.Mock).mockResolvedValueOnce(tareaEjemplo)
    ;(repo.cambiarEstado as jest.Mock).mockRejectedValueOnce(new Error('DB error'))
    const res = await request(app).patch('/tareas/uuid-001/estado').send({ estado: 'COMPLETADA' })
    expect(res.status).toBe(500)
  })
})
