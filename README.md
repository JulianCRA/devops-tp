# devops-tp

API REST de gestión de tareas con Node.js, Express, TypeScript y PostgreSQL.

## Stack

- **Backend:** Node.js + Express + TypeScript
- **Base de datos:** PostgreSQL con Prisma ORM
- **CI/CD:** GitHub Actions → Docker Hub → Render
- **Monitoreo:** OpenTelemetry + Grafana

## Links

| | |
|---|---|
| Repositorio | [GitHub](https://github.com/JulianCRA/devops-tp) |
| Imagen | [Docker Hub](https://hub.docker.com/repository/docker/jcrd3v/tareas-api) |
| API | [https://tareas-api-latest.onrender.com](https://tareas-api-latest.onrender.com) |
| Dashboard | [Grafana](https://devopstp.grafana.net/public-dashboards/eea3cb0b0f3b432eac2f4f549ac1e82a) |
| Informe | [Google Docs](https://docs.google.com/document/d/183GGVfyTlolX_2jr_HEI4dMmzI5hywQvOaBZHEu2sGk/edit?usp=sharing) |
| Presentación | [Canva](https://canva.link/y2mnq58oibjwf2h) |

## Pipeline CI/CD

El pipeline corre en GitHub Actions con cuatro etapas encadenadas:

| Etapa | Cuándo se ejecuta |
|---|---|
| **Tests** | En todo push a cualquier rama y en pull requests hacia `main` |
| **Build** | Después de que los tests pasan (en cualquier rama) |
| **Publicación** | Solo en `main`, después del build — sube la imagen a Docker Hub con el tag `latest` y, si el commit tiene un tag `vX.Y.Z`, también con ese número de versión |
| **Deploy** | Solo en `main` y solo cuando el commit tiene un tag `vX.Y.Z` — aplica migraciones en producción y dispara el redespliegue en Render |

En resumen: **cada push corre los tests**, pero solo los cambios en `main` publican una imagen nueva, y solo los commits con tag versionado producen un deploy a producción.

## Desarrollo local

```bash
npm install
npx prisma migrate dev
npm run dev
```

## Tests

```bash
npm test
```