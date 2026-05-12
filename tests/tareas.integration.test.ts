/**
 * Integration tests — require a real PostgreSQL database.
 *
 * Run with: npm run test:integration
 * Needs DATABASE_URL pointing to a local DB (docker compose up db -d).
 *
 * These tests do NOT mock the repository. They hit the real DB engine
 * to verify that queries, filters, and constraints work end-to-end.
 */

import request from 'supertest'
import { PrismaClient } from '@prisma/client'
import app from '../src/app'

const prisma = new PrismaClient()

// Wipe the table before each test so tests are independent and order doesn't matter
beforeEach(async () => {
  await prisma.tarea.deleteMany()
})

afterAll(async () => {
  await prisma.tarea.deleteMany()
  await prisma.$disconnect()
})

// ─── POST /tareas ─────────────────────────────────────────────────────────────

describe('POST /tareas', () => {
  it('crea una tarea y la persiste en la DB', async () => {
    const res = await request(app).post('/tareas').send({
      titulo: 'Tarea integration',
      descripcion: 'Descripción real',
      usuarioCreador: 'admin',
    })

    expect(res.status).toBe(201)
    expect(res.body.id).toBeDefined()

    // Verify it actually exists in the DB — not just in memory
    const enDb = await prisma.tarea.findUnique({ where: { id: res.body.id } })
    expect(enDb).not.toBeNull()
    expect(enDb!.titulo).toBe('Tarea integration')
    expect(enDb!.estado).toBe('PENDIENTE') // default from schema
  })

  it('responde 400 sin titulo', async () => {
    const res = await request(app).post('/tareas').send({
      descripcion: 'Sin titulo',
      usuarioCreador: 'admin',
    })
    expect(res.status).toBe(400)

    // Nothing should have been inserted
    const count = await prisma.tarea.count()
    expect(count).toBe(0)
  })

  it('responde 400 sin usuarioCreador', async () => {
    const res = await request(app).post('/tareas').send({
      titulo: 'Sin creador',
      descripcion: 'Desc',
    })
    expect(res.status).toBe(400)
  })
})

// ─── GET /tareas ──────────────────────────────────────────────────────────────

describe('GET /tareas', () => {
  it('devuelve todas las tareas', async () => {
    await prisma.tarea.createMany({
      data: [
        { titulo: 'A', descripcion: 'd', usuarioCreador: 'x' },
        { titulo: 'B', descripcion: 'd', usuarioCreador: 'x' },
      ],
    })

    const res = await request(app).get('/tareas')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
  })

  it('filtra por estado', async () => {
    await prisma.tarea.createMany({
      data: [
        { titulo: 'Pendiente', descripcion: 'd', usuarioCreador: 'x', estado: 'PENDIENTE' },
        { titulo: 'Completada', descripcion: 'd', usuarioCreador: 'x', estado: 'COMPLETADA' },
      ],
    })

    const res = await request(app).get('/tareas?estado=PENDIENTE')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].titulo).toBe('Pendiente')
  })

  it('filtra por usuarioAsignado', async () => {
    await prisma.tarea.createMany({
      data: [
        { titulo: 'Asignada', descripcion: 'd', usuarioCreador: 'x', usuarioAsignado: 'juan' },
        { titulo: 'Sin asignar', descripcion: 'd', usuarioCreador: 'x' },
      ],
    })

    const res = await request(app).get('/tareas?usuarioAsignado=juan')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].titulo).toBe('Asignada')
  })
})

// ─── GET /tareas/:id ──────────────────────────────────────────────────────────

describe('GET /tareas/:id', () => {
  it('devuelve la tarea con el id correcto', async () => {
    const tarea = await prisma.tarea.create({
      data: { titulo: 'Mi tarea', descripcion: 'd', usuarioCreador: 'x' },
    })

    const res = await request(app).get(`/tareas/${tarea.id}`)
    expect(res.status).toBe(200)
    expect(res.body.id).toBe(tarea.id)
    expect(res.body.titulo).toBe('Mi tarea')
  })

  it('responde 404 para id inexistente', async () => {
    const res = await request(app).get('/tareas/id-que-no-existe')
    expect(res.status).toBe(404)
  })
})

// ─── PATCH /tareas/:id/estado ─────────────────────────────────────────────────

describe('PATCH /tareas/:id/estado', () => {
  it('cambia el estado y lo persiste en la DB', async () => {
    const tarea = await prisma.tarea.create({
      data: { titulo: 'T', descripcion: 'd', usuarioCreador: 'x', estado: 'PENDIENTE' },
    })

    const res = await request(app)
      .patch(`/tareas/${tarea.id}/estado`)
      .send({ estado: 'COMPLETADA' })

    expect(res.status).toBe(200)

    // Verify the change was actually written to the DB
    const enDb = await prisma.tarea.findUnique({ where: { id: tarea.id } })
    expect(enDb!.estado).toBe('COMPLETADA')
  })

  it('responde 400 con estado inválido', async () => {
    const tarea = await prisma.tarea.create({
      data: { titulo: 'T', descripcion: 'd', usuarioCreador: 'x' },
    })

    const res = await request(app)
      .patch(`/tareas/${tarea.id}/estado`)
      .send({ estado: 'INVENTADO' })

    expect(res.status).toBe(400)
  })

  it('responde 404 para id inexistente', async () => {
    const res = await request(app)
      .patch('/tareas/id-que-no-existe/estado')
      .send({ estado: 'COMPLETADA' })
    expect(res.status).toBe(404)
  })
})

// ─── DELETE /tareas/:id ───────────────────────────────────────────────────────

describe('DELETE /tareas/:id', () => {
  it('elimina la tarea y confirma que no existe en la DB', async () => {
    const tarea = await prisma.tarea.create({
      data: { titulo: 'Borrar', descripcion: 'd', usuarioCreador: 'x' },
    })

    const res = await request(app).delete(`/tareas/${tarea.id}`)
    expect(res.status).toBe(204)

    // Verify it's actually gone from the DB
    const enDb = await prisma.tarea.findUnique({ where: { id: tarea.id } })
    expect(enDb).toBeNull()
  })

  it('responde 404 para id inexistente', async () => {
    const res = await request(app).delete('/tareas/id-que-no-existe')
    expect(res.status).toBe(404)
  })
})

// ─── GET /listo ───────────────────────────────────────────────────────────────

describe('GET /listo', () => {
  it('responde 200 con db conectada cuando la DB está disponible', async () => {
    const res = await request(app).get('/listo')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ listo: true, db: 'conectada' })
  })
})
