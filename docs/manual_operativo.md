# Manual Operativo - Sistema de Precios MiSalud

**Versión:** 1.0
**Fecha:** Octubre 2025
**Destinatarios:** Departamento de Precios - MiSalud

---

## 1. Introducción

El Sistema de Precios MiSalud es una herramienta diseñada para automatizar el cálculo y gestión de precios de medicamentos en la cadena de farmacias MiSalud (25 locales).

### 1.1. Objetivo del Sistema

- Generar listas de precios propuestas basadas en márgenes parametrizables
- Garantizar la aplicación de márgenes establecidos por Gerencia
- Optimizar el tiempo de trabajo del departamento de precios
- Mantener precios competitivos con el margen deseado

### 1.2. Usuarios del Sistema

| Rol | Permisos |
|-----|----------|
| **Operador** | Consultar productos, editar precios propuestos (dentro del rango autorizado), ver históricos |
| **Gerencia** | Todos los permisos del Operador + generar listas base, modificar parámetros de categorías |

---

## 2. Acceso al Sistema

### 2.1. Inicio de Sesión

1. Abrir navegador web (Chrome, Firefox, Edge)
2. Ingresar a la URL: `http://[servidor-intranet]:3000/ui`
3. Seleccionar su rol en el selector superior derecho
4. El sistema cargará automáticamente la lista de productos

### 2.2. Interfaz Principal

La pantalla principal está dividida en las siguientes secciones:

```
┌─────────────────────────────────────────────────┐
│  [Logo] MiSalud Precios      [Rol: Operador ▼] │
├─────────────────────────────────────────────────┤
│  🔍 Búsqueda  [Categoría▼]  [Semáforo▼]        │
├─────────────────────────────────────────────────┤
│  Tabla de Productos                             │
│  ┌──────┬──────────┬─────────┬─────┬──────┐   │
│  │Código│Descripción│CPP│Actual│Prop │Est│  │
│  └──────┴──────────┴─────────┴─────┴──────┘   │
├─────────────────────────────────────────────────┤
│  Leyenda Semáforo: 🟢 Óptimo │🟡 Alerta │🔴   │
├─────────────────────────────────────────────────┤
│  [◀ Anterior]  Página 1 de 5  [Siguiente ▶]   │
└─────────────────────────────────────────────────┘
```

---

## 3. Operaciones Principales

### 3.1. Consultar Productos

**Objetivo:** Visualizar la lista completa de productos con sus precios calculados.

**Pasos:**
1. Al ingresar al sistema, la tabla muestra automáticamente los productos
2. Use los botones de paginación para navegar entre páginas
3. Puede ajustar el tamaño de página (10, 25, 50, 100 productos)

**Columnas de la Tabla:**

| Columna | Descripción |
|---------|-------------|
| **Código** | Código interno del producto |
| **Código Barras** | Código de barras EAN |
| **Descripción** | Nombre comercial del medicamento |
| **CPP** | Costo Promedio Ponderado calculado |
| **Actual** | Precio de venta actual en el sistema |
| **Propuesto** | Precio sugerido por el sistema (editable) |
| **Margen** | Porcentaje de margen aplicado |
| **Estado** | Indicador visual (semáforo) |
| **Acciones** | Botones Historial y Guardar |

### 3.2. Buscar Productos

**Objetivo:** Encontrar productos específicos por código o descripción.

**Pasos:**
1. Haga clic en el campo de búsqueda (🔍)
2. Digite:
   - Código interno, o
   - Código de barras, o
   - Parte de la descripción
3. El sistema filtra automáticamente después de 300ms
4. Para limpiar la búsqueda, haga clic en la (✖) del campo

**Ejemplo:**
- Buscar "PARACETAMOL" mostrará todos los productos que contengan esa palabra
- Buscar "7802" mostrará productos cuyo código de barras contenga esos dígitos

### 3.3. Filtrar por Categoría

**Objetivo:** Ver productos de una categoría específica.

**Pasos:**
1. Haga clic en el selector "Todas las categorías"
2. Seleccione la categoría deseada:
   - Analgésicos
   - Antibióticos
   - Fragmentados
   - etc.
3. La tabla se actualiza automáticamente
4. Para ver todas las categorías nuevamente, seleccione "Todas las categorías"

### 3.4. Filtrar por Estado (Semáforo)

**Objetivo:** Identificar productos que requieren atención prioritaria.

**Interpretación del Semáforo:**

| Color | Significado | Acción Recomendada |
|-------|-------------|---------------------|
| 🟢 **Verde** | El precio actual está dentro del rango óptimo (diferencia < 5% respecto al propuesto) | No requiere acción inmediata |
| 🟡 **Amarillo** | El precio actual difiere entre 5% y 20% del propuesto | Revisar y considerar ajuste |
| 🔴 **Rojo** | El precio actual difiere >20% del propuesto O está por debajo del propuesto | **Acción urgente requerida** |

**Pasos:**
1. Haga clic en el selector "Todos los estados"
2. Elija el color a filtrar:
   - 🟢 Óptimo
   - 🟡 Alerta
   - 🔴 Crítico
3. La tabla muestra solo productos con ese estado

**Nota Importante:** Si el precio actual es **menor** que el propuesto, siempre aparecerá en ROJO, independiente del porcentaje de diferencia.

### 3.5. Ver Histórico de un Producto

**Objetivo:** Analizar las últimas compras y ventas para tomar decisiones informadas.

**Pasos:**
1. Localice el producto en la tabla
2. Haga clic en el botón **[📊 Historial]** en la columna Acciones
3. Se abre una ventana modal mostrando:

**Pestaña "Compras":**
- Últimas 3 compras realizadas
- Información: fecha, cantidad, costo total, costo unitario

**Pestaña "Ventas":**
- Ventas de los últimos 7, 30 y 90 días
- Información: período, cantidad vendida, ingresos totales

**Pestaña "Gráficos":**
- **Gráfico de Línea:** Evolución del precio de compra unitario
- **Gráfico de Barras:** Volumen de ventas por período

4. Para cerrar la ventana, haga clic en **[✖ Cerrar]** o fuera del modal

**Uso del Histórico:**
- Identifique tendencias de precios
- Verifique estacionalidad de ventas
- Justifique cambios de precio ante Gerencia

### 3.6. Editar Precio Propuesto

**Objetivo:** Ajustar manualmente el precio propuesto por el sistema dentro del rango autorizado.

**Restricciones:**
- Solo puede modificar precios dentro del rango definido por Gerencia
- Por defecto: ±5% respecto al precio sugerido automáticamente
- El sistema valida antes de guardar

**Pasos:**
1. Localice el producto a modificar
2. Haga clic en la celda de **Precio Propuesto** (aparece con borde)
3. Digite el nuevo precio (formato: 12345.90)
4. Presione **Enter** o haga clic fuera de la celda
5. El sistema valida:
   - ✅ Si el precio está dentro del rango: se marca para guardar
   - ❌ Si está fuera del rango: muestra mensaje de error
6. Haga clic en el botón **[💾 Guardar]**
7. Confirme la acción en el diálogo
8. El sistema registra el cambio en el log de auditoría

**Ejemplo de Validación:**

```
Precio Sugerido: $1.990
Rango Autorizado: ±5%
  ✅ Válido: $1.890 - $2.090
  ❌ Inválido: $1.800 (por debajo)
  ❌ Inválido: $2.150 (por encima)
```

**Mensaje de Error Típico:**
> "El nuevo precio queda -8.50% por debajo del permitido (-5%)."

**Recomendación:** Si necesita aplicar un precio fuera del rango, contacte a Gerencia para que ajuste los parámetros de la categoría o autorice el cambio.

### 3.7. Limpiar Filtros

**Objetivo:** Volver a la vista completa de productos sin filtros activos.

**Pasos:**
1. Haga clic en el botón **[🗑️ Limpiar Filtros]** (esquina superior derecha)
2. El sistema:
   - Limpia el campo de búsqueda
   - Restaura "Todas las categorías"
   - Restaura "Todos los estados"
   - Vuelve a la página 1

---

## 4. Operaciones de Gerencia

**Nota:** Las siguientes operaciones solo están disponibles para usuarios con rol "Gerencia".

### 4.1. Generar Lista Base

**Objetivo:** Crear una nueva lista oficial de precios para distribuir a los 25 locales.

**Cuándo Generar:**
- Quincenalmente (cada 15 días)
- Cuando se detecte un cambio significativo en precios de compra
- Cuando Gerencia lo solicite explícitamente

**Pasos:**
1. Cambie su rol a **"Gerencia"** en el selector superior
2. Revise que todos los precios propuestos estén correctos
3. Haga clic en el botón **[📋 Generar Lista Base]** (superior derecha)
4. El sistema:
   - Asigna un código correlativo (ej: "001", "002", "003"...)
   - Marca la lista anterior como no vigente
   - Registra la fecha de generación
   - Guarda todos los productos con sus precios propuestos
5. Aparece mensaje de confirmación:
   > "Lista base '003' generada exitosamente."

**Importante:**
- La lista generada se convierte automáticamente en la lista **vigente**
- Los locales deben descargar esta lista para actualizar sus POS
- Cada lista queda registrada para auditoría futura

### 4.2. Descargar Lista Base

**Objetivo:** Obtener archivo CSV de la lista de precios para importar en otros sistemas.

**Pasos:**
1. Vaya a la sección "Listas Generadas" o use el endpoint:
   ```
   GET /api/listas/vigente
   GET /api/listas/{id}/descargar?sep=;
   ```
2. El archivo CSV se descarga con formato:
   ```
   codigo_interno;codigo_barras;descripcion;precio_propuesto
   MED001;7801234567890;PARACETAMOL 500MG;1990
   ```
3. Puede especificar el separador (`;` por defecto, o `,` o `|`)

**Uso del Archivo:**
- Importar en sistema POS de cada local
- Distribuir por correo/intranet a cada farmacia
- Archivar para auditorías

### 4.3. Modificar Parámetros de Categoría

**Objetivo:** Ajustar márgenes y umbrales de alerta por categoría de productos.

**Parámetros Configurables:**

| Parámetro | Descripción | Ejemplo |
|-----------|-------------|---------|
| **Margen** | Porcentaje de ganancia sobre el costo | 25% = 0.25 |
| **Umbral Rojo** | % de diferencia para alerta crítica | 20% |
| **Umbral Amarillo** | % de diferencia para precaución | 5% |
| **Rango Edición Min** | % máximo por debajo que puede editar el operador | -5% |
| **Rango Edición Max** | % máximo por encima que puede editar el operador | +5% |

**Pasos:**
1. Use el CLI administrativo o endpoint:
   ```
   PUT /api/parametros/{categoriaId}
   ```
2. Ejemplo de modificación:
   ```bash
   npx tsx scripts/admin.ts set-parametro \
     --cat 1 \
     --margen 0.28 \
     --umbralRojo 22 \
     --umbralAmarillo 8 \
     --min -5 \
     --max 5 \
     --usuario "Juan Pérez"
   ```
3. El sistema valida y registra el cambio en el log

**Efecto:**
- Los nuevos parámetros se aplican inmediatamente
- El semáforo se recalcula con los nuevos umbrales
- Los operadores ven el nuevo rango de edición

---

## 5. Conceptos Clave del Sistema

### 5.1. Costo Promedio Ponderado (CPP)

**Definición:** Promedio de los costos de compra ponderado por las cantidades adquiridas.

**Fórmula:**
```
CPP = (Σ Costo Total de Compras) / (Σ Cantidad Comprada)
```

**Ejemplo:**
```
Compra 1: 100 unidades a $500 c/u = $50.000
Compra 2: 200 unidades a $450 c/u = $90.000
Compra 3: 50 unidades a $480 c/u = $24.000

CPP = ($50.000 + $90.000 + $24.000) / (100 + 200 + 50)
CPP = $164.000 / 350 = $468,57 por unidad
```

**Consideración Especial - Productos Fragmentados:**
Si un producto se compra por caja pero se vende por unidad:
- El sistema divide el CPP de la caja entre las unidades que contiene
- Ejemplo: Caja de 24 unidades a $12.000 → CPP unitario = $500

### 5.2. Regla "Terminado en 90"

**Objetivo:** Mantener consistencia en precios y facilitar el manejo de efectivo.

**Regla:**
- Todo precio final debe terminar en `.90` centavos
- Si el precio con margen es `$1.234`, se redondea:
  - Decimales ≤ 0.40 → redondea hacia abajo → `$1.190`
  - Decimales > 0.40 → redondea hacia arriba → `$1.290`

**Ejemplos:**
```
Precio calculado: $1.234  → Precio final: $1.190
Precio calculado: $1.259  → Precio final: $1.290
Precio calculado: $2.040  → Precio final: $1.990
Precio calculado: $2.041  → Precio final: $2.090
```

### 5.3. Margen por Categoría

Cada categoría tiene su propio margen de ganancia:

| Categoría | Margen Típico | Justificación |
|-----------|---------------|---------------|
| Analgésicos | 30% | Alta rotación, bajo riesgo |
| Antibióticos | 25% | Regulado, competitivo |
| Fragmentados | 35% | Mayor costo operativo |
| Controlados | 20% | Precio regulado |

### 5.4. Job Nocturno

**Funcionamiento:**
- Cada noche a las 02:00 AM el sistema:
  1. Recalcula el CPP de todos los productos
  2. Aplica márgenes vigentes
  3. Genera nuevos precios sugeridos
  4. Actualiza indicadores de semáforo

**Nota:** Los cambios no sobrescriben precios propuestos manualmente por el operador.

---

## 6. Auditoría y Trazabilidad

### 6.1. Log de Cambios

Todas las operaciones quedan registradas:

**Eventos Registrados:**
- Modificación de precio propuesto
- Generación de lista base
- Actualización de parámetros de categoría

**Información del Log:**
- Fecha y hora
- Usuario que realizó la acción
- Rol del usuario
- Datos ANTES del cambio
- Datos DESPUÉS del cambio

### 6.2. Consultar Logs

**Endpoint:**
```
GET /api/logs?limit=50
GET /api/logs/producto/123
```

**Uso:**
- Auditorías internas
- Resolución de discrepancias
- Seguimiento de decisiones de pricing

---

## 7. Solución de Problemas

### 7.1. Problemas Comunes

| Problema | Causa Probable | Solución |
|----------|----------------|----------|
| No puedo editar un precio | Rol incorrecto o precio fuera de rango | Verifique su rol; contacte Gerencia si necesita mayor rango |
| El semáforo está en rojo para todos | Parámetros muy estrictos o precios desactualizados | Gerencia debe revisar umbrales |
| No aparecen productos al buscar | Búsqueda muy específica o producto no existe | Use términos más generales; verifique código |
| La lista no se genera | No tiene rol Gerencia | Cambie su rol a "Gerencia" |

### 7.2. Contacto Soporte

**Departamento de TI - MiSalud**
- Email: soporte.ti@misalud.cl
- Interno: 1234
- Horario: Lunes a Viernes, 08:00 - 18:00

---

## 8. Buenas Prácticas

### 8.1. Recomendaciones para Operadores

1. **Revisión Diaria:**
   - Al iniciar jornada, filtre por 🔴 Crítico
   - Atienda primero productos con mayor volumen de ventas

2. **Análisis antes de Modificar:**
   - Siempre revise el histórico antes de cambiar un precio
   - Considere estacionalidad (productos de invierno/verano)

3. **Documentación:**
   - Si hace cambios significativos, anote la razón
   - Comunique a Gerencia decisiones importantes

### 8.2. Recomendaciones para Gerencia

1. **Generación de Listas:**
   - Genere quincenalmente (días 1 y 15)
   - Notifique a los locales por email tras generar

2. **Monitoreo de Parámetros:**
   - Revise mensualmente si los márgenes siguen vigentes
   - Ajuste umbrales si hay demasiados productos en rojo

3. **Capacitación:**
   - Capacite a nuevos operadores con este manual
   - Realice auditorías trimestrales de logs

---

## 9. Glosario

| Término | Definición |
|---------|------------|
| **CPP** | Costo Promedio Ponderado: costo unitario promedio de un producto |
| **Fragmentado** | Producto que se compra en una unidad (ej: caja) pero se vende en otra (ej: unidad) |
| **Lista Base** | Lista oficial de precios generada por el sistema, válida para toda la cadena |
| **Margen** | Porcentaje de ganancia aplicado sobre el costo |
| **POS** | Point of Sale (Punto de Venta): sistema usado en las farmacias locales |
| **Semáforo** | Indicador visual del estado del precio (Verde/Amarillo/Rojo) |
| **Umbral** | Valor límite que dispara una alerta |

---

## 10. Anexos

### Anexo A: Atajos de Teclado

| Tecla | Acción |
|-------|--------|
| `Tab` | Navegar entre celdas editables |
| `Enter` | Confirmar edición de precio |
| `Esc` | Cancelar edición / Cerrar modal |
| `Ctrl + F` | Enfocar campo de búsqueda |

### Anexo B: Códigos de Respuesta del Sistema

| Código | Mensaje | Significado |
|--------|---------|-------------|
| 200 | OK | Operación exitosa |
| 400 | Bad Request | Datos inválidos enviados |
| 403 | Forbidden | Operación no autorizada para su rol |
| 404 | Not Found | Producto o lista no encontrado |
| 500 | Internal Server Error | Error del servidor, contacte soporte |

---

**Fin del Manual Operativo**

*Documento elaborado por: Departamento de TI - MiSalud*
*Última actualización: Octubre 2025*
*Versión: 1.0*
