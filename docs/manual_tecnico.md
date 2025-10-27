# Manual Técnico - Sistema de Precios MiSalud

**Versión:** 1.0
**Fecha:** Octubre 2025
**Destinatarios:** Equipo de Desarrollo y Administradores de Sistemas

---

## 1. Arquitectura del Sistema

### 1.1. Stack Tecnológico

| Componente | Tecnología | Versión |
|------------|------------|---------|
| **Runtime** | Node.js | 20.x LTS |
| **Lenguaje Backend** | TypeScript | 5.x |
| **Framework Web** | Express.js | 4.x |
| **Base de Datos (Demo)** | SQLite | 3.x |
| **Base de Datos (Producción)** | SQL Server | 2016+ |
| **ORM/Query Builder** | better-sqlite3 (demo) / Knex.js (recomendado para producción) | - |
| **Testing** | Jest + Supertest | 29.x |
| **Frontend** | Vanilla JS + Tailwind CSS | 3.x |
| **Gráficos** | Chart.js | 4.4.1 |

### 1.2. Arquitectura de Capas

```
┌────────────────────────────────────────┐
│          CAPA DE PRESENTACIÓN          │
│  (UI: HTML + Tailwind + Vanilla JS)    │
└────────────┬───────────────────────────┘
             │ HTTP/REST
┌────────────▼───────────────────────────┐
│       CAPA DE APLICACIÓN (API)         │
│       (Express + TypeScript)           │
│  - Routing (server.ts)                 │
│  - Middleware (auth, error, rate-limit)│
│  - Controllers (inline en server.ts)   │
└────────────┬───────────────────────────┘
             │
┌────────────▼───────────────────────────┐
│         CAPA DE DOMINIO                │
│  - pricing.ts (cálculos CPP, semáforo) │
│  - params.ts (validaciones)            │
│  - fragments.ts (productos fragmentados)│
└────────────┬───────────────────────────┘
             │
┌────────────▼───────────────────────────┐
│       CAPA DE PERSISTENCIA             │
│  - db.ts (conexión y reset)            │
│  - SQLite (demo) / SQL Server (prod)   │
└────────────────────────────────────────┘
```

### 1.3. Estructura de Directorios

```
misalud-precios-mvp/
├── app/                          # Aplicación principal
│   ├── src/
│   │   ├── server.ts             # Servidor Express + API endpoints
│   │   ├── config.ts             # Configuración (.env)
│   │   ├── db.ts                 # Conexión a base de datos
│   │   ├── domain/               # Lógica de negocio
│   │   │   ├── pricing.ts        # CPP, semáforo, regla 90
│   │   │   ├── params.ts         # Validación de parámetros
│   │   │   └── fragments.ts      # Productos fragmentados
│   │   ├── middleware/           # Middlewares Express
│   │   │   ├── auth.ts           # Control de roles
│   │   │   └── error.ts          # Manejo de errores
│   │   ├── jobs/                 # Procesos programados
│   │   │   └── nightly_cost_update.ts  # Job nocturno CPP
│   │   └── ui/                   # Frontend
│   │       ├── index-new.html    # UI principal (Tailwind)
│   │       ├── app-new.js        # Lógica JS
│   │       └── styles.css        # Estilos adicionales
│   ├── data/                     # Base de datos SQLite (demo)
│   ├── scripts/                  # CLI administrativa
│   │   └── admin.ts              # reset-demo, generar-lista, etc.
│   ├── package.json
│   └── tsconfig.json
├── db/                           # Esquemas y seeds
│   ├── schema_sqlite.sql         # Esquema SQLite (demo)
│   ├── seed_sqlite.sql           # Datos demo con fechas relativas
│   ├── schema_mssql.sql          # Esquema SQL Server (producción)
│   └── seed_mssql.sql            # Datos demo para SQL Server
├── tests/                        # Pruebas automatizadas
│   ├── api.spec.ts               # Tests de API (Supertest)
│   └── pricing.spec.ts           # Tests de lógica de negocio
├── docs/                         # Documentación
│   ├── openapi.yaml              # Especificación OpenAPI 3.0
│   ├── manual_operativo.md       # Manual para usuarios
│   ├── manual_tecnico.md         # Este documento
│   └── header.svg                # Logo para README
├── .tooling/                     # Scripts de desarrollo
│   ├── make_demo.sh              # Setup completo demo
│   └── selfcheck.sh              # Smoke tests
├── .env.example                  # Variables de entorno ejemplo
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── Makefile
└── README.md
```

---

## 2. Modelo de Datos

### 2.1. Diagrama Entidad-Relación

```
┌─────────────────┐       ┌──────────────────────┐
│   categorias    │       │ parametros_categoria │
├─────────────────┤       ├──────────────────────┤
│ id (PK)         │◄─────┤│ id (PK)              │
│ nombre          │       │ categoria_id (FK)    │
│ fragmentado     │       │ margen               │
│ created_at      │       │ umbral_rojo          │
└────────┬────────┘       │ umbral_amarillo      │
         │                │ rango_edicion_min    │
         │                │ rango_edicion_max    │
         │                └──────────────────────┘
         │
┌────────▼────────┐
│   productos     │
├─────────────────┤
│ id (PK)         │
│ codigo_interno  │◄──────────┐
│ codigo_barras   │           │
│ descripcion     │           │
│ categoria_id (FK)│          │
│ fragmentado     │           │
│ factor_fragmentacion│       │
│ precio_actual   │           │
│ precio_propuesto│           │
│ precio_sugerido │           │
│ ultimo_cpp      │           │
└────────┬────────┘           │
         │                    │
    ┌────┴────┐               │
    │         │               │
┌───▼───┐ ┌──▼────┐   ┌──────┴──────┐
│compras│ │ventas │   │ listas_base │
├───────┤ ├───────┤   ├─────────────┤
│id (PK)│ │id (PK)│   │ id (PK)     │
│producto_id(FK)│ │producto_id(FK)│ │ codigo      │
│fecha  │ │fecha  │   │ fecha_generacion│
│cantidad│ │cantidad│  │ vigente     │
│costo_total│ │precio_total│└──────┬──────┘
│unidad │ │unidad │          │
└───────┘ └───────┘     ┌────▼────────────────┐
                        │ listas_base_items   │
                        ├─────────────────────┤
                        │ id (PK)             │
                        │ lista_id (FK)       │
                        │ producto_id (FK)    │
                        │ precio_propuesto    │
                        │ margen_aplicado     │
                        └─────────────────────┘

┌───────────────┐
│     logs      │
├───────────────┤
│ id (PK)       │
│ fecha         │
│ usuario       │
│ rol           │
│ entidad       │
│ entidad_id    │
│ accion        │
│ datos_antes   │ ← JSON
│ datos_despues │ ← JSON
└───────────────┘
```

### 2.2. Tablas Principales

#### **categorias**
Almacena las categorías de medicamentos (Analgésicos, Antibióticos, etc.).

```sql
CREATE TABLE categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    fragmentado INTEGER NOT NULL DEFAULT 0,  -- 1 si aplica factor_fragmentacion
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

#### **productos**
Inventario completo de medicamentos.

```sql
CREATE TABLE productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo_interno TEXT NOT NULL UNIQUE,      -- Código interno MiSalud
    codigo_barras TEXT NOT NULL UNIQUE,       -- EAN-13
    descripcion TEXT NOT NULL,
    categoria_id INTEGER NOT NULL,
    fragmentado INTEGER NOT NULL DEFAULT 0,
    factor_fragmentacion REAL NOT NULL DEFAULT 1,  -- Ej: 24 (unidades por caja)
    precio_actual REAL NOT NULL,              -- Precio en POS actualmente
    precio_propuesto REAL,                    -- Precio editado por operador
    precio_sugerido REAL,                     -- Precio calculado por sistema
    ultimo_cpp REAL,                          -- CPP calculado más reciente
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);
```

#### **parametros_categoria**
Parámetros configurables por categoría (márgenes, umbrales).

```sql
CREATE TABLE parametros_categoria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    categoria_id INTEGER NOT NULL,
    margen REAL NOT NULL,                     -- Ej: 0.25 (25%)
    umbral_rojo REAL NOT NULL,                -- Ej: 20.0 (20%)
    umbral_amarillo REAL NOT NULL,            -- Ej: 5.0 (5%)
    rango_edicion_min REAL NOT NULL,          -- Ej: -5.0 (-5%)
    rango_edicion_max REAL NOT NULL,          -- Ej: 5.0 (+5%)
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);
```

#### **compras**
Histórico de compras a proveedores.

```sql
CREATE TABLE compras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    producto_id INTEGER NOT NULL,
    fecha TEXT NOT NULL,                      -- ISO 8601: 'YYYY-MM-DD'
    cantidad REAL NOT NULL,
    costo_total REAL NOT NULL,
    unidad TEXT NOT NULL,                     -- 'CAJA', 'UNIDAD', etc.
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);
```

#### **ventas**
Histórico de ventas en locales.

```sql
CREATE TABLE ventas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    producto_id INTEGER NOT NULL,
    fecha TEXT NOT NULL,
    cantidad REAL NOT NULL,
    precio_total REAL NOT NULL,
    unidad TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);
```

#### **listas_base**
Listas de precios generadas oficialmente.

```sql
CREATE TABLE listas_base (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT NOT NULL UNIQUE,              -- '001', '002', '003'...
    fecha_generacion TEXT NOT NULL,
    vigente INTEGER NOT NULL DEFAULT 1,       -- Solo una lista vigente a la vez
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

#### **listas_base_items**
Detalle de cada producto en una lista base.

```sql
CREATE TABLE listas_base_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lista_id INTEGER NOT NULL,
    producto_id INTEGER NOT NULL,
    precio_propuesto REAL NOT NULL,
    margen_aplicado REAL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lista_id) REFERENCES listas_base(id),
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);
```

#### **logs**
Auditoría completa de operaciones.

```sql
CREATE TABLE logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT NOT NULL,
    usuario TEXT NOT NULL,
    rol TEXT,
    entidad TEXT NOT NULL,                    -- 'producto', 'parametros', 'lista'
    entidad_id INTEGER,
    accion TEXT NOT NULL,                     -- 'update_precio_propuesto', etc.
    datos_antes TEXT,                         -- JSON
    datos_despues TEXT,                       -- JSON
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### 2.3. Índices

```sql
CREATE INDEX idx_productos_codigo_barras ON productos(codigo_barras);
CREATE INDEX idx_compras_producto_fecha ON compras(producto_id, fecha);
CREATE INDEX idx_ventas_producto_fecha ON ventas(producto_id, fecha);
```

---

## 3. API REST

### 3.1. Autenticación y Autorización

**Método:** Header `x-role`

```http
GET /api/productos
x-role: Operador
```

**Roles:**
- `Operador`: Lectura y edición limitada de precios
- `Gerencia`: Todos los permisos + generación de listas + modificación de parámetros

**Nota:** En producción, reemplazar con JWT o sesiones del sistema intranet Laravel.

### 3.2. Endpoints Principales

#### **GET /api/health**
Health check del servicio.

**Response:**
```json
{
  "ok": true,
  "service": "misalud-precios",
  "ts": "2025-10-26T15:30:00.000Z"
}
```

---

#### **GET /api/productos**
Listado paginado de productos con cálculos.

**Query Parameters:**
- `page` (number, default: 1)
- `pageSize` (number, 1-100, default: 25)
- `search` (string, opcional): Busca en código_interno, codigo_barras, descripcion
- `categoria` (string, opcional): Filtra por nombre de categoría
- `semaforo` (string, opcional): `VERDE`, `AMARILLO`, `ROJO`

**Headers:**
- `x-role`: `Operador` o `Gerencia`

**Response:**
```json
{
  "page": 1,
  "pageSize": 25,
  "total": 150,
  "data": [
    {
      "id": 1,
      "codigoInterno": "MED001",
      "codigoBarras": "7801234567890",
      "descripcion": "PARACETAMOL 500MG",
      "categoria": "Analgésicos",
      "fragmentado": false,
      "costoPromedio": 450.50,
      "precioActual": 990.00,
      "precioSugerido": 1190.00,
      "precioPropuesto": 1190.00,
      "margenAplicado": 0.30,
      "semaforo": "AMARILLO",
      "parametrosCategoria": {
        "margen": 0.30,
        "umbralRojo": 20,
        "umbralAmarillo": 5,
        "rangoEdicionMin": -5,
        "rangoEdicionMax": 5
      }
    }
  ]
}
```

---

#### **PUT /api/productos/:id/precio-propuesto**
Actualizar el precio propuesto de un producto (Operador).

**Headers:**
- `x-role`: `Operador` o `Gerencia`

**Body:**
```json
{
  "precioPropuesto": 1290,
  "usuario": "Juan Pérez"
}
```

**Validación:**
- El precio debe estar dentro del rango autorizado (rangoEdicionMin/Max)
- Se valida contra `precio_sugerido` del producto

**Response:**
```json
{
  "success": true,
  "message": "Precio actualizado correctamente",
  "data": {
    "id": 1,
    "precioPropuesto": 1290
  }
}
```

**Error (400):**
```json
{
  "error": "El nuevo precio queda -8.50% por debajo del permitido (-5%)."
}
```

---

#### **GET /api/productos/:id/historico**
Histórico de compras y ventas de un producto.

**Response:**
```json
{
  "compras": {
    "semana": [
      {
        "fecha": "2025-10-20",
        "cantidad": 100,
        "costo_total": 45000,
        "unidad": "UNIDAD"
      }
    ],
    "mes": [...],
    "trimestre": [...]
  },
  "ventas": {
    "semana": [
      {
        "fecha": "2025-10-20",
        "cantidad": 50,
        "precio_total": 59500,
        "unidad": "UNIDAD"
      }
    ],
    "mes": [...],
    "trimestre": [...]
  }
}
```

---

#### **GET /api/categorias**
Lista de categorías disponibles (para filtros).

**Response:**
```json
["Analgésicos", "Antibióticos", "Fragmentados", "Vitaminas"]
```

---

#### **GET /api/parametros**
Parámetros de todas las categorías.

**Response:**
```json
[
  {
    "categoriaId": 1,
    "categoriaNombre": "Analgésicos",
    "margen": 0.30,
    "umbralRojo": 20,
    "umbralAmarillo": 5,
    "rangoEdicionMin": -5,
    "rangoEdicionMax": 5
  }
]
```

---

#### **PUT /api/parametros/:categoriaId** (Gerencia)
Actualizar parámetros de una categoría.

**Headers:**
- `x-role`: `Gerencia`

**Body:**
```json
{
  "margen": 0.28,
  "umbralRojo": 22,
  "umbralAmarillo": 8,
  "rangoEdicionMin": -5,
  "rangoEdicionMax": 5,
  "usuario": "María González"
}
```

**Validaciones:**
- `margen` > 0
- `umbralRojo` > `umbralAmarillo` >= 0
- `rangoEdicionMin` < 0 < `rangoEdicionMax`

**Response:**
```json
{
  "success": true,
  "message": "Parámetros actualizados"
}
```

---

#### **POST /api/listas/generar** (Gerencia)
Generar nueva lista base.

**Headers:**
- `x-role`: `Gerencia`

**Body:**
```json
{
  "usuario": "María González"
}
```

**Lógica:**
1. Marca todas las listas actuales como `vigente = 0`
2. Genera nuevo código correlativo ('001', '002', ...)
3. Crea registro en `listas_base`
4. Inserta todos los productos con sus precios propuestos en `listas_base_items`
5. Registra log

**Response:**
```json
{
  "success": true,
  "lista": {
    "id": 3,
    "codigo": "003",
    "fecha_generacion": "2025-10-26",
    "vigente": true
  }
}
```

---

#### **GET /api/listas/vigente**
Obtener la lista vigente actual.

**Response:**
```json
{
  "id": 3,
  "codigo": "003",
  "fecha_generacion": "2025-10-26",
  "vigente": true
}
```

---

#### **GET /api/listas/:id/descargar**
Descargar lista en formato CSV.

**Query Parameters:**
- `sep` (string, default: `;`): Separador CSV (`,`, `;`, `|`)

**Response:**
```csv
codigo_interno;codigo_barras;descripcion;precio_propuesto
MED001;7801234567890;PARACETAMOL 500MG;1190
MED002;7801234567891;IBUPROFENO 400MG;1490
```

**Headers:**
```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="lista_003_20251026.csv"
```

---

#### **GET /api/logs**
Consultar logs de auditoría.

**Query Parameters:**
- `limit` (number, max: 200, default: 50)

**Response:**
```json
[
  {
    "id": 125,
    "fecha": "2025-10-26T15:30:00.000Z",
    "usuario": "Juan Pérez",
    "rol": "Operador",
    "entidad": "producto",
    "entidad_id": 1,
    "accion": "update_precio_propuesto",
    "datos_antes": {
      "precio_propuesto": 1190
    },
    "datos_despues": {
      "precio_propuesto": 1290
    }
  }
]
```

---

#### **GET /api/logs/:entidad/:id**
Logs de una entidad específica.

**Example:**
```
GET /api/logs/producto/1
```

---

### 3.3. Códigos de Estado HTTP

| Código | Uso |
|--------|-----|
| 200 | OK - Operación exitosa |
| 201 | Created - Recurso creado (lista base) |
| 400 | Bad Request - Datos inválidos |
| 403 | Forbidden - Rol insuficiente |
| 404 | Not Found - Recurso no encontrado |
| 429 | Too Many Requests - Rate limit excedido |
| 500 | Internal Server Error - Error del servidor |

---

## 4. Lógica de Negocio

### 4.1. Cálculo de Costo Promedio Ponderado (CPP)

**Archivo:** `app/src/domain/pricing.ts`

**Función:** `calcularCostoPromedioPonderado()`

**Fórmula:**
```typescript
CPP = Σ(costo_total) / Σ(cantidad_normalizada)
```

**Proceso:**
1. Obtener últimas 25 compras del producto
2. Para cada compra:
   - Si el producto NO es fragmentado: cantidad normalizada = cantidad
   - Si el producto SÍ es fragmentado: cantidad normalizada = cantidad × factor_fragmentacion
3. Sumar costos totales y cantidades normalizadas
4. Dividir: `CPP = total_costos / total_unidades`
5. Retornar con 4 decimales

**Ejemplo - Producto Fragmentado:**
```
Producto: ASPIRINA (se compra por caja de 24, se vende por unidad)
factor_fragmentacion = 24

Compra 1: 10 cajas a $12.000 c/u = $120.000
  → Unidades normalizadas: 10 × 24 = 240 unidades

Compra 2: 5 cajas a $11.500 c/u = $57.500
  → Unidades normalizadas: 5 × 24 = 120 unidades

CPP = ($120.000 + $57.500) / (240 + 120)
CPP = $177.500 / 360 = $493.06 por unidad
```

### 4.2. Aplicación de Margen

**Función:** `calcularPrecioSugerido()`

```typescript
precio_margen = CPP × (1 + margen)
```

**Ejemplo:**
```
CPP = $493.06
Margen de categoría = 30% (0.30)

precio_margen = $493.06 × 1.30 = $640.98
```

### 4.3. Regla "Terminado en 90"

**Función:** `aplicarReglaTerminadoEn90()`

**Algoritmo:**
```typescript
function aplicarReglaTerminadoEn90(valor: number): number {
  const base = Math.floor(valor);           // Parte entera
  const decimales = valor - base;           // Parte decimal

  if (decimales <= 0.40) {
    // Redondear hacia abajo
    const inferior = Math.max(base - 1, 0) + 0.90;
    return Number(inferior.toFixed(2));
  } else {
    // Redondear hacia arriba
    const superior = (decimales >= 0.90 ? base + 1 : base) + 0.90;
    return Number(superior.toFixed(2));
  }
}
```

**Casos de Prueba:**
```
Input: 640.98  → Output: 690.90  (0.98 > 0.40, sube al 90 superior)
Input: 640.30  → Output: 590.90  (0.30 ≤ 0.40, baja al 90 inferior)
Input: 640.90  → Output: 690.90  (ya termina en 90, sube)
Input: 12.40   → Output: 11.90   (0.40 es el límite, baja)
Input: 12.41   → Output: 12.90   (0.41 > límite, sube)
```

### 4.4. Cálculo de Semáforo

**Función:** `calcularSemaforo()`

**Lógica:**
```typescript
function calcularSemaforo(
  precioActual: number,
  precioPropuesto: number,
  parametros: CategoriaParametros
): Semaforo {
  // Regla absoluta: precio actual < propuesto → ROJO
  if (precioActual < precioPropuesto) {
    return "ROJO";
  }

  // Calcular diferencia porcentual
  const diferencia = ((precioActual - precioPropuesto) / precioActual) * 100;

  if (diferencia >= parametros.umbralRojo) {
    return "ROJO";       // Ej: diferencia >= 20%
  }

  if (diferencia >= parametros.umbralAmarillo) {
    return "AMARILLO";   // Ej: diferencia >= 5%
  }

  return "VERDE";        // Ej: diferencia < 5%
}
```

**Ejemplos:**
```
Caso 1:
  Precio Actual = $890
  Precio Propuesto = $1190
  → Resultado: ROJO (actual < propuesto, siempre rojo)

Caso 2:
  Precio Actual = $1490
  Precio Propuesto = $1190
  Diferencia = ((1490 - 1190) / 1490) × 100 = 20.13%
  Umbral Rojo = 20%
  → Resultado: ROJO (20.13% >= 20%)

Caso 3:
  Precio Actual = $1240
  Precio Propuesto = $1190
  Diferencia = ((1240 - 1190) / 1240) × 100 = 4.03%
  Umbral Amarillo = 5%
  → Resultado: VERDE (4.03% < 5%)
```

### 4.5. Validación de Rango de Edición

**Función:** `validarRangoEdicion()`

**Lógica:**
```typescript
function validarRangoEdicion(
  precioSugerido: number,
  precioNuevo: number,
  parametros: CategoriaParametros
): RangoValidacionResultado {
  const diferencia = precioNuevo - precioSugerido;
  const porcentaje = (diferencia / precioSugerido) * 100;

  if (porcentaje < parametros.rangoEdicionMin) {
    return {
      valido: false,
      mensaje: `El nuevo precio queda ${porcentaje.toFixed(2)}% por debajo del permitido (${parametros.rangoEdicionMin}%).`
    };
  }

  if (porcentaje > parametros.rangoEdicionMax) {
    return {
      valido: false,
      mensaje: `El nuevo precio supera el máximo autorizado (${parametros.rangoEdicionMax}%) en ${porcentaje.toFixed(2)}%.`
    };
  }

  return { valido: true };
}
```

**Ejemplo:**
```
Precio Sugerido = $1190
Rango Autorizado = -5% a +5%
  → Mínimo permitido: $1190 × 0.95 = $1130.50
  → Máximo permitido: $1190 × 1.05 = $1249.50

Validaciones:
  ✅ $1190 → Válido (sin cambio)
  ✅ $1240 → Válido (4.20% de aumento)
  ❌ $1100 → Inválido (-7.56%, excede -5%)
  ❌ $1290 → Inválido (+8.40%, excede +5%)
```

---

## 5. Jobs Programados

### 5.1. Job Nocturno de Actualización de CPP

**Archivo:** `app/src/jobs/nightly_cost_update.ts`

**Función:** `actualizarCostoYPreciosSugeridos()`

**Frecuencia:** Diario, 02:00 AM (configurar con cron o Windows Task Scheduler)

**Proceso:**
1. Obtener todos los productos
2. Para cada producto:
   a. Calcular CPP actual
   b. Aplicar margen de la categoría
   c. Aplicar regla "terminado en 90"
   d. Actualizar campos:
      - `ultimo_cpp`
      - `precio_sugerido`
      - `updated_at`
3. NO sobrescribir `precio_propuesto` (editado manualmente)
4. Registrar log de ejecución

**Comando Manual:**
```bash
npx tsx app/src/jobs/nightly_cost_update.ts
```

**Configuración Cron (Linux):**
```cron
0 2 * * * cd /var/www/misalud-precios && npx tsx app/src/jobs/nightly_cost_update.ts >> /var/log/misalud-job.log 2>&1
```

**Configuración Windows Task Scheduler:**
```xml
<Task>
  <Triggers>
    <CalendarTrigger>
      <StartBoundary>2025-01-01T02:00:00</StartBoundary>
      <ScheduleByDay>
        <DaysInterval>1</DaysInterval>
      </ScheduleByDay>
    </CalendarTrigger>
  </Triggers>
  <Actions>
    <Exec>
      <Command>npx</Command>
      <Arguments>tsx C:\www\misalud-precios\app\src\jobs\nightly_cost_update.ts</Arguments>
      <WorkingDirectory>C:\www\misalud-precios</WorkingDirectory>
    </Exec>
  </Actions>
</Task>
```

---

## 6. Instalación y Despliegue

### 6.1. Requisitos del Sistema

**Hardware (Recomendado):**
- CPU: 2 cores
- RAM: 4 GB
- Disco: 20 GB

**Software:**
- Node.js 20.x LTS
- npm 9.x+
- SQL Server 2016+ (producción) o SQLite 3.x (demo)

### 6.2. Instalación - Modo Demo (SQLite)

```bash
# Clonar repositorio
git clone https://github.com/bgcorrea/misalud-precios-mvp.git
cd misalud-precios-mvp

# Instalar dependencias
cd app
npm install

# Configurar variables de entorno
cp ../.env.example ../.env
# Editar .env según necesidad

# Inicializar base de datos demo
npx tsx scripts/admin.ts reset-demo

# Ejecutar tests
npm test

# Iniciar servidor
npm start

# Abrir navegador
# http://localhost:3000/ui
```

### 6.3. Variables de Entorno

**Archivo:** `.env` (copiar desde `.env.example`)

```ini
# Puerto del servidor
PORT=3000

# Host (0.0.0.0 para acceso externo, localhost solo local)
HOST=0.0.0.0

# Modo demo: permite bypass de autenticación
DEMO_ALLOW_ALL=true

# Separador CSV por defecto
CSV_DEFAULT_SEP=;

# Rate limiting (requests por ventana de tiempo)
RATE_LIMIT_WINDOW_MS=900000  # 15 minutos
RATE_LIMIT_MAX=100            # 100 requests

# Base de datos (producción)
DB_HOST=localhost
DB_PORT=1433
DB_USER=misalud_app
DB_PASSWORD=<strong_password>
DB_DATABASE=MiSalud
```

### 6.4. Despliegue con Docker

```bash
# Build
docker compose build

# Ejecutar
docker compose up -d

# Ver logs
docker compose logs -f

# Detener
docker compose down
```

**Archivo `docker-compose.yml`:**
```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./app/data:/app/data  # Persistir SQLite
    env_file:
      - .env
    restart: unless-stopped
```

### 6.5. Migración a SQL Server (Producción)

**Pasos:**

1. **Ejecutar esquema en SQL Server:**
```sql
-- En SQL Server Management Studio
USE MiSalud;
GO

-- Ejecutar contenido de db/schema_mssql.sql
-- Ejecutar contenido de db/seed_mssql.sql (opcional)
```

2. **Configurar conexión en código:**

Reemplazar `app/src/db.ts` con conexión a MSSQL usando `mssql` o `knex`:

```typescript
import mssql from 'mssql';

const config = {
  server: process.env.DB_HOST || 'localhost',
  database: process.env.DB_DATABASE || 'MiSalud',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

export async function getDbConnection() {
  return await mssql.connect(config);
}
```

3. **Adaptar queries:**
- SQLite usa `AUTOINCREMENT`, SQL Server usa `IDENTITY`
- SQLite usa `TEXT` para timestamps, SQL Server usa `DATETIME2`
- SQLite usa `DATE('now')`, SQL Server usa `GETDATE()`

4. **Instalar dependencias:**
```bash
npm install mssql
```

---

## 7. Testing

### 7.1. Estructura de Tests

**Archivos:**
- `tests/api.spec.ts`: Tests de API (endpoints)
- `tests/pricing.spec.ts`: Tests de lógica de negocio (cálculos)

### 7.2. Ejecutar Tests

```bash
cd app
npm test                    # Todos los tests
npm test -- api.spec.ts     # Solo tests de API
npm test -- pricing.spec.ts # Solo tests de pricing
npm test -- --coverage      # Con reporte de cobertura
```

### 7.3. Tests Clave

**Cobertura:**
- ✅ Cálculo de CPP (productos normales y fragmentados)
- ✅ Aplicación de margen
- ✅ Regla "terminado en 90" (casos borde)
- ✅ Cálculo de semáforo (todos los escenarios)
- ✅ Validación de rango de edición
- ✅ Endpoints de API (happy path y errores)
- ✅ Generación de listas base
- ✅ Auditoría (logs)

**Ejemplo de Test:**
```typescript
describe("Regla Terminado en 90", () => {
  test("redondea hacia abajo si decimales <= 0.40", () => {
    expect(aplicarReglaTerminadoEn90(123.40)).toBe(122.90);
    expect(aplicarReglaTerminadoEn90(123.30)).toBe(122.90);
  });

  test("redondea hacia arriba si decimales > 0.40", () => {
    expect(aplicarReglaTerminadoEn90(123.41)).toBe(123.90);
    expect(aplicarReglaTerminadoEn90(123.50)).toBe(123.90);
  });
});
```

---

## 8. CLI Administrativa

**Archivo:** `app/scripts/admin.ts`

### 8.1. Comandos Disponibles

#### **reset-demo**
Reinicia la base de datos con datos de prueba.

```bash
npx tsx scripts/admin.ts reset-demo
```

#### **generar-lista**
Genera una nueva lista base (equivalente a POST /api/listas/generar).

```bash
npx tsx scripts/admin.ts generar-lista --usuario "Admin CLI"
```

#### **listar-parametros**
Muestra los parámetros actuales de todas las categorías.

```bash
npx tsx scripts/admin.ts listar-parametros
```

#### **set-parametro**
Actualiza los parámetros de una categoría.

```bash
npx tsx scripts/admin.ts set-parametro \
  --cat 1 \
  --margen 0.28 \
  --umbralRojo 22 \
  --umbralAmarillo 8 \
  --min -5 \
  --max 5 \
  --usuario "Admin CLI"
```

---

## 9. Seguridad

### 9.1. Consideraciones

**Actualmente (Demo):**
- Autenticación por header `x-role` (sin validación real)
- Variable `DEMO_ALLOW_ALL` permite bypass completo

**Para Producción:**
- Integrar con sistema de autenticación del intranet Laravel
- Usar JWT o sesiones compartidas
- Implementar middleware de validación de permisos real
- Habilitar HTTPS/TLS
- Sanitizar todos los inputs (SQL injection, XSS)

### 9.2. Rate Limiting

**Configuración:** `app/src/middleware/rate-limit.ts`

```typescript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutos
  max: 100,                   // 100 requests
  message: "Demasiadas solicitudes, intente más tarde."
});
```

**Aplicado a:**
- POST /api/listas/generar
- PUT /api/parametros/:id

---

## 10. Monitoreo y Logs

### 10.1. Logs de Aplicación

**Salida:** `stdout` (capturar con `pm2` o `systemd`)

```bash
# Con PM2
pm2 start app/src/server.ts --name misalud-precios
pm2 logs misalud-precios

# Con systemd
journalctl -u misalud-precios -f
```

### 10.2. Logs de Auditoría

**Almacenados en:** Tabla `logs` de la base de datos

**Consultar:**
```sql
SELECT *
FROM logs
WHERE entidad = 'producto'
  AND fecha >= DATEADD(day, -7, GETDATE())
ORDER BY fecha DESC;
```

### 10.3. Métricas Recomendadas

- Tiempo de respuesta de endpoints
- Número de generaciones de listas por día
- Cantidad de ediciones de precio por operador
- Productos con semáforo rojo (alerta temprana)

---

## 11. Troubleshooting

### 11.1. Problemas Comunes

| Síntoma | Causa | Solución |
|---------|-------|----------|
| Tests fallan con "disk I/O error" | Archivos WAL de SQLite bloqueados | `rm -f app/data/*.sqlite*` y volver a ejecutar |
| Puerto 3000 ya en uso | Otro servicio usando el puerto | Cambiar `PORT` en `.env` o detener servicio conflictivo |
| "No se encontraron parámetros para categoría X" | BD sin seeds | Ejecutar `npx tsx scripts/admin.ts reset-demo` |
| Gráficos crecen infinitamente | Bug de Chart.js sin contenedor fijo | Ya corregido en HU-01 (contenedor con `height: 200px`) |

### 11.2. Depuración

**Habilitar logs detallados:**
```bash
DEBUG=* npm start
```

**Inspeccionar BD SQLite:**
```bash
sqlite3 app/data/misalud_demo.sqlite
.tables
SELECT * FROM productos LIMIT 5;
.quit
```

---

## 12. Roadmap y Mejoras Futuras

### 12.1. Optimizaciones de Performance

1. **Caché de Cálculos:**
   - Implementar Redis para cachear CPP y semáforos
   - Invalidar caché solo cuando hay nuevas compras

2. **Índices Adicionales:**
   ```sql
   CREATE INDEX idx_productos_categoria ON productos(categoria_id);
   CREATE INDEX idx_logs_fecha ON logs(fecha);
   ```

3. **Vista Materializada para Semáforo:**
   - Precalcular semáforo en una tabla auxiliar
   - Refrescar con trigger o job

### 12.2. Funcionalidades Nuevas

1. **Exportar a Excel:**
   - Usar biblioteca `exceljs` para generar `.xlsx`

2. **Notificaciones:**
   - Email automático cuando >50% productos en rojo
   - Alertas al generar lista base

3. **Dashboards:**
   - Gráficos de tendencia de precios (Chart.js)
   - Análisis de márgenes por categoría

4. **Integración con ERP:**
   - API para sincronizar compras/ventas en tiempo real

---

## 13. Referencias

### 13.1. Documentación Externa

- **Express.js:** https://expressjs.com/
- **TypeScript:** https://www.typescriptlang.org/docs/
- **better-sqlite3:** https://github.com/WiseLibs/better-sqlite3
- **Jest:** https://jestjs.io/docs/getting-started
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Chart.js:** https://www.chartjs.org/docs/

### 13.2. Documentación Interna

- **Manual Operativo:** `docs/manual_operativo.md`
- **OpenAPI Spec:** `docs/openapi.yaml`
- **README:** `README.md`

---

## Anexos

### Anexo A: Esquema Completo SQL Server

Ver archivo: `db/schema_mssql.sql`

### Anexo B: Matriz de Trazabilidad

Ver archivo: `docs/matriz_trazabilidad.csv`

---

**Fin del Manual Técnico**

*Documento elaborado por: Equipo de Desarrollo - MiSalud*
*Última actualización: Octubre 2025*
*Versión: 1.0*
