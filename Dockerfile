# ─── ETAPA 1: BUILD ──────────────────────────────────────────────────────────
# Usamos una imagen base de Node 20 en Alpine (Linux minimalista, ~5MB).
# "AS builder" le da un nombre a esta etapa para referenciarla después.
# Esta etapa compila TypeScript y genera el cliente Prisma, pero NO va a
# producción — solo se usa para producir los artefactos finales.
FROM node:20-alpine AS builder

# Establece /app como directorio de trabajo dentro del contenedor.
# Todos los comandos siguientes se ejecutan desde acá.
WORKDIR /app

# Copia solo los manifiestos de dependencias primero.
# Truco de caché: si package.json no cambió, Docker reutiliza la capa
# del npm ci sin reinstalar nada, aunque el código fuente sí haya cambiado.
COPY package*.json ./

# Copia el schema de Prisma. Necesario antes de npm ci porque
# @prisma/client se auto-instala y necesita el schema para generarse.
COPY prisma/ ./prisma/

# Instala TODAS las dependencias (incluyendo devDependencies como typescript).
# npm ci es determinista: usa package-lock.json exacto, sin resolver versiones.
RUN npm ci

# Copia la configuración de TypeScript para que tsc sepa cómo compilar.
COPY tsconfig.json ./

# Copia el código fuente TypeScript.
COPY src/ ./src/

# Genera el cliente tipado de Prisma a partir del schema.
# Sin esto, los imports de @prisma/client fallarían al compilar.
RUN npx prisma generate

# Compila TypeScript → JavaScript en la carpeta dist/.
# Resultado: dist/server.js, dist/app.js, dist/controllers/, etc.
RUN npm run build


# ─── ETAPA 2: PRODUCCIÓN ─────────────────────────────────────────────────────
# Nueva imagen limpia: no hereda nada del builder (ni devDependencies,
# ni código fuente .ts, ni herramientas de compilación).
# Resultado: imagen final significativamente más pequeña y segura.
FROM node:20-alpine

WORKDIR /app

# Crea un grupo y usuario sin privilegios llamado "app".
# Correr como root dentro del contenedor es un riesgo de seguridad:
# si la app es comprometida, el atacante tendría acceso root al host.
RUN addgroup -S app && adduser -S app -G app

# Copia los manifiestos para instalar solo dependencias de producción.
COPY package*.json ./

# Copia el schema de Prisma — necesario para regenerar el cliente
# dentro de esta imagen limpia (el cliente no se copia del builder).
COPY prisma/ ./prisma/

# Instala solo dependencias de producción (sin jest, typescript, ts-node, etc.).
# --omit=dev reduce el tamaño de node_modules considerablemente.
RUN npm ci --omit=dev

# Regenera el cliente de Prisma en esta imagen de producción.
# No se puede copiar desde el builder porque está ligado a la arquitectura
# y binarios del sistema operativo de cada imagen.
RUN npx prisma generate

# Copia el JavaScript compilado desde la etapa builder.
# Este es el único código de la app que entra a la imagen final.
COPY --from=builder /app/dist ./dist

# Cambia al usuario sin privilegios antes de arrancar el proceso.
# A partir de acá, ningún comando ni el servidor corren como root.
USER app

# Documenta que el contenedor escucha en el puerto 3000.
# No abre el puerto por sí solo — eso lo hace `docker run -p` o Compose.
EXPOSE 3000

# Comando por defecto al iniciar el contenedor.
# Ejecuta el servidor compilado. Se usa la forma array (exec form) para
# que Node reciba las señales del SO directamente (SIGTERM para shutdown limpio).
CMD ["node", "dist/server.js"]
