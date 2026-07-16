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