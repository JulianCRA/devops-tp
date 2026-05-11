import { PrismaClient, Estado, Prioridad } from '@prisma/client'

const prisma = new PrismaClient()

const tareas = [
  { titulo: 'Configurar repositorio GitHub', descripcion: 'Crear repo, agregar .gitignore y README', estado: Estado.COMPLETADA, prioridad: Prioridad.ALTA, usuarioCreador: 'admin', usuarioAsignado: 'juan' },
  { titulo: 'Diseñar modelo de datos', descripcion: 'Definir entidades y relaciones del sistema', estado: Estado.COMPLETADA, prioridad: Prioridad.ALTA, usuarioCreador: 'admin', usuarioAsignado: 'maria' },
  { titulo: 'Implementar endpoints de tareas', descripcion: 'CRUD completo con validaciones', estado: Estado.COMPLETADA, prioridad: Prioridad.ALTA, usuarioCreador: 'juan', usuarioAsignado: 'juan' },
  { titulo: 'Escribir tests unitarios', descripcion: 'Cubrir todos los endpoints con Jest y Supertest', estado: Estado.EN_PROGRESO, prioridad: Prioridad.ALTA, usuarioCreador: 'admin', usuarioAsignado: 'maria' },
  { titulo: 'Crear Dockerfile', descripcion: 'Imagen multi-stage con usuario no root', estado: Estado.EN_PROGRESO, prioridad: Prioridad.MEDIA, usuarioCreador: 'admin', usuarioAsignado: 'pedro' },
  { titulo: 'Configurar Docker Compose', descripcion: 'Levantar API + PostgreSQL con health checks', estado: Estado.PENDIENTE, prioridad: Prioridad.MEDIA, usuarioCreador: 'admin', usuarioAsignado: 'pedro' },
  { titulo: 'Crear workflow de CI', descripcion: 'GitHub Actions con tests y build de imagen', estado: Estado.PENDIENTE, prioridad: Prioridad.ALTA, usuarioCreador: 'admin', usuarioAsignado: 'juan' },
  { titulo: 'Publicar imagen en Docker Hub', descripcion: 'Job de publish en el pipeline de CI', estado: Estado.PENDIENTE, prioridad: Prioridad.MEDIA, usuarioCreador: 'admin', usuarioAsignado: null },
  { titulo: 'Configurar Render para deploy', descripcion: 'Web service apuntando a imagen Docker', estado: Estado.PENDIENTE, prioridad: Prioridad.MEDIA, usuarioCreador: 'admin', usuarioAsignado: null },
  { titulo: 'Agregar secretos en GitHub', descripcion: 'DOCKERHUB_USERNAME, DOCKERHUB_TOKEN, RENDER_DEPLOY_HOOK_URL', estado: Estado.PENDIENTE, prioridad: Prioridad.ALTA, usuarioCreador: 'admin', usuarioAsignado: 'maria' },
  { titulo: 'Integrar New Relic', descripcion: 'Instalar SDK y configurar APM', estado: Estado.PENDIENTE, prioridad: Prioridad.BAJA, usuarioCreador: 'maria', usuarioAsignado: null },
  { titulo: 'Crear dashboard de métricas', descripcion: 'Throughput, tiempo de respuesta, tasa de errores', estado: Estado.PENDIENTE, prioridad: Prioridad.BAJA, usuarioCreador: 'maria', usuarioAsignado: 'maria' },
  { titulo: 'Configurar alerta de errores', descripcion: 'Alerta si tasa de errores supera el 5%', estado: Estado.PENDIENTE, prioridad: Prioridad.MEDIA, usuarioCreador: 'maria', usuarioAsignado: null },
  { titulo: 'Documentar endpoints en README', descripcion: 'Ejemplos de curl para cada endpoint', estado: Estado.CANCELADA, prioridad: Prioridad.BAJA, usuarioCreador: 'pedro', usuarioAsignado: 'pedro' },
  { titulo: 'Revisar vulnerabilidades de dependencias', descripcion: 'Ejecutar npm audit y resolver issues', estado: Estado.CANCELADA, prioridad: Prioridad.MEDIA, usuarioCreador: 'juan', usuarioAsignado: null },
  { titulo: 'Agregar paginación al listado', descripcion: 'Soporte para ?page= y ?limit= en GET /tareas', estado: Estado.PENDIENTE, prioridad: Prioridad.BAJA, usuarioCreador: 'juan', usuarioAsignado: null },
  { titulo: 'Validar migraciones en CI', descripcion: 'Ejecutar prisma migrate deploy antes de los tests', estado: Estado.EN_PROGRESO, prioridad: Prioridad.ALTA, usuarioCreador: 'admin', usuarioAsignado: 'juan' },
  { titulo: 'Configurar .dockerignore', descripcion: 'Excluir node_modules, .env, tests y coverage', estado: Estado.COMPLETADA, prioridad: Prioridad.BAJA, usuarioCreador: 'pedro', usuarioAsignado: 'pedro' },
  { titulo: 'Crear base de datos en Render', descripcion: 'PostgreSQL free tier para producción', estado: Estado.EN_PROGRESO, prioridad: Prioridad.ALTA, usuarioCreador: 'admin', usuarioAsignado: 'admin' },
  { titulo: 'Verificar deploy end-to-end', descripcion: 'Push a main y validar que la API responde en Render', estado: Estado.PENDIENTE, prioridad: Prioridad.ALTA, usuarioCreador: 'admin', usuarioAsignado: null },
]

async function main() {
  console.log('Insertando 20 tareas...')
  for (const tarea of tareas) {
    await prisma.tarea.create({ data: tarea })
  }
  console.log('Listo.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
