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

beforeEach(() => {
  jest.clearAllMocks()
})

describe('GET /salud', () => {
  it('responde 200 con estado ok', async () => {
    const res = await request(app).get('/salud')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ estado: 'ok' })
  })
})

describe('GET /listo', () => {
  it('responde 200 cuando la DB está conectada', async () => {
    ;(repo.verificarConexion as jest.Mock).mockResolvedValueOnce(undefined)
    const res = await request(app).get('/listo')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ listo: true, db: 'conectada' })
  })

  it('responde 503 cuando la DB no está disponible', async () => {
    ;(repo.verificarConexion as jest.Mock).mockRejectedValueOnce(new Error('DB down'))
    const res = await request(app).get('/listo')
    expect(res.status).toBe(503)
    expect(res.body).toEqual({ listo: false, db: 'no disponible' })
  })
})
