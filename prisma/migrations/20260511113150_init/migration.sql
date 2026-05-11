-- CreateEnum
CREATE TYPE "Estado" AS ENUM ('PENDIENTE', 'EN_PROGRESO', 'COMPLETADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "Prioridad" AS ENUM ('BAJA', 'MEDIA', 'ALTA');

-- CreateTable
CREATE TABLE "Tarea" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaEntrega" TIMESTAMP(3),
    "estado" "Estado" NOT NULL DEFAULT 'PENDIENTE',
    "prioridad" "Prioridad" NOT NULL DEFAULT 'MEDIA',
    "usuarioCreador" TEXT NOT NULL,
    "usuarioAsignado" TEXT,
    "actualizadaEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tarea_pkey" PRIMARY KEY ("id")
);
