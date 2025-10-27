<div align="center">
  <img src="docs/header.png" alt="MiSalud - Módulo de Precios" width="800">
</div>

# MiSalud · Módulo de Precios (MVP)

[![CI](https://github.com/bgcorrea/misalud-precios-mvp/actions/workflows/ci.yml/badge.svg)](https://github.com/bgcorrea/misalud-precios-mvp/actions/workflows/ci.yml)

Proyecto académico que entrega un demo funcional del módulo de precios de MiSalud: cálculo de CPP ponderado (incluye fragmentados), regla de “terminado en 90”, semáforo parametrizable por categoría, auditoría completa y gestión de listas base.

## Estructura principal

- `app/`: servicio Express + lógica de dominio (TypeScript) y CLI administrativa (`scripts/`).
- `db/`: esquemas y semillas para SQLite (demo) y SQL Server corporativo.
- `docs/`: UML (`uml.puml` + `uml.png`), matriz de trazabilidad, metodología y OpenAPI (`openapi.yaml`).
- `report/`: informe 1 página en Markdown + script de exportación a PDF.
- `tests/`: pruebas unitarias y de API (Jest + Supertest).
- `.tooling/`: utilidades (`make_demo.sh`, `selfcheck.sh`).
- `Dockerfile`, `docker-compose.yml`, `Makefile`, `.env.example`.

## Configuración rápida

```bash
cd misalud-precios-mvp/app
npm install
cp ../.env.example ../.env    # Ajusta valores según el entorno
npm start                      # Levanta API en http://localhost:3000 y UI en /ui
```

Variables soportadas (ver `.env.example`):
- `PORT`, `HOST`
- `DEMO_ALLOW_ALL` (permite rutas administrativas sin cabecera `x-role`)
- `CSV_DEFAULT_SEP`
- `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`

La base SQLite (`app/data/misalud_demo.sqlite`) se genera automáticamente con datos relativos a la fecha actual (últimos 7/30/90 días).

### Script “todo en uno”

```bash
cd misalud-precios-mvp
./.tooling/make_demo.sh
```

Instala dependencias (modo demo), reinicia la base, inicia la API en `http://localhost:3000` y abre la SPA.

### Reiniciar/sembra la base demo

```bash
cd misalud-precios-mvp/app
npx tsx scripts/admin.ts reset-demo
```

> Los seeds utilizan funciones relativas (`DATE('now', ...)`), por lo que los históricos siempre cubren 7/30/90 días.

## Endpoints relevantes

| Método & Ruta | Descripción | Notas |
|---------------|-------------|-------|
| `GET /api/health` | Estado del servicio | Devuelve `{ ok, service, ts }` |
| `GET /api/productos` | Paginado con CPP, márgenes y semáforo | `pageSize` limitado a `[1,100]` |
| `PUT /api/productos/{id}/precio-propuesto` | Edita precio dentro del rango autorizado | Valida porcentaje y registra log |
| `GET /api/productos/{id}/historico` | Últimas compras/ventas (7-30-90 días) | Datos relativos a la fecha actual |
| `GET /api/parametros` | Lista márgenes/umbrales vigentes | |
| `PUT /api/parametros/{categoriaId}` | Actualiza parámetros (Gerencia) | Validación de rangos y log `update_parametros` |
| `POST /api/listas/generar` | Genera lista base con correlativo `001+` | Protegido por middleware de rol + rate limit |
| `GET /api/listas/vigente` | Devuelve lista vigente | 404 si no existe |
| `GET /api/listas/{id}/descargar?sep=;` | Descarga CSV con separador configurable | Nombre `lista_{id}_{YYYYMMDD}.csv` |
| `GET /api/logs` | Auditoría reciente (limit ≤ 200) | Retorna `antes/despues` parseados |
| `GET /api/logs/{entidad}/{id}` | Historial de una entidad específica | útil para seguimiento de cambios |

Documentación ampliada en `docs/openapi.yaml` (`npm run api:validate`).

## Pruebas y autoverificación

```bash
cd misalud-precios-mvp/app
npm test                      # Unitarias + API (Jest + Supertest)

cd ..
./.tooling/selfcheck.sh       # Smoke test: endpoints clave, logs y artefactos
# o simplemente
make selfcheck
```

`selfcheck.sh` verifica:
- `/api/parametros` (200)
- Listado de productos (mínimo un registro)
- Generación y descarga de listas base
- Validación de precios (dentro y fuera de rango)
- Presencia de artefactos (`report/aptc105_s4_apellidonombre.pdf`, `docs/uml.*`, `docs/matriz_trazabilidad.csv`)

## Cómo validar cumplimiento

```bash
cd misalud-precios-mvp
chmod +x .tooling/audit_check.sh   # primera vez
.tooling/audit_check.sh
```

El script ejecuta un smoke test completo sobre `http://localhost:3000`, valida los criterios RF/RNF clave y deposita la evidencia en `audit/evidencia/` (respuestas JSON, CSV y headers). El resumen con estatus (`summary.txt`) se usa como insumo para el informe `audit/auditoria_cumplimiento.md`, que consolida hallazgos y acciones sugeridas.

## Documentación e informes

- `report/export_to_pdf.sh`: genera el PDF solicitado; si dispone de `pdfinfo` y `aspell/hunspell`, valida longitud (≤1 página) y revisa ortografía ignorando IDs `RF-###`/`RNF-###`.
- `docs/openapi.yaml`: especificación OpenAPI. Validable vía `npm run api:validate` (usa `swagger-cli`).
- `docs/uml.puml` → `docs/uml.png`: generado con PlantUML (el script `make_demo.sh` no lo regenera automáticamente).

## Docker y Makefile

```bash
make build   # docker compose build
make run     # docker compose up -d (expone 3000)
make logs    # Follow logs del servicio
make stop    # docker compose down
```

El volumen `./app/data` queda montado para persistir la base SQLite en modo contenedor. Usa `.env` (copiado desde `.env.example`) para parametrizar el contenedor.

## CLI administrativa

```bash
cd misalud-precios-mvp/app
npx tsx scripts/admin.ts --help
```

Comandos disponibles:
- `reset-demo` — elimina y regenera la base SQLite con seeds recientes.
- `generar-lista [--usuario nombre]` — crea lista base vigente (equivalente al endpoint Gerencia).
- `listar-parametros` — muestra la configuración actual por categoría.
- `set-parametro --cat 1 --margen 0.28 --umbralRojo 22 --umbralAmarillo 8 --min -5 --max 5 [--usuario cli]` — actualiza parámetros con la misma validación de la API, generando log `update_parametros`.

## Portar a Laravel 7 + SQL Server

- **Modelo de datos**: `db/schema_mssql.sql` / `db/seed_mssql.sql` (usa `DATEADD` para fechas relativas, DECIMAL(18,4) para montos).
- **Conexión**: `.env` de Laravel con `DB_CONNECTION=sqlsrv`, `DB_HOST=...`, `DB_DATABASE=MiSalud`, `DB_USERNAME=...`, `DB_PASSWORD=...`.
- **Rutas sugeridas**:
  - `GET /precios` → `PrecioController@index`
  - `PUT /precios/{producto}/propuesto` → `PrecioController@updatePropuesto`
  - `GET /precios/{producto}/historico`
  - `POST /listas/generar`, `GET /listas/vigente`, `GET /listas/{id}/descargar`
  - `GET /parametros`, `PUT /parametros/{categoria}`
- **Servicios/Eloquent**: `Producto`, `Categoria`, `ParametroCategoria`, `ListaBase`, `ListaBaseItem`, `LogAuditoria`; servicio `PricingService` para CPP/semáforo/regla 90.
- **Jobs**: `RecalcularCppJob` ejecutado vía `php artisan schedule:run` (Windows Task Scheduler) para recalcular `ultimo_cpp` y `precio_sugerido`.
- **Auditoría**: eventos que persistan logs (`entidad`, `entidad_id`, `accion`, `datos_antes`, `datos_despues`).

## Mapa de requisitos ↔ componentes

| Requisito | Componente principal | Notas |
|-----------|---------------------|-------|
| RF-001 CPP ponderado | `app/src/domain/pricing.ts`, `app/src/jobs/nightly_cost_update.ts` | Normaliza fragmentados, recalcula CPP nocturno. |
| RF-002 Rango edición | `app/src/domain/params.ts`, `tests/pricing.spec.ts`, `app/src/ui/app.js` | Valida en backend y en UI (alertas). |
| RF-003 Semáforo parametrizable | `app/src/domain/pricing.ts`, `app/src/ui/app.js` | Umbrales por categoría + badge accesible. |
| RF-004/005 Listas base | `app/src/server.ts` (`/api/listas/*`), `db/*` | Correlativo 001+, CSV con separador configurable. |
| RF-006 Historial compras/ventas | `app/src/server.ts` (`/api/productos/:id/historico`) | Fechas dinámicas (7/30/90 días). |
| RF-007 Logs y auditoría | `app/src/server.ts` (helpers + `/api/logs`), `tests/api.spec.ts` | Antes/después en JSON, filtros por entidad. |
| RF-008 Job nocturno | `app/src/jobs/nightly_cost_update.ts` | Reutiliza dominio para recalcular sugeridos. |
| RNF-001 Performance | Paginación con límites (max 100), cálculos previos | Apto para datasets ≥1k. |
| RNF-002 Compatibilidad MSSQL | `db/schema_mssql.sql`, `db/seed_mssql.sql`, README sección Laravel | Tipos DECIMAL(18,4) y fechas con `DATEADD`. |
| RNF-003 Seguridad por rol | Middleware `app/src/middleware/auth.ts`, rate limiting admin | `DEMO_ALLOW_ALL` permite bypass controlado. |
| RNF-004 Auditoría persistente | Tabla `logs`, CLI/endpoint /logs, pruebas API | Acciones `update_precio_propuesto`, `update_parametros`, `generar_lista_base`. |
| RNF-005 UX & accesibilidad | `app/src/ui/index.html`, `app/src/ui/styles.css`, `app/src/ui/app.js` | Semáforo con `aria-label`, toasts, botón Gerencia deshabilitado. |

## Automatización y CI

- Workflow GitHub Actions (`.github/workflows/ci.yml`): `npm ci`, pruebas, validación OpenAPI y exportación PDF con `md-to-pdf`.
- `Makefile` + Docker facilitan entornos reproducibles.
- `report/export_to_pdf.sh` realiza chequeo de longitud y ortografía si hay herramientas disponibles.

## Notas adicionales

- `app/src/config.ts` centraliza la carga de `.env` (dotenv) y valores por defecto.
- `app/src/server.ts` aplica CORS por defecto, sanitiza entradas numéricas y usa middleware de errores uniforme (`middleware/error.ts`).
- `docs/matriz_trazabilidad.csv` enlaza RF ↔ Historias ↔ Pruebas; la versión resumida se referencia en el informe.
- `docs/uml.png` se genera ejecutando `java -jar plantuml.jar docs/uml.puml` (si PlantUML está instalado).
- Para ejecutar la CLI en contenedor Docker, usar `docker compose run --rm api npx tsx scripts/admin.ts ...`.

---

Equipo académico MiSalud · 2024-2025.
