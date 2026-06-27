# Sistema de Soporte a la Decisión

MVP para la gestión inteligente de solicitudes especiales de inscripción. Procesa archivos Excel en el navegador, anonimiza el RUT y entrega reglas de filtrado, patrones recurrentes de topes y proyecciones de sobrecupo.

## Funcionalidades

- **Módulo 1:** clasifica solicitudes, calcula KPI 1 y prioriza la revisión manual por `Prioridad Académica` descendente.
- **Cupos y restricciones:** cruza NRC, cupos, inscritos, disponibles, carreras restringidas y observaciones desde el Excel principal o un archivo opcional.
- **Detalle de topes:** muestra NRC solicitado, NRC en conflicto, curso, tipo de reunión, día/hora y estado de evidencia.
- **Módulo 2:** detecta pares recurrentes y valida cada par como `Clase verificada`, `Actividad no clase` o `Sin evidencia` usando el horario.
- **Módulo 3:** proyecta solicitudes por regresión lineal y recomienda cursos para sobrecupo.
- **Exportación:** genera un Excel con prioridad, evidencia de topes, cupos, restricciones, validación de clase y KPIs.
- **Persistencia opcional:** guarda ejecuciones, resúmenes y decisiones anonimizadas en PostgreSQL mediante una API Express.

## Archivos de entrada

| Archivo | Obligatorio | Columnas relevantes |
|---|---:|---|
| Solicitudes | Sí | RUT/RUN, NRC, Error Categoría, Error, Carrera, Catalogo, Nombre del Curso, Estado opcional, Prioridad opcional |
| Catálogo PE | No | NRC, CURSO |
| Horario | No | NRC, TIPO DE REUNION, TITULO y columnas por día |
| Cupos/restricciones | No | NRC, Cupos, Inscritos o Disponibles, Carrera Restringida, Observaciones |

Se aceptan `Prioridad Académica`, `Prioridad Academica` o `Prioridad`. Un número mayor representa una prioridad mayor. Si no existe prioridad o un archivo opcional, el flujo anterior sigue funcionando.

## Requisitos

- Node.js 20 o superior
- npm
- PostgreSQL 14 o superior, solo para persistencia

## Instalación local

```bash
npm install
cp .env.example .env.local
npm run dev
```

El frontend queda disponible normalmente en `http://localhost:5173`.

Para usar persistencia, cree la base indicada en `DATABASE_URL` y ejecute la API en otra terminal:

```bash
set -a
source .env.local
set +a
npm run server
```

La API crea sus tablas automáticamente. Sin `VITE_API_URL`, el frontend funciona igual y solo deshabilita el botón **Guardar ejecución**.

## Comandos

```bash
npm run dev      # frontend Vite
npm run server   # API Express
npm test         # pruebas unitarias
npm run build    # build de producción
npm run preview  # previsualización del build
```

## API

- `GET /api/health`: estado de la API y persistencia.
- `POST /api/runs`: guarda una ejecución con KPIs, resúmenes y decisiones anonimizadas.
- `GET /api/runs`: lista las 50 ejecuciones recientes.
- `GET /api/runs/:id`: recupera el resumen y las decisiones de una ejecución.

La base usa `analysis_runs`, `analysis_results` y `analysis_decisions`. No se envían ni almacenan RUT reales.

## Despliegue en Render

`render.yaml` declara tres recursos: sitio estático `ia-mvp`, servicio Node `ia-mvp-api` y PostgreSQL `ia-mvp-db`.

1. En el frontend configure `VITE_API_URL` con la URL pública del servicio API.
2. En la API configure `CORS_ORIGIN` con la URL pública del frontend.
3. `DATABASE_URL` se obtiene automáticamente desde la base declarada en el Blueprint.

## Estructura

```text
src/components/       interfaz y dashboard
src/utils/            parsing, análisis, exportación y cliente API
server/               API Express y acceso PostgreSQL
tests/                datasets sintéticos y pruebas unitarias
render.yaml           infraestructura Render
```

## KPIs

- **KPI 1:** coincidencias de rechazo con coordinadora / rechazos sugeridos × 100. Objetivo ≥ 90%.
- **KPI 2:** pares de NRC presentes en dos o más períodos. Objetivo ≥ 15 pares. La validación de clase es una capa adicional y no cambia el KPI histórico.
- **KPI 3:** cursos cuya proyección del próximo período es ≥ 3 solicitudes, con al menos tres solicitudes históricas y dos períodos. Objetivo ≥ 6 cursos.
