import { getDb } from "../db";
import { FragmentConfig } from "../domain/fragments";
import {
  calcularCostoPromedioPonderado,
  calcularPrecioSugerido,
} from "../domain/pricing";
import { CategoriaParametros } from "../domain/params";

type ProductoJobRow = {
  id: number;
  categoria_id: number;
  fragmentado: number;
  factor_fragmentacion: number;
  precio_actual: number;
  categoria_nombre: string;
  margen: number;
  umbral_rojo: number;
  umbral_amarillo: number;
  rango_edicion_min: number;
  rango_edicion_max: number;
};

type CompraRow = {
  cantidad: number;
  costoTotal: number;
  unidad: "unidad" | "pack";
  fecha: string;
};

function obtenerConfig(row: ProductoJobRow): FragmentConfig {
  return {
    fragmentado: row.fragmentado === 1,
    factorConversion: row.factor_fragmentacion || 1,
  };
}

function obtenerParametros(row: ProductoJobRow): CategoriaParametros {
  return {
    margen: row.margen,
    umbralRojo: row.umbral_rojo,
    umbralAmarillo: row.umbral_amarillo,
    rangoEdicionMin: row.rango_edicion_min,
    rangoEdicionMax: row.rango_edicion_max,
  };
}

export function runNightlyCostUpdate(usuario = "job-nightly") {
  const db = getDb();

  const productos = db
    .prepare(
      `SELECT p.*, c.nombre as categoria_nombre, c.fragmentado,
              pc.margen, pc.umbral_rojo, pc.umbral_amarillo,
              pc.rango_edicion_min, pc.rango_edicion_max
       FROM productos p
       INNER JOIN categorias c ON c.id = p.categoria_id
       INNER JOIN parametros_categoria pc ON pc.categoria_id = p.categoria_id`
    )
    .all() as ProductoJobRow[];

  const comprasStmt = db.prepare(
    `SELECT cantidad, costo_total as costoTotal, unidad, fecha
     FROM compras WHERE producto_id = ?
     ORDER BY fecha DESC LIMIT 50`
  );

  const updateStmt = db.prepare(
    `UPDATE productos
     SET ultimo_cpp = ?, precio_sugerido = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  );

  for (const producto of productos) {
    const compras = comprasStmt.all(producto.id) as CompraRow[];
    const config = obtenerConfig(producto);
    const parametros = obtenerParametros(producto);
    const cpp = calcularCostoPromedioPonderado(compras, config);
    const calculo = calcularPrecioSugerido(cpp, parametros);

    updateStmt.run(
      calculo.cpp,
      calculo.precioPropuesto,
      producto.id
    );
  }

  db.prepare(
    `INSERT INTO logs (fecha, usuario, rol, entidad, accion, datos_antes, datos_despues)
     VALUES (CURRENT_TIMESTAMP, ?, 'Sistema', 'nightly_cost_update', 'recalculo_cpp', '{}', ?) `
  ).run(
    usuario,
    JSON.stringify({ productosProcesados: productos.length })
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runNightlyCostUpdate();
  console.log("Actualización nocturna de CPP ejecutada correctamente.");
}
