# Informe Ejecutivo · Módulo de Precios MiSalud (1 página)

## Necesidades de la organización y aportes
- **N-01 Ajuste ágil de precios corporativos**: RF-001, RF-002 y RF-003 calculan CPP, aplican redondeo 90 (regla 40/41) y mantienen márgenes/umbrales parametrizables por categoría; cubren el KPI de rentabilidad del Departamento de Precios.
- **N-02 Control y auditoría regulatoria**: RF-007 y RNF-004 generan logs de listas y parámetros, con rol Gerencia/Operador (RNF-003) para cumplir lineamientos de MiSalud y auditorías internas.
- **N-03 Disponibilidad operativa en sucursales**: RF-004/RF-005 permiten emitir y descargar listas base con correlativo 001+; RNF-001 garantiza tiempos ≤5s entregando datos preprocesados desde la API.
- **N-04 Integración con ambiente corporativo**: RNF-002 y RF-008 (job nocturno de CPP + scripts MSSQL) facilitan la portabilidad a Laravel 7 en Windows Server 2016 con SQL Server.
- **N-05 Visibilidad táctica**: RF-006 y RNF-005 brindan UI responsive con panel lateral de compras/ventas (7/30/90 días) para que el analista valide señales de stock y estacionalidad.

## Requisitos funcionales y no funcionales
- **Funcionales (RF-001…RF-008)**: cálculo CPP, redondeo 90, semáforo parametrizable, edición acotada, listas con correlativo, panel histórico, generación de logs y job nocturno. Cada RF enlaza con historias HCU-001…HCU-007 y pruebas (ver matriz).
- **No funcionales (RNF-001…RNF-005)**: performance, compatibilidad Laravel/MSSQL, control de acceso, auditoría persistente y UX responsive con validaciones en cliente.
- **UML documentado**: El diagrama de componentes (docs/uml.puml) vincula actores (Gerencia, Departamento de Precios) con SPA, API (Node demo / Laravel objetivo), servicio de dominio y MSSQL/SQLite.

## Matriz de trazabilidad (resumen)
- RF-001 ↔ HCU-001 ↔ pruebas UNIT-CPP, UNIT-RED90, API-GET (mide CPP, márgenes y rendimiento).
- RF-002 ↔ HCU-002 ↔ pruebas UNIT-RANGO, API-UPDATE (control del rango autorizado).
- RF-004/RF-005 ↔ HCU-003/HCU-004 ↔ pruebas API-LISTA-GENERAR y API-LISTA-DESCARGA (listas base con correlativo descargables).
- RNF-002 ↔ CRN-Compatibilidad ↔ entrega de schema_mssql.sql, seed_mssql.sql y guías de portabilidad (README).
- CSV completo disponible en `docs/matriz_trazabilidad.csv`.

## Metodología Scrum aplicada
- **Roles**: Product Owner (Gerencia de Precios), Scrum Master (Líder TI Comercial), Development Team (full-stack + QA). Garantiza balance entre negocio y cumplimiento técnico.
- **Artefactos**: Backlog priorizado con RF/RNF (IDs), Sprint Backlog con historias HCU y criterios DoR/DoD (logs, pruebas, documentación), Incremento empacado en `misalud-precios-mvp/`.
- **Eventos y criterios**: Sprints de 2 semanas con Reviews frente a Gerencia; Retrospectivas para ajustar rendimiento (<5s) y cobertura; Definition of Done exige pruebas (≈10 casos), scripts MSSQL y documentación lista para portarse a Laravel 7 + Scheduler Windows.
- **Gestión de parámetros**: Cambios en márgenes/umbrales siguen workflow de Scrum (nueva historia), se versionan en logs y matrices para mantener trazabilidad y cumplimiento regulatorio.
