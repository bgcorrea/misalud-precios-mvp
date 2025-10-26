#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { getDb, resetDemoDatabase } from "../src/db";
import { validarParametrosEntrada } from "../src/utils/parametros";
import { RolUsuario } from "../src/middleware/auth";

const db = () => getDb();

function registrarLog(payload: {
  entidad: string;
  entidadId?: number | null;
  accion: string;
  usuario: string;
  rol: RolUsuario | "Sistema" | null;
  antes?: unknown;
  despues?: unknown;
}) {
  const instancia = db();
  instancia
    .prepare(
      `INSERT INTO logs (fecha, usuario, rol, entidad, entidad_id, accion, datos_antes, datos_despues)
       VALUES (CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      payload.usuario,
      payload.rol,
      payload.entidad,
      payload.entidadId ?? null,
      payload.accion,
      JSON.stringify(payload.antes ?? {}),
      JSON.stringify(payload.despues ?? {})
    );
}

yargs(hideBin(process.argv))
  .scriptName("admin")
  .command(
    "reset-demo",
    "Reinicia la base de datos demo (SQLite)",
    () => {},
    () => {
      resetDemoDatabase();
      console.log("Base demo regenerada");
    }
  )
  .command(
    "generar-lista",
    "Genera una nueva lista base vigente",
    (y) =>
      y.option("usuario", {
        type: "string",
        default: "cli",
        describe: "Usuario que se registrará en el log",
      }),
    (args) => {
      const instancia = db();
      const productos = instancia
        .prepare(
          `SELECT id, precio_propuesto, precio_sugerido, precio_actual
           FROM productos ORDER BY codigo_interno`
        )
        .all() as Array<{ id: number; precio_propuesto: number | null; precio_sugerido: number | null; precio_actual: number }>;

      const vigente = instancia
        .prepare("SELECT id FROM listas_base WHERE vigente = 1 ORDER BY id DESC LIMIT 1")
        .get() as { id: number } | undefined;
      if (vigente) {
        instancia.prepare("UPDATE listas_base SET vigente = 0 WHERE id = ?").run(vigente.id);
      }

      const ultimoCodigo = instancia
        .prepare("SELECT codigo FROM listas_base ORDER BY id DESC LIMIT 1")
        .get() as { codigo: string } | undefined;

      const correlativo = ultimoCodigo
        ? String(Number(ultimoCodigo.codigo) + 1).padStart(3, "0")
        : "001";

      const lista = instancia
        .prepare(
          `INSERT INTO listas_base (codigo, fecha_generacion, vigente)
           VALUES (?, CURRENT_TIMESTAMP, 1)`
        )
        .run(correlativo);

      const listaId = Number(lista.lastInsertRowid);
      const insertItem = instancia.prepare(
        `INSERT INTO listas_base_items (lista_id, producto_id, precio_propuesto, margen_aplicado)
         VALUES (?, ?, ?, ?)`
      );

      for (const producto of productos) {
        const precio =
          producto.precio_propuesto ??
          producto.precio_sugerido ??
          producto.precio_actual;
        insertItem.run(listaId, producto.id, precio, null);
      }

      registrarLog({
        entidad: "lista_base",
        entidadId: listaId,
        accion: "generar_lista_base",
        usuario: String(args.usuario),
        rol: "Gerencia",
        antes: null,
        despues: { codigo: correlativo, totalProductos: productos.length },
      });

      console.log(`Lista ${correlativo} generada (ID ${listaId})`);
    }
  )
  .command(
    "listar-parametros",
    "Muestra los parámetros por categoría",
    () => {},
    () => {
      const instancia = db();
      const filas = instancia
        .prepare(
          `SELECT pc.categoria_id, c.nombre, pc.margen, pc.umbral_rojo, pc.umbral_amarillo,
                  pc.rango_edicion_min, pc.rango_edicion_max
           FROM parametros_categoria pc
           INNER JOIN categorias c ON c.id = pc.categoria_id`
        )
        .all();
      console.table(filas);
    }
  )
  .command(
    "set-parametro",
    "Actualiza márgenes y umbrales de una categoría",
    (y) =>
      y
        .option("cat", { type: "number", demandOption: true, describe: "ID de categoría" })
        .option("margen", { type: "number", demandOption: true })
        .option("umbralRojo", { type: "number", demandOption: true })
        .option("umbralAmarillo", { type: "number", demandOption: true })
        .option("min", { type: "number", demandOption: true, describe: "Rango mínimo (%)" })
        .option("max", { type: "number", demandOption: true, describe: "Rango máximo (%)" })
        .option("usuario", { type: "string", default: "cli" }),
    (args) => {
      const instancia = db();
      const existente = instancia
        .prepare("SELECT * FROM parametros_categoria WHERE categoria_id = ?")
        .get(args.cat) as any;
      if (!existente) {
        console.error("Categoría no encontrada");
        process.exit(1);
      }

      const { errors, values } = validarParametrosEntrada({
        margen: args.margen,
        umbralRojo: args.umbralRojo,
        umbralAmarillo: args.umbralAmarillo,
        rangoEdicionMin: args.min,
        rangoEdicionMax: args.max,
      });

      if (errors.length > 0) {
        console.error(errors.join(". "));
        process.exit(1);
      }

      instancia
        .prepare(
          `UPDATE parametros_categoria
           SET margen = ?, umbral_rojo = ?, umbral_amarillo = ?, rango_edicion_min = ?, rango_edicion_max = ?,
               updated_at = CURRENT_TIMESTAMP
           WHERE categoria_id = ?`
        )
        .run(
          values.margen,
          values.umbralRojo,
          values.umbralAmarillo,
          values.rangoEdicionMin,
          values.rangoEdicionMax,
          args.cat
        );

      registrarLog({
        entidad: "parametros_categoria",
        entidadId: Number(args.cat),
        accion: "update_parametros",
        usuario: String(args.usuario),
        rol: "Gerencia",
        antes: existente,
        despues: values,
      });

      console.log(`Parámetros actualizados para categoría ${args.cat}`);
    }
  )
  .demandCommand(1)
  .strict()
  .help()
  .parse();
