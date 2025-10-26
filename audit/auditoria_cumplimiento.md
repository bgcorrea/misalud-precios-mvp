# Auditoría de cumplimiento – MiSalud Precios MVP

## Resumen ejecutivo
- **Semáforo global:** ⚠️ Parcial
- Backend y scripts cumplen los flujos críticos (listas, parámetros, histórico, validaciones y performance) según evidencia automatizada.
- Entregables documentales están presentes, pero el PDF final excede el límite de 1 página y requiere ajuste formal.
- Se recomienda homologar los parámetros `limit/offset` solicitados en la especificación con la implementación actual (`page/pageSize`) para evitar confusiones con integraciones externas.

## Evidencia automática (tooling)
- Ejecutado `./.tooling/audit_check.sh` contra `http://localhost:3000/api`.
- Artefactos almacenados en `audit/evidencia/` (JSON, CSV, headers). Resumen capturado en `audit/evidencia/summary.txt`:

```
✅ Healthcheck /api/health 200
✅ GET /api/parametros 200
✅ GET /api/productos?limit=5 200 (t=5→0.002405s, t=25→0.001981s)
✅ GET /api/productos/1/historico 200
✅ PUT /api/parametros/1 200
✅ PUT /api/productos/1/precio-propuesto (válido) 200
✅ PUT /api/productos/1/precio-propuesto (fuera de rango) rechazado (400)
✅ POST /api/listas/generar 201 (ID 2)
✅ GET /api/listas/vigente 200
✅ GET /api/listas/2/descargar 200
✅ Artefactos clave detectados (PDF=50649 bytes)
```

- Conteo de pruebas automatizadas (`tests/api.spec.ts`, `tests/pricing.spec.ts`): ver `audit/evidencia/tests_counts.json` (22 casos; ≥10).
- Matriz de trazabilidad (`docs/matriz_trazabilidad.csv`) con 13 requisitos enlazados (`audit/evidencia/matriz_rows.txt`).

## Checklist trazable por criterio
| Criterio | Evidencia clave | Resultado |
| --- | --- | --- |
| Necesidades | `report/informe_1_pagina.md` resume N-01…N-05 alineados a RF/RNF (p. ej. secciones “Necesidades de la organización y aportes”). | ✅ |
| RF/RNF | Lógica y reglas en `app/src/domain/pricing.ts:24-104`, `app/src/server.ts:205-585`; pruebas en `tests/pricing.spec.ts` y `tests/api.spec.ts`. | ✅ |
| Matriz | `docs/matriz_trazabilidad.csv` + referencias cruzadas en informe (`docs/decision_metodologia.md`). | ✅ |
| Metodología + aplicación | `docs/decision_metodologia.md` detalla roles/events; README actualizado con autoverificación. | ✅ |
| UML | `docs/uml.puml`, `docs/uml.png` incluyen actores Gerencia/Departamento. | ✅ |
| Redacción / forma PDF | `report/aptc105_s4_apellidonombre.pdf` pesa 50 649 bytes pero contiene 2 páginas (`audit/evidencia/pdf_pagecount.txt`). | ❌ |
| Prueba funcional | Evidencia de endpoints y listas en `audit/evidencia/*.json|*.txt|*.csv`; tiempos <0.01 s para `/api/productos` (limit=25). | ✅ |

## Criterio / Evidencia / Resultado / Acción sugerida
| Criterio | Evidencia referenciada | Resultado | Acción sugerida |
| --- | --- | --- | --- |
| Necesidades | `report/informe_1_pagina.md` (sección “Necesidades de la organización y aportes”). | ✅ | Mantener trazabilidad en futuras iteraciones; sin acción inmediata. |
| RF/RNF | `app/src/server.ts:205-585`, `app/src/domain/pricing.ts:24-104`; pruebas `tests/pricing.spec.ts` (11 casos) y `tests/api.spec.ts` (11 casos). | ✅ | Considerar alias `limit/offset` en `/api/productos` para cumplir la interfaz solicitada. |
| Matriz | `docs/matriz_trazabilidad.csv` (13 registros) y mapeo en informe (RF ↔ HCU ↔ pruebas). | ✅ | Automatizar validación CSV (opcional) con script en CI. |
| Metodología | `docs/decision_metodologia.md`, README `## Cómo validar cumplimiento`. | ✅ | Sin cambios inmediatos. |
| UML | `docs/uml.puml`, `docs/uml.png`. | ✅ | Versionar exportación al regenerar diagrama (mantener script). |
| Redacción/forma PDF | `audit/evidencia/pdf_pagecount.txt` muestra 2 páginas; nombre correcto. | ❌ | Ajustar `report/informe_1_pagina.md` o `report/export_to_pdf.sh` para forzar ≤1 página (p.ej. recortar viñetas o ajustar márgenes). |
| Prueba funcional | `audit/evidencia/summary.txt`, `lista_002.csv`, `put_*`. | ✅ | Mantener script de auditoría en CI/manual; validar con datos reales. |

## Fallas y correcciones propuestas
- **PDF excede 1 página (requisito documental)**
  - Evidencia: `audit/evidencia/pdf_pagecount.txt` → “Pages detected: 2”.
  - Sugerencia de ajuste (quick win, esfuerzo **bajo**): reducir márgenes en `report/export_to_pdf.sh` o consolidar bullets.
    ```diff
    --- a/report/export_to_pdf.sh
    +++ b/report/export_to_pdf.sh
    @@
    -    pandoc "${SOURCE}" \
    -      --from markdown \
    -      --pdf-engine="${ENGINE}" \
    -      -V papersize=letter \
    -      -V geometry:margin=1in \
    +    pandoc "${SOURCE}" \
    +      --from markdown \
    +      --pdf-engine="${ENGINE}" \
    +      -V papersize=letter \
    +      -V header-includes='\usepackage[compact]{titlesec}' \
    +      -V geometry:left=0.75in,right=0.75in,top=0.8in,bottom=0.8in \
          -o "${OUTPUT}"
    ```
- **Parámetros `limit/offset` no soportados explícitamente**
  - Evidencia: `app/src/server.ts:212-299` usa `page` / `pageSize`; `audit/evidencia/productos_5.json` muestra 12 ítems aun solicitando `limit=5`.
  - Propuesta (esfuerzo **medio**): aceptar alias `limit`/`offset` para compatibilidad con la especificación.
    ```diff
    --- a/app/src/server.ts
    +++ b/app/src/server.ts
    @@
-      const page = clampNumber(Number(req.query.page) || 1, 1, Number.MAX_SAFE_INTEGER, 1);
-      const rawPageSize = Number(req.query.pageSize);
-      const pageSize = clampNumber(rawPageSize || 25, 1, 100, 25);
-      const offset = (page - 1) * pageSize;
+      const rawLimit = Number(req.query.limit ?? req.query.pageSize);
+      const rawOffset = Number(req.query.offset ?? 0);
+      const pageSize = clampNumber(rawLimit || 25, 1, 100, 25);
+      const offset = rawOffset >= 0 ? rawOffset : (Math.max(Number(req.query.page) - 1, 0) * pageSize);
+      const page = Math.floor(offset / pageSize) + 1;
    ```

## Acciones correctivas priorizadas
- **Quick wins (≤1 día)**
  1. Ajustar exportación del PDF para garantizar 1 página (`report/export_to_pdf.sh`) y regenerar `report/aptc105_s4_apellidonombre.pdf`.
  2. Añadir verificación automática de páginas en CI (usar `python3` snippet ya documentado).
- **Medias (1-3 días)**
  1. Implementar alias `limit/offset` en `/api/productos` + pruebas en `tests/api.spec.ts` para validar paginado solicitado. Commit sugerido: `feat(api): soporta limit/offset en listado de productos`.
- **Mayores (>3 días)**
  - No se identifican iniciativas críticas adicionales para este MVP; enfocar QA en datos reales al integrar con MSSQL.

## Observaciones complementarias
- Las reglas de negocio (CPP, redondeo 90, semáforo, rangos) están cubiertas en `app/src/domain/pricing.ts` y validadas por 11 pruebas unitarias (`tests/pricing.spec.ts`).
- Logs y auditoría quedan registrados (`registrarLog` en `app/src/server.ts:140-187`), cumpliendo con RNF-004.
- README incluye la nueva sección `## Cómo validar cumplimiento`, orientando a ejecutar `.tooling/audit_check.sh` y revisar `audit/auditoria_cumplimiento.md`.
- Sugerencia de continuidad: incorporar `.tooling/audit_check.sh` al pipeline de CI junto al `selfcheck` existente para detectar regresiones de roles y rangos.
