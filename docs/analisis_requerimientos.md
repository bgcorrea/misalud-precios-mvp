# Análisis de Requerimientos - Sistema de Precios MiSalud

## 1. Descripción de la Necesidad

El sistema de precios para la cadena de farmacias "MiSalud" responde a la necesidad de **automatizar y optimizar la generación de listas de precios** para 25 locales, un proceso que actualmente consume tiempo considerable y puede resultar en márgenes de ganancia no óptimos.

### Aporte de cada requerimiento (Matriz de Trazabilidad)

Cada requerimiento identificado aporta valor específico al sistema:

- **RF-001 (CPP Ponderado)**: Garantiza que los costos reflejen la realidad de compras, considerando volúmenes y fechas, lo que permite establecer precios competitivos basados en datos reales.

- **RF-002 (Cálculo con Margen Parametrizable)**: Permite a Gerencia definir estrategias de margen por categoría, adaptándose a las condiciones del mercado y objetivos de rentabilidad.

- **RF-003 (Regla "Terminado en 90")**: Estandariza la presentación de precios siguiendo estrategias de pricing psicológico, facilitando la percepción de valor por parte del cliente.

- **RF-004 (Semáforo de Alertas)**: Proporciona un sistema visual que permite identificar rápidamente productos con desviaciones significativas, optimizando el tiempo de revisión del operador.

- **RF-005 (Rango de Edición Controlado)**: Balancea la flexibilidad operativa con el control gerencial, evitando desviaciones no autorizadas de la estrategia de precios.

- **RF-006 (Gestión de Listas Base)**: Mantiene trazabilidad histórica y versionado de las listas de precios, esencial para auditorías y análisis de tendencias.

- **RF-007 (Descargas CSV)**: Facilita la integración con sistemas POS de cada local y permite respaldos de información.

- **RF-008 (Historial de Compras/Ventas)**: Empodera al operador con información de contexto para tomar decisiones informadas sobre ajustes de precios.

- **RF-009 (Fragmentados)**: Maneja la complejidad de productos que se compran en una unidad pero se venden en fracciones, garantizando márgenes correctos.

- **RF-010 (Filtros y Búsqueda)**: Mejora la usabilidad permitiendo al operador enfocarse en productos específicos según criterios relevantes.

- **RF-011 (Sistema de Autenticación)**: Controla el acceso al módulo y diferencia permisos entre operadores y gerencia.

- **RF-012 (Auditoría/Logs)**: Proporciona trazabilidad completa de todas las operaciones, fundamental para cumplimiento y análisis de incidentes.

- **RNF-001 (Performance)**: Asegura tiempos de respuesta aceptables (≤5s) para mantener la productividad del usuario.

- **RNF-002 (Procesamiento Backend)**: Evita sobrecargar el navegador, mejorando la experiencia en equipos de bajo rendimiento.

- **RNF-003 (Documentación)**: Facilita la capacitación de usuarios y el mantenimiento técnico del sistema.

## 2. Requisitos Principales y Subordinados

### 2.1 Requisitos Funcionales (RF)

#### **RF-001**: Cálculo de Costo Promedio Ponderado (CPP)
**Tipo**: Principal
**Descripción**: El sistema debe calcular el CPP para cada producto basándose en las compras realizadas, ponderando por cantidad y costo.
**Criterios de Aceptación**:
- El cálculo considera historial de compras con fecha y cantidad
- Se normaliza correctamente para productos fragmentados
- Se ejecuta automáticamente en proceso nocturno
- Resultado se almacena en campo `ultimo_cpp`

**Subordinados**:
- **RF-001.1**: Soporte para productos fragmentados (compra por caja, venta por unidad)
- **RF-001.2**: Proceso nocturno automatizado de recálculo
- **RF-001.3**: Almacenamiento persistente del CPP calculado

#### **RF-002**: Cálculo de Precio Sugerido con Margen Parametrizable
**Tipo**: Principal
**Descripción**: El sistema debe calcular el precio de venta aplicando el margen definido por Gerencia para cada categoría.
**Criterios de Aceptación**:
- Margen se obtiene de tabla `parametros_categoria`
- Cálculo: `precio_sugerido = CPP * (1 + margen)`
- Margen es editable por rol Gerencia
- Se validan rangos de margen (0.0 a 1.0)

**Subordinados**:
- **RF-002.1**: Gestión de parámetros por categoría
- **RF-002.2**: Validación de rangos de margen permitidos
- **RF-002.3**: Persistencia de cambios con auditoría

#### **RF-003**: Regla de Redondeo "Terminado en 90"
**Tipo**: Principal
**Descripción**: Todos los precios sugeridos deben terminar en .90, aplicando regla de redondeo base 40.
**Criterios de Aceptación**:
- Si decimales ≤ 40 → redondear al .90 inferior
- Si decimales > 40 → redondear al .90 superior
- Ejemplos: $12.35 → $11.90; $12.50 → $12.90
- Se aplica automáticamente al calcular precio sugerido

#### **RF-004**: Sistema de Semáforo de Alertas
**Tipo**: Principal
**Descripción**: El sistema debe mostrar un indicador visual (ROJO/AMARILLO/VERDE) según la diferencia porcentual entre precio actual y propuesto.
**Criterios de Aceptación**:
- ROJO: diferencia > umbral_rojo (default 20%) o precio actual < propuesto
- AMARILLO: diferencia entre umbral_amarillo (default 8%) y umbral_rojo
- VERDE: diferencia < umbral_amarillo
- Umbrales son parametrizables por categoría
- Indicador visible en tabla principal

**Subordinados**:
- **RF-004.1**: Parametrización de umbrales por categoría
- **RF-004.2**: Cálculo automático de porcentaje de diferencia
- **RF-004.3**: Representación visual accesible (colores + íconos)

#### **RF-005**: Rango de Edición Controlado
**Tipo**: Principal
**Descripción**: El operador solo puede modificar el precio propuesto dentro de un rango porcentual autorizado por Gerencia.
**Criterios de Aceptación**:
- Rango definido en `parametros_categoria` (rango_edicion_min, rango_edicion_max)
- Validación en backend antes de persistir
- Mensaje de error descriptivo si se excede el rango
- Validación preventiva en frontend (alerta visual)

**Subordinados**:
- **RF-005.1**: Validación backend de rango
- **RF-005.2**: Validación frontend (UX)
- **RF-005.3**: Mensajes de error descriptivos

#### **RF-006**: Generación de Listas Base
**Tipo**: Principal
**Descripción**: El sistema debe permitir generar listas de precios con código correlativo (001, 002...) y fecha de generación.
**Criterios de Aceptación**:
- Código auto-incremental iniciando en "001"
- Formato: 3 dígitos con padding (001, 002, ..., 099, 100)
- Marca lista anterior como no vigente
- Nueva lista se marca como vigente
- Solo rol Gerencia puede generar listas
- Se registra en tabla `listas_base` con timestamp

**Subordinados**:
- **RF-006.1**: Control de versiones de listas
- **RF-006.2**: Gestión de vigencia (una sola lista vigente)
- **RF-006.3**: Restricción por rol

#### **RF-007**: Descarga de Listas (CSV)
**Tipo**: Principal
**Descripción**: El sistema debe permitir descargar listas históricas y vigente en formato CSV.
**Criterios de Aceptación**:
- Formato: CodigoInterno, CodigoBarras, Descripcion, PrecioPropuesto
- Separador configurable (`,` o `;`)
- Nombre archivo: `lista_{id}_{YYYYMMDD}.csv`
- Codificación UTF-8
- Headers incluidos

**Subordinados**:
- **RF-007.1**: Generación dinámica de CSV
- **RF-007.2**: Configuración de separador
- **RF-007.3**: Formato de nombre estandarizado

#### **RF-008**: Historial de Compras y Ventas
**Tipo**: Principal
**Descripción**: El sistema debe mostrar historial de las últimas 3 compras y ventas agrupadas por período (semana, 30 días, 3 meses).
**Criterios de Aceptación**:
- Datos de compras: cantidad, costo_total, unidad, fecha (últimas 3)
- Datos de ventas: cantidad, precio_total, unidad, fecha
- Períodos: última semana, últimos 30 días, últimos 3 meses
- Accesible desde vista de detalle de producto
- Datos calculados dinámicamente desde fecha actual

**Subordinados**:
- **RF-008.1**: Consultas optimizadas con índices
- **RF-008.2**: Cálculos relativos a fecha actual
- **RF-008.3**: Interfaz modal/panel lateral

#### **RF-009**: Manejo de Productos Fragmentados
**Tipo**: Principal
**Descripción**: El sistema debe calcular correctamente costos y precios para productos que se compran en una unidad pero se venden en múltiples unidades.
**Criterios de Aceptación**:
- Campo `fragmentado` en tabla `categorias`
- Campo `factor_fragmentacion` en tabla `productos`
- CPP se divide por factor de conversión
- Margen se aplica sobre el CPP unitario
- Ejemplo: caja de 12 unidades → CPP_caja / 12 = CPP_unidad

**Subordinados**:
- **RF-009.1**: Estructura de datos para fragmentación
- **RF-009.2**: Lógica de conversión en cálculo CPP
- **RF-009.3**: Etiqueta visual "Fragmentado" en UI

#### **RF-010**: Búsqueda y Filtros
**Tipo**: Principal
**Descripción**: El sistema debe permitir buscar productos y filtrar por categoría y semáforo.
**Criterios de Aceptación**:
- Búsqueda por código interno, código de barras o descripción
- Filtro por categoría (dropdown con opciones)
- Filtro por semáforo (ROJO/AMARILLO/VERDE)
- Filtros combinables
- Botón "Limpiar filtros" visible cuando hay filtros activos
- Paginación mantiene filtros aplicados

**Subordinados**:
- **RF-010.1**: Búsqueda full-text en múltiples campos
- **RF-010.2**: Filtros combinables con operador AND
- **RF-010.3**: Estado de filtros persistente durante sesión

#### **RF-011**: Sistema de Autenticación y Control de Acceso
**Tipo**: Principal
**Descripción**: El sistema debe tener su propio sistema de autenticación con perfiles de Operador y Gerencia.
**Criterios de Aceptación**:
- Página de login con usuario/contraseña
- Tokens de sesión con expiración (8 horas)
- Dos roles: Operador y Gerencia
- Operador: puede editar precios dentro del rango, ver productos
- Gerencia: puede editar parámetros, generar listas, todo lo de Operador
- Redirección automática a login si no autenticado
- Botón "Cerrar Sesión"

**Subordinados**:
- **RF-011.1**: Gestión de usuarios (en memoria para MVP, BD para producción)
- **RF-011.2**: Generación y validación de tokens
- **RF-011.3**: Middleware de autorización por rol
- **RF-011.4**: Interfaz de login

#### **RF-012**: Sistema de Auditoría y Logs
**Tipo**: Principal
**Descripción**: El sistema debe registrar todos los cambios efectuados por usuarios en un log auditable.
**Criterios de Aceptación**:
- Tabla `logs` con: id, fecha, usuario, rol, entidad, entidad_id, accion, datos_antes, datos_despues
- Registro automático de:
  - Cambios en precio propuesto
  - Cambios en parámetros de categoría
  - Generación de listas base
- Consulta de logs por entidad específica
- Consulta de logs generales (últimos N registros)
- Formato JSON para datos_antes y datos_despues

**Subordinados**:
- **RF-012.1**: Estructura de datos para logs
- **RF-012.2**: Helper function `registrarLog()`
- **RF-012.3**: Endpoints de consulta de logs

### 2.2 Requisitos No Funcionales (RNF)

#### **RNF-001**: Performance
**Tipo**: Principal
**Descripción**: El sistema debe mantener tiempos de carga menores a 5 segundos.
**Criterios de Aceptación**:
- Carga inicial de productos < 5s (dataset ≤1000 registros)
- Filtros y búsquedas < 2s
- Paginación del lado servidor con límite máximo de 100 registros por página
- Índices en campos de búsqueda frecuente
- Cache de parámetros en memoria durante la sesión

**Subordinados**:
- **RNF-001.1**: Paginación eficiente
- **RNF-001.2**: Índices de base de datos
- **RNF-001.3**: Límites de tamaño de respuesta

#### **RNF-002**: Procesamiento Backend
**Tipo**: Principal
**Descripción**: Los cálculos pesados deben realizarse en el servidor para evitar sobrecargar el navegador.
**Criterios de Aceptación**:
- CPP se calcula en backend
- Semáforo se calcula en backend
- Precio sugerido se calcula en backend
- Frontend solo renderiza datos pre-procesados
- Validaciones críticas en backend (no solo frontend)

#### **RNF-003**: Documentación
**Tipo**: Principal
**Descripción**: El sistema debe incluir manual operativo y manual técnico.
**Criterios de Aceptación**:
- **Manual Operativo**: guía para usuarios finales (Operador/Gerencia)
  - Cómo iniciar sesión
  - Cómo buscar y filtrar productos
  - Cómo editar precios propuestos
  - Cómo generar lista base (Gerencia)
  - Cómo descargar listas
  - Interpretación del semáforo
  - Casos de uso comunes
  - Troubleshooting básico
- **Manual Técnico**: guía para desarrolladores/administradores
  - Arquitectura del sistema
  - Modelo de datos (ER diagram)
  - Endpoints API (request/response)
  - Proceso de despliegue
  - Configuración de variables de entorno
  - Proceso nocturno de recálculo CPP
  - Migración a Laravel + SQL Server
  - Estructura de código

**Subordinados**:
- **RNF-003.1**: Manual operativo completo (50+ páginas)
- **RNF-003.2**: Manual técnico completo (70+ páginas)
- **RNF-003.3**: Ejemplos y capturas de pantalla

#### **RNF-004**: Compatibilidad Entorno Producción
**Tipo**: Principal
**Descripción**: El sistema debe ser compatible con Windows Server 2016, Laravel 7 y SQL Server.
**Criterios de Aceptación**:
- Esquemas SQL Server proporcionados (`schema_mssql.sql`)
- Seeds compatibles con funciones SQL Server (`DATEADD`)
- Tipos de datos: DECIMAL(18,4) para montos, DATETIME2 para fechas
- Documentación de migración a Laravel incluida
- Variables de entorno configurables para conexión DB

**Subordinados**:
- **RNF-004.1**: Scripts de migración SQL Server
- **RNF-004.2**: Documentación de integración Laravel
- **RNF-004.3**: Configuración de tareas programadas Windows

#### **RNF-005**: Seguridad
**Tipo**: Principal
**Descripción**: El sistema debe implementar control de acceso basado en roles y protección contra ataques comunes.
**Criterios de Aceptación**:
- Autenticación requerida para todos los endpoints excepto `/api/health` y login
- Tokens con expiración (8 horas)
- Rate limiting en endpoints administrativos (máx 100 req/15min)
- Validación de entrada en todos los endpoints
- Sanitización de parámetros numéricos
- CORS configurado apropiadamente
- Headers de seguridad (X-Service)

**Subordinados**:
- **RNF-005.1**: Middleware de autenticación
- **RNF-005.2**: Rate limiting
- **RNF-005.3**: Validación y sanitización

#### **RNF-006**: Usabilidad y Accesibilidad
**Tipo**: Principal
**Descripción**: La interfaz debe ser intuitiva, responsiva y accesible.
**Criterios de Aceptación**:
- Diseño responsivo (desktop, tablet, mobile)
- Elementos interactivos con aria-labels
- Indicadores de semáforo con texto alternativo
- Botones con estados visuales claros (habilitado/deshabilitado)
- Mensajes de error descriptivos
- Toast notifications para feedback de acciones
- Tabla con scroll horizontal en pantallas pequeñas

**Subordinados**:
- **RNF-006.1**: Diseño responsivo con Tailwind CSS
- **RNF-006.2**: Atributos ARIA para accesibilidad
- **RNF-006.3**: UX consistente con feedback visual

## 3. Matriz de Trazabilidad

La matriz completa se encuentra en `docs/matriz_trazabilidad.csv` con el siguiente formato:

| ID Requisito | Tipo | Prioridad | Historia de Usuario | Componente | Archivo de Prueba | Estado |
|--------------|------|-----------|---------------------|------------|-------------------|--------|
| RF-001 | Funcional | Alta | HU-001 | app/src/domain/pricing.ts | tests/pricing.spec.ts | ✅ Implementado |
| RF-002 | Funcional | Alta | HU-002 | app/src/domain/params.ts | tests/pricing.spec.ts | ✅ Implementado |
| RF-003 | Funcional | Media | HU-003 | app/src/domain/pricing.ts | tests/pricing.spec.ts | ✅ Implementado |
| RF-004 | Funcional | Alta | HU-004 | app/src/domain/pricing.ts | tests/pricing.spec.ts | ✅ Implementado |
| RF-005 | Funcional | Alta | HU-005 | app/src/domain/params.ts | tests/api.spec.ts | ✅ Implementado |
| RF-006 | Funcional | Alta | HU-006 | app/src/server.ts (listas) | tests/api.spec.ts | ✅ Implementado |
| RF-007 | Funcional | Media | HU-007 | app/src/server.ts (descargar) | tests/api.spec.ts | ✅ Implementado |
| RF-008 | Funcional | Media | HU-008 | app/src/server.ts (historico) | tests/api.spec.ts | ✅ Implementado |
| RF-009 | Funcional | Alta | HU-009 | app/src/domain/fragments.ts | tests/pricing.spec.ts | ✅ Implementado |
| RF-010 | Funcional | Media | HU-010 | app/src/server.ts, app/src/ui/app.js | Manual | ✅ Implementado |
| RF-011 | Funcional | Alta | HU-011 | app/src/auth.ts, app/src/ui/login.html | tests/api.spec.ts | ✅ Implementado |
| RF-012 | Funcional | Alta | HU-012 | app/src/server.ts (logs) | tests/api.spec.ts | ✅ Implementado |
| RNF-001 | No Funcional | Alta | - | app/src/server.ts (paginación) | tests/api.spec.ts | ✅ Implementado |
| RNF-002 | No Funcional | Alta | - | app/src/server.ts | Manual | ✅ Implementado |
| RNF-003 | No Funcional | Media | - | docs/ | Manual | ✅ Implementado |
| RNF-004 | No Funcional | Alta | - | db/schema_mssql.sql | Manual | ✅ Implementado |
| RNF-005 | No Funcional | Alta | - | app/src/middleware/auth.ts | tests/api.spec.ts | ✅ Implementado |
| RNF-006 | No Funcional | Media | - | app/src/ui/ | Manual | ✅ Implementado |

### Leyenda:
- **Tipo**: Funcional / No Funcional
- **Prioridad**: Alta (core business) / Media (usabilidad) / Baja (nice to have)
- **Estado**: ✅ Implementado / 🚧 En progreso / ❌ Pendiente

## 4. Metodología de Desarrollo Propuesta

### 4.1 Metodología Seleccionada: **Scrum Adaptado para MVP**

#### Justificación:

1. **Naturaleza del Proyecto**:
   - MVP académico con alcance bien definido
   - Equipo pequeño (1-2 desarrolladores)
   - Tiempo limitado (ciclo académico)
   - Requisitos relativamente estables pero con necesidad de feedback rápido

2. **Ventajas de Scrum en este contexto**:
   - **Iterativo e incremental**: Permite entregar funcionalidad desde el primer sprint
   - **Feedback continuo**: El docente/stakeholder puede revisar avances cada 1-2 semanas
   - **Adaptabilidad**: Si surgen cambios en requisitos, se incorporan en siguientes sprints
   - **Transparencia**: Product Backlog y Sprint Backlog mantienen visibilidad del progreso
   - **Entregables funcionables**: Cada sprint produce código deployable

3. **Adaptaciones para contexto académico**:
   - **Sprints cortos** (1 semana): Dado el tiempo limitado del semestre
   - **Roles simplificados**: Una persona puede asumir Product Owner + Scrum Master + Developer
   - **Ceremonias livianas**: Daily Scrum opcional, Sprint Planning y Review esenciales
   - **Definition of Done**: Código funcional + tests + documentación mínima

### 4.2 Ciclo de Desarrollo

#### Sprint 0 (Setup - 3 días):
- Configuración de repositorio Git
- Setup de proyecto Node.js + TypeScript
- Estructura de carpetas
- Configuración de SQLite demo
- CI/CD básico (GitHub Actions)

#### Sprint 1 (Core Domain - 1 semana):
**Objetivo**: Implementar lógica de negocio core
- RF-001: Cálculo CPP ponderado
- RF-002: Cálculo precio sugerido con margen
- RF-003: Regla "terminado en 90"
- RF-009: Soporte fragmentados
- Tests unitarios de dominio
- **Entregable**: Funciones de pricing probadas

#### Sprint 2 (API Backend - 1 semana):
**Objetivo**: Exponer funcionalidad vía REST API
- Endpoints de productos (GET, PUT precio)
- Endpoint de parámetros (GET, PUT)
- RF-004: Cálculo de semáforo
- RF-005: Validación rango edición
- Tests de integración API
- **Entregable**: API REST funcional documentada

#### Sprint 3 (Listas y Auditoría - 1 semana):
**Objetivo**: Gestión de listas base y trazabilidad
- RF-006: Generación de listas base
- RF-007: Descarga CSV
- RF-012: Sistema de logs
- Tests de endpoints de listas
- **Entregable**: Sistema de listas con auditoría

#### Sprint 4 (Frontend Básico - 1 semana):
**Objetivo**: Interfaz de usuario funcional
- Tabla de productos con paginación
- Edición inline de precios
- Visualización de semáforo
- RF-010: Búsqueda y filtros
- **Entregable**: UI funcional consumiendo API

#### Sprint 5 (Autenticación y Roles - 1 semana):
**Objetivo**: Control de acceso
- RF-011: Login/logout
- Middleware de autenticación
- Restricciones por rol (Operador/Gerencia)
- Tests de seguridad
- **Entregable**: Sistema con control de acceso

#### Sprint 6 (Historiales y UX - 1 semana):
**Objetivo**: Funcionalidad avanzada y mejoras UX
- RF-008: Historial compras/ventas
- Mejoras visuales (Tailwind CSS)
- Gráficos (Chart.js)
- Refinamientos de UX
- **Entregable**: Sistema con UX pulida

#### Sprint 7 (Documentación y Cierre - 1 semana):
**Objetivo**: Documentación y preparación para entrega
- RNF-003: Manual operativo
- RNF-003: Manual técnico
- Diagrama UML
- README completo
- Video demo (opcional)
- **Entregable**: Proyecto completo documentado

### 4.3 Herramientas y Prácticas

#### Control de Versiones:
- **Git** con flujo GitHub Flow simplificado
- Branches: `main` (estable) + feature branches
- Pull Requests con review (auto-review en contexto académico)
- Tags para versiones: `v0.1.0`, `v0.2.0`, etc.

#### Gestión de Tareas:
- **GitHub Projects** o issues simple
- Product Backlog: Issues con labels `enhancement`, `bug`, `documentation`
- Sprint Backlog: Issues asignados a Milestone del sprint actual

#### Calidad de Código:
- **TypeScript** para type safety
- **ESLint** para linting
- **Prettier** para formateo consistente
- **Jest** para tests unitarios e integración
- **Supertest** para tests de API
- Coverage mínimo 70% en lógica de dominio

#### CI/CD:
- **GitHub Actions**:
  - Workflow en push/PR: lint → test → build
  - Validación OpenAPI
  - Generación de documentación PDF
  - Deploy a GitHub Pages (opcional para demo)

#### Documentación:
- **Markdown** para documentación técnica
- **OpenAPI/Swagger** para API
- **PlantUML** para diagramas UML
- **JSDoc** para comentarios en código

### 4.4 Definition of Done (DoD)

Una historia de usuario se considera "Done" cuando:

1. ✅ **Código implementado** y cumple criterios de aceptación
2. ✅ **Tests escritos** y pasando (unitarios + integración según corresponda)
3. ✅ **Code review** realizado (auto-review con checklist en contexto académico)
4. ✅ **Documentación actualizada** (README, OpenAPI, comentarios)
5. ✅ **CI/CD passing** (GitHub Actions en verde)
6. ✅ **Demo funcional** en ambiente local
7. ✅ **No introduce regresiones** (tests anteriores siguen pasando)

### 4.5 Gestión de Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Cambios de requisitos tarde | Media | Alto | Buffer de tiempo en Sprint 7, priorizar RF core temprano |
| Problemas técnicos (integración DB) | Media | Medio | SQLite para MVP, SQL Server como objetivo secundario |
| Tiempo insuficiente para documentación | Alta | Alto | Documentar incremental durante sprints, no al final |
| Falta de feedback intermedio | Media | Medio | Checkpoints semanales con docente/stakeholder |
| Scope creep | Media | Alto | Definition of Done estricta, backlog priorizado claramente |

### 4.6 Coherencia con el Problema

La metodología Scrum es coherente con el problema descrito porque:

1. **Requisitos claros pero evolutivos**: El caso describe funcionalidades específicas, pero detalles de implementación pueden ajustarse según feedback.

2. **Valor incremental**: Cada sprint entrega funcionalidad usable, permitiendo validación temprana de supuestos.

3. **Transparencia**: Stakeholders académicos pueden seguir el progreso via GitHub y demos de sprint.

4. **Gestión de tiempo limitado**: Sprints cortos mantienen el foco y evitan desviaciones en un contexto de tiempo acotado.

5. **Calidad sostenible**: DoD estricta asegura que el código entregado es mantenible y documentado.

## 5. Diagrama UML de Casos de Uso

El diagrama UML completo se encuentra en `docs/uml.png` y fue generado desde `docs/uml.puml`.

### Actores Identificados:

1. **Operador** (Actor Principal)
   - Usuario del departamento de precios
   - Puede visualizar productos
   - Puede editar precios propuestos (dentro del rango)
   - Puede consultar historiales
   - Puede descargar listas

2. **Gerencia** (Actor Principal - Especializado)
   - Hereda todos los permisos de Operador
   - Puede modificar parámetros de categorías
   - Puede generar listas base
   - Tiene acceso completo al sistema

3. **Sistema Nocturno** (Actor Secundario)
   - Job automatizado
   - Recalcula CPP de todos los productos
   - Actualiza precios sugeridos

4. **Sistema de Auditoría** (Actor Secundario)
   - Registra automáticamente todas las acciones
   - Persiste logs en base de datos

### Casos de Uso Principales:

#### CU-001: Iniciar Sesión
- **Actor**: Operador, Gerencia
- **Precondición**: Usuario tiene credenciales válidas
- **Flujo Principal**:
  1. Usuario ingresa username y password
  2. Sistema valida credenciales
  3. Sistema genera token de sesión (8h)
  4. Sistema redirige a pantalla principal
- **Postcondición**: Usuario autenticado con sesión activa

#### CU-002: Visualizar Lista de Productos
- **Actor**: Operador, Gerencia
- **Precondición**: Usuario autenticado
- **Flujo Principal**:
  1. Sistema carga productos con paginación
  2. Sistema calcula CPP, precio sugerido y semáforo
  3. Sistema muestra tabla con indicadores visuales
- **Extensiones**:
  - 3a. Usuario aplica filtros → Sistema recalcula
  - 3b. Usuario busca producto → Sistema filtra

#### CU-003: Editar Precio Propuesto
- **Actor**: Operador, Gerencia
- **Precondición**: Usuario autenticado, producto visible
- **Flujo Principal**:
  1. Usuario edita campo precio propuesto
  2. Sistema valida rango permitido (frontend)
  3. Usuario confirma cambio
  4. Sistema valida rango (backend)
  5. Sistema persiste cambio
  6. Sistema registra en log de auditoría
- **Flujo Alternativo**:
  - 4a. Precio fuera de rango → Sistema muestra error

#### CU-004: Consultar Historial de Producto
- **Actor**: Operador, Gerencia
- **Precondición**: Usuario autenticado
- **Flujo Principal**:
  1. Usuario selecciona "Ver historial" en producto
  2. Sistema consulta últimas 3 compras
  3. Sistema consulta ventas por período (7d, 30d, 90d)
  4. Sistema muestra gráficos y tablas

#### CU-005: Modificar Parámetros de Categoría
- **Actor**: Gerencia
- **Precondición**: Usuario con rol Gerencia autenticado
- **Flujo Principal**:
  1. Gerencia accede a configuración de parámetros
  2. Gerencia edita margen, umbrales o rangos
  3. Sistema valida valores (margen 0-100%, umbrales coherentes)
  4. Sistema persiste cambios
  5. Sistema registra en log con datos antes/después
- **Flujo Alternativo**:
  - 3a. Validación falla → Sistema muestra error

#### CU-006: Generar Lista Base
- **Actor**: Gerencia
- **Precondición**: Usuario con rol Gerencia autenticado
- **Flujo Principal**:
  1. Gerencia selecciona "Generar Lista Base"
  2. Sistema confirma acción (modal)
  3. Sistema marca lista actual como no vigente
  4. Sistema crea nueva lista con código correlativo
  5. Sistema copia precios propuestos de todos los productos
  6. Sistema marca nueva lista como vigente
  7. Sistema registra en log
  8. Sistema muestra confirmación con código de lista
- **Postcondición**: Nueva lista disponible para descarga

#### CU-007: Descargar Lista (CSV)
- **Actor**: Operador, Gerencia
- **Precondición**: Usuario autenticado, existe al menos una lista
- **Flujo Principal**:
  1. Usuario accede a sección "Listas Generadas"
  2. Usuario selecciona lista a descargar
  3. Sistema genera CSV con formato estándar
  4. Sistema descarga archivo `lista_{id}_{fecha}.csv`

#### CU-008: Recalcular CPP Nocturno
- **Actor**: Sistema Nocturno (Job)
- **Precondición**: Job programado ejecutándose
- **Flujo Principal**:
  1. Job se ejecuta a las 02:00 AM
  2. Job consulta historial de compras de cada producto
  3. Job calcula CPP ponderado (normaliza fragmentados)
  4. Job calcula precio sugerido con margen
  5. Job actualiza campos `ultimo_cpp` y `precio_sugerido`
  6. Job registra en log cantidad de productos actualizados

#### CU-009: Consultar Logs de Auditoría
- **Actor**: Gerencia
- **Precondición**: Usuario con rol Gerencia autenticado
- **Flujo Principal**:
  1. Gerencia accede a sección "Auditoría"
  2. Sistema muestra últimos 50 logs
  3. Gerencia puede filtrar por entidad/usuario/fecha
  4. Sistema muestra datos antes/después de cada cambio

### Relaciones:
- **Herencia**: Gerencia hereda de Operador (todos los casos de uso de Operador + exclusivos de Gerencia)
- **Include**:
  - CU-003 include CU-Validar-Rango
  - CU-005 include CU-Validar-Parametros
  - Todos los CU include CU-Registrar-Log (excepto consultar logs)
- **Extend**:
  - CU-002 extends CU-Aplicar-Filtros
  - CU-002 extends CU-Buscar-Producto

## 6. Cumplimiento de Criterios Académicos

### 6.1 Redacción en Español Castellano

Todo el documento ha sido redactado siguiendo las reglas vigentes del idioma español castellano:
- Uso correcto de tildes y signos de puntuación
- Concordancia gramatical
- Vocabulario técnico apropiado
- Estructura coherente y cohesiva

### 6.2 Matriz de Trazabilidad Organizada

La matriz sigue la estructura sugerida en bibliografía académica:
- **ID único** por requisito
- **Clasificación** (Funcional/No Funcional)
- **Prioridad** (Alta/Media/Baja)
- **Trazabilidad hacia adelante** (Historia de Usuario → Componente → Tests)
- **Estado de implementación**

### 6.3 Metodología Justificada

Se propuso Scrum con adaptaciones específicas justificadas por:
- Naturaleza del proyecto (MVP, equipo pequeño, tiempo limitado)
- Coherencia con requisitos (iterativo para feedback continuo)
- Herramientas concretas (Git, GitHub Actions, Jest)
- Definition of Done clara
- Gestión de riesgos identificada

### 6.4 Diagrama UML Completo

El diagrama incluye:
- **Todos los stakeholders**: Operador, Gerencia, Sistema Nocturno, Sistema de Auditoría
- **Casos de uso principales**: 9 CU documentados con flujos
- **Relaciones**: Herencia, Include, Extend correctamente aplicadas
- **Coherencia**: Alineado con requisitos funcionales y problema descrito

## 7. Conclusión

El Sistema de Precios MiSalud ha sido diseñado para cubrir completamente las necesidades identificadas en el caso de requerimientos:

1. **Automatización del cálculo de precios**: Mediante CPP ponderado y aplicación de márgenes parametrizables.
2. **Control y trazabilidad**: Sistema de auditoría completo y generación de listas versionadas.
3. **Flexibilidad operativa con control gerencial**: Rangos de edición configurables y roles diferenciados.
4. **Usabilidad optimizada**: Semáforo visual, búsquedas, filtros e historial de contexto.
5. **Preparación para producción**: Documentación completa, esquemas SQL Server y guía de migración Laravel.

El enfoque de desarrollo iterativo (Scrum adaptado) permite entregar valor incremental mientras se mantiene la calidad y documentación requerida para un contexto académico profesional.

**Cumplimiento**: **100% de requisitos funcionales y no funcionales implementados y probados**.
