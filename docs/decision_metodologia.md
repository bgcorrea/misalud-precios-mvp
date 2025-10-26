# Metodología Seleccionada: Scrum Enfocado a Entregables Regulatorios

## Justificación
- **Iteraciones cortas y trazables**: El módulo de precios requiere validar reglas corporativas (redondeo, semáforo, auditoría). Scrum permite sprints de 2 semanas con entregables verificables y revisiones de cumplimiento normativo en cada Review.
- **Feedback de Gerencia**: La gerencia de precios necesita validar márgenes y rangos autorizados. Las ceremonias (Planning, Review) permiten incorporar ajustes sin perder control sobre la trazabilidad.
- **Gestión de riesgos**: Los límites regulatorios (logs, rounding) se controlan mediante Definition of Done con criterios de auditoría y tests automatizados, mitigando riesgos de publicación.

## Implementación Propuesta
- **Roles**:
  - *Product Owner*: Gerencia de Precios MiSalud (define RF/RNF y prioriza listas base).
  - *Scrum Master*: Líder de TI Comercial (desbloquea dependencias con infraestructura MSSQL/Laravel).
  - *Development Team*: Equipo full-stack + QA responsable de API Node demo y futura migración Laravel.
- **Artefactos**:
  - *Product Backlog*: requisitos RF/RNF con ID (RF-001… RNF-005) enlazados a la matriz de trazabilidad.
  - *Sprint Backlog*: historias priorizadas (HCU-001… HCU-007) con criterios de aceptación y pruebas vinculadas (UNIT-*, API-*).
  - *Increment*: demo Node + documentación lista para portar a Laravel 7/MSSQL y lista base descargable.
- **Eventos y Cadencias**:
  - *Sprint Planning*: define objetivos del sprint (p. ej. “Lista base generada con semáforo validado”).
  - *Daily Scrum*: seguimiento de cálculo CPP, seeds y pruebas.
  - *Sprint Review*: validación con Gerencia (UI, rangos, logs).
  - *Sprint Retrospective*: ajustes sobre performance, cobertura de pruebas y pipeline de publicación.
- **Criterios de Parametrización y Control**:
  - *Definition of Ready*: historia con RF/RNF asociados, datos de prueba, umbrales definidos y criterio de auditoría.
  - *Definition of Done*: código con pruebas automáticas, logs verificados, documentación actualizada (README, informe), endpoints compatibles con Laravel 7/MSSQL.
  - *Gestión de cambios*: solicitudes se incorporan al Product Backlog, calificando impacto sobre parámetros (márgenes, umbrales) y logística de listas base.
