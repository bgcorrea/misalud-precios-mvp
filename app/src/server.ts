import express, { NextFunction, Request, Response } from "express";
import path from "path";
import fs from "fs";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { formatISO, subDays, subMonths, format } from "date-fns";
import { APP_CONFIG } from "./config";
import { getDb } from "./db";
import { FragmentConfig } from "./domain/fragments";
import { Compra, calcularCostoPromedioPonderado, calcularPrecioSugerido, calcularSemaforo } from "./domain/pricing";
import {
  CategoriaParametros,
  validarRangoEdicion,
} from "./domain/params";
import { validarParametrosEntrada } from "./utils/parametros";
import { obtenerRol, requireGerencia, RolUsuario } from "./middleware/auth";
import { errorHandler, notFoundHandler } from "./middleware/error";
import { authenticateUser, generateToken, validateToken } from "./auth";

function detectProjectRoot(): string {
  const candidates = [
    process.cwd(),
    path.resolve(process.cwd(), ".."),
    path.resolve(process.cwd(), "..", ".."),
  ];

  for (const candidate of candidates) {
    if (path.basename(candidate) === "misalud-precios-mvp" ||
        path.basename(path.resolve(candidate)) === "misalud-precios-mvp") {
      return candidate;
    }
    if (
      path.basename(candidate) === "app" &&
      fs.existsSync(path.resolve(candidate, "../db"))
    ) {
      return path.resolve(candidate, "..");
    }
  }

  return process.cwd();
}

const ROOT_PATH = detectProjectRoot();

const adminLimiter = rateLimit({
  windowMs: APP_CONFIG.rateLimitWindowMs,
  limit: APP_CONFIG.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
});

function clampNumber(value: number, min: number, max: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(Math.max(value, min), max);
}

function parseLimit(value: unknown, fallback: number, max = 200) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return clampNumber(parsed, 1, max, fallback);
}

function mapParametros(rows: ParametrosRow[]): Map<number, CategoriaParametros> {
  const mapa = new Map<number, CategoriaParametros>();
  for (const row of rows) {
    mapa.set(row.categoria_id, {
      margen: row.margen,
      umbralRojo: row.umbral_rojo,
      umbralAmarillo: row.umbral_amarillo,
      rangoEdicionMin: row.rango_edicion_min,
      rangoEdicionMax: row.rango_edicion_max,
    });
  }
  return mapa;
}

function obtenerConfigFragmento(row: ProductoRow): FragmentConfig {
  return {
    fragmentado: row.fragmentado === 1,
    factorConversion: row.factor_fragmentacion || 1,
  };
}

function construirCalculoProducto(
  row: ProductoRow,
  parametros: CategoriaParametros,
  compras: Compra[]
) {
  const fragmentConfig = obtenerConfigFragmento(row);
  const cpp = calcularCostoPromedioPonderado(compras, fragmentConfig);
  const calculo = calcularPrecioSugerido(cpp, parametros);

  const precioReferencia =
    calculo.precioPropuesto ?? row.precio_propuesto ?? row.precio_actual;

  const semaforo = calcularSemaforo(
    row.precio_actual,
    row.precio_propuesto ?? precioReferencia,
    parametros
  );

  return {
    calculo,
    fragmentConfig,
    semaforo,
  };
}

function parseJson(value: string | null | undefined) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function registrarLog(db: any, payload: {
  entidad: string;
  entidadId?: number | null;
  accion: string;
  usuario: string;
  rol: RolUsuario | "Sistema" | null;
  antes?: unknown;
  despues?: unknown;
}) {
  db.prepare(
    `INSERT INTO logs (fecha, usuario, rol, entidad, entidad_id, accion, datos_antes, datos_despues)
     VALUES (CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    payload.usuario,
    payload.rol,
    payload.entidad,
    payload.entidadId ?? null,
    payload.accion,
    JSON.stringify(payload.antes ?? {}),
    JSON.stringify(payload.despues ?? {})
  );
}

function asyncHandler<T>(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<T> | T
) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      Promise.resolve(handler(req, res, next)).catch(next);
    } catch (error) {
      next(error);
    }
  };
}

function buildCsvRow(values: string[], separator: string) {
  return values
    .map((value) => {
      const needsWrap = value.includes(separator) || value.includes('"') || /\s/.test(value);
      const sanitized = value.replace(/"/g, '""');
      return needsWrap ? `"${sanitized}"` : sanitized;
    })
    .join(separator);
}

type ProductoRow = {
  id: number;
  codigo_interno: string;
  codigo_barras: string;
  descripcion: string;
  categoria_id: number;
  categoria_nombre: string;
  fragmentado: number;
  factor_fragmentacion: number;
  precio_actual: number;
  precio_propuesto: number | null;
  precio_sugerido: number | null;
};

type ParametrosRow = {
  categoria_id: number;
  margen: number;
  umbral_rojo: number;
  umbral_amarillo: number;
  rango_edicion_min: number;
  rango_edicion_max: number;
};

function ensureNumeroPositivo(valor: unknown): number | null {
  const parsed = Number(valor);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

export function buildServer() {
  const app = express();
  const dbProvider = () => getDb();

  app.use(cors({ origin: true }));
  app.use(express.json());
  app.use((req, res, next) => {
    res.setHeader("X-Service", "misalud-precios");
    next();
  });

  app.get(
    "/api/health",
    asyncHandler((_req, res) => {
      res.json({ ok: true, service: "misalud-precios", ts: new Date().toISOString() });
    })
  );

  // Endpoints de autenticación
  app.post(
    "/api/auth/login",
    asyncHandler((req, res) => {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: "Username y password son requeridos" });
      }

      const user = authenticateUser(username, password);

      if (!user) {
        return res.status(401).json({ error: "Credenciales inválidas" });
      }

      const token = generateToken(user);

      res.json({
        success: true,
        token,
        user: {
          username: user.username,
          nombre: user.nombre,
          rol: user.rol
        }
      });
    })
  );

  app.post(
    "/api/auth/validate",
    asyncHandler((req, res) => {
      const token = req.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        return res.status(401).json({ error: "Token no proporcionado" });
      }

      const user = validateToken(token);

      if (!user) {
        return res.status(401).json({ error: "Token inválido o expirado" });
      }

      res.json({
        valid: true,
        user: {
          username: user.username,
          nombre: user.nombre,
          rol: user.rol
        }
      });
    })
  );

  app.get(
    "/api/categorias",
    asyncHandler((_req, res) => {
      const db = dbProvider();
      const categorias = db
        .prepare("SELECT DISTINCT nombre FROM categorias ORDER BY nombre")
        .all() as { nombre: string }[];
      res.json(categorias.map(c => c.nombre));
    })
  );

  app.get(
    "/api/productos",
    asyncHandler((req, res) => {
      const db = dbProvider();
      const page = clampNumber(Number(req.query.page) || 1, 1, Number.MAX_SAFE_INTEGER, 1);
      const rawPageSize = Number(req.query.pageSize);
      const pageSize = clampNumber(rawPageSize || 25, 1, 100, 25);
      const offset = (page - 1) * pageSize;

      // Filtros de búsqueda
      const search = req.query.search ? String(req.query.search).trim() : "";
      const categoria = req.query.categoria ? String(req.query.categoria) : "";
      const semaforo = req.query.semaforo ? String(req.query.semaforo).toUpperCase() : "";

      // Construir WHERE clause dinámicamente
      const whereClauses: string[] = [];
      const whereParams: any[] = [];

      if (search) {
        whereClauses.push("(p.codigo_interno LIKE ? OR p.codigo_barras LIKE ? OR p.descripcion LIKE ?)");
        const searchPattern = `%${search}%`;
        whereParams.push(searchPattern, searchPattern, searchPattern);
      }

      if (categoria) {
        whereClauses.push("c.nombre = ?");
        whereParams.push(categoria);
      }

      const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

      // Si hay filtro de semáforo, necesitamos obtener TODOS los productos filtrados para calcular semáforo
      // y luego aplicar paginación. Para datasets grandes, esto se optimizaría con una vista materializada.
      const productos = db
        .prepare(
          `SELECT p.*, c.nombre as categoria_nombre, c.fragmentado
           FROM productos p
           INNER JOIN categorias c ON c.id = p.categoria_id
           ${whereClause}
           ORDER BY p.codigo_interno`
        )
        .all(...whereParams) as ProductoRow[];

      if (productos.length === 0) {
        return res.json({
          page,
          pageSize,
          total: 0,
          data: [],
        });
      }

      const parametrosRows = db
        .prepare(
          "SELECT * FROM parametros_categoria WHERE categoria_id IN (" +
            productos.map(() => "?").join(",") +
            ")"
        )
        .all(...productos.map((p) => p.categoria_id)) as ParametrosRow[];

      const parametrosMap = mapParametros(parametrosRows);

      const comprasStmt = db.prepare(
        `SELECT cantidad, costo_total as costoTotal, unidad, fecha
         FROM compras WHERE producto_id = ?
         ORDER BY fecha DESC LIMIT 25`
      );

      // Procesar todos los productos y calcular semáforo
      const allData = productos.map((row) => {
        const parametros = parametrosMap.get(row.categoria_id);
        if (!parametros) {
          throw Object.assign(new Error(`No se encontraron parámetros para la categoría ${row.categoria_id}`), { status: 500 });
        }

        const compras = comprasStmt.all(row.id) as Compra[];
        const { calculo, semaforo } = construirCalculoProducto(row, parametros, compras);

        if (calculo.precioPropuesto !== null) {
          db.prepare(
            "UPDATE productos SET precio_sugerido = ?, ultimo_cpp = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
          ).run(calculo.precioPropuesto, calculo.cpp, row.id);
        }

        return {
          id: row.id,
          codigoInterno: row.codigo_interno,
          codigoBarras: row.codigo_barras,
          descripcion: row.descripcion,
          categoria: row.categoria_nombre,
          fragmentado: row.fragmentado === 1,
          costoPromedio: calculo.cpp,
          precioActual: Number(row.precio_actual.toFixed(2)),
          precioSugerido: calculo.precioPropuesto,
          precioPropuesto:
            row.precio_propuesto ??
            calculo.precioPropuesto ??
            Number(row.precio_actual.toFixed(2)),
          margenAplicado: calculo.margenAplicado,
          semaforo,
          parametrosCategoria: parametros,
        };
      });

      // Aplicar filtro de semáforo si existe
      const filteredData = semaforo
        ? allData.filter(p => p.semaforo === semaforo)
        : allData;

      // Aplicar paginación sobre datos filtrados
      const total = filteredData.length;
      const data = filteredData.slice(offset, offset + pageSize);

      res.json({
        page,
        pageSize,
        total,
        data,
      });
    })
  );

  app.put(
    "/api/productos/:id/precio-propuesto",
    asyncHandler((req, res) => {
      const db = dbProvider();
      const rol = obtenerRol(req) ?? "Operador";
      const usuario = String(req.body.usuario || "operador");
      const productoId = Number(req.params.id);

      if (!Number.isInteger(productoId) || productoId <= 0) {
        return res.status(400).json({ mensaje: "Identificador inválido" });
      }

      const nuevoPrecio = ensureNumeroPositivo(req.body.precioPropuesto);
      if (nuevoPrecio === null) {
        return res
          .status(400)
          .json({ mensaje: "Precio propuesto inválido o faltante." });
      }

      const producto = db
        .prepare(
          `SELECT p.*, c.nombre AS categoria_nombre, c.fragmentado,
                  pc.margen, pc.umbral_rojo, pc.umbral_amarillo,
                  pc.rango_edicion_min, pc.rango_edicion_max
           FROM productos p
           INNER JOIN categorias c ON c.id = p.categoria_id
           INNER JOIN parametros_categoria pc ON pc.categoria_id = p.categoria_id
           WHERE p.id = ?`
        )
        .get(productoId) as (ProductoRow & ParametrosRow) | undefined;

      if (!producto) {
        return res.status(404).json({ mensaje: "Producto no encontrado." });
      }

      const parametros: CategoriaParametros = {
        margen: producto.margen,
        umbralRojo: producto.umbral_rojo,
        umbralAmarillo: producto.umbral_amarillo,
        rangoEdicionMin: producto.rango_edicion_min,
        rangoEdicionMax: producto.rango_edicion_max,
      };

      const rango = validarRangoEdicion(
        producto.precio_sugerido ?? producto.precio_actual,
        nuevoPrecio,
        parametros
      );

      if (!rango.valido) {
        return res.status(400).json({ mensaje: rango.mensaje });
      }

      const antes = {
        precio_propuesto: producto.precio_propuesto,
      };

      db.prepare(
        "UPDATE productos SET precio_propuesto = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      ).run(nuevoPrecio, productoId);

      registrarLog(db, {
        entidad: "producto",
        entidadId: productoId,
        accion: "update_precio_propuesto",
        usuario,
        rol,
        antes,
        despues: { precio_propuesto: nuevoPrecio },
      });

      res.json({ mensaje: "Precio propuesto actualizado." });
    })
  );

  app.get(
    "/api/productos/:id/historico",
    asyncHandler((req, res) => {
      const db = dbProvider();
      const productoId = Number(req.params.id);
      if (!Number.isInteger(productoId) || productoId <= 0) {
        return res.status(400).json({ mensaje: "Identificador inválido" });
      }

      const ahora = new Date();
      const rangos = {
        semana: subDays(ahora, 7),
        mes: subDays(ahora, 30),
        trimestre: subMonths(ahora, 3),
      };

      const comprasStmt = db.prepare(
        `SELECT cantidad, costo_total, unidad, fecha
         FROM compras WHERE producto_id = ? AND fecha >= ? ORDER BY fecha DESC LIMIT 3`
      );
      const ventasStmt = db.prepare(
        `SELECT cantidad, precio_total, unidad, fecha
         FROM ventas WHERE producto_id = ? AND fecha >= ? ORDER BY fecha DESC LIMIT 3`
      );

      const response = {
        compras: {
          semana: comprasStmt.all(
            productoId,
            formatISO(rangos.semana, { representation: "date" })
          ),
          mes: comprasStmt.all(
            productoId,
            formatISO(rangos.mes, { representation: "date" })
          ),
          trimestre: comprasStmt.all(
            productoId,
            formatISO(rangos.trimestre, { representation: "date" })
          ),
        },
        ventas: {
          semana: ventasStmt.all(
            productoId,
            formatISO(rangos.semana, { representation: "date" })
          ),
          mes: ventasStmt.all(
            productoId,
            formatISO(rangos.mes, { representation: "date" })
          ),
          trimestre: ventasStmt.all(
            productoId,
            formatISO(rangos.trimestre, { representation: "date" })
          ),
        },
      };

      res.json(response);
    })
  );

  app.use("/api/parametros", adminLimiter);

  app.get(
    "/api/parametros",
    asyncHandler((_req, res) => {
      const db = dbProvider();
      const rows = db
        .prepare(
          `SELECT pc.*, c.nombre as categoria_nombre
           FROM parametros_categoria pc
           INNER JOIN categorias c ON c.id = pc.categoria_id`
        )
        .all();
      res.json(rows);
    })
  );

  app.put(
    "/api/parametros/:categoriaId",
    requireGerencia,
    asyncHandler((req, res) => {
      const db = dbProvider();
      const usuario = String(req.body.usuario || "gerencia");
      const categoriaId = Number(req.params.categoriaId);

      if (!Number.isInteger(categoriaId) || categoriaId <= 0) {
        return res.status(400).json({ mensaje: "Identificador inválido" });
      }

      const existente = db
        .prepare("SELECT * FROM parametros_categoria WHERE categoria_id = ?")
        .get(categoriaId) as ParametrosRow | undefined;

      if (!existente) {
        return res.status(404).json({ mensaje: "Categoría no encontrada" });
      }

      const { errors, values } = validarParametrosEntrada(req.body);
      if (errors.length > 0) {
        return res.status(400).json({ mensaje: errors.join(". ") });
      }

      db.prepare(
        `UPDATE parametros_categoria
         SET margen = ?, umbral_rojo = ?, umbral_amarillo = ?, rango_edicion_min = ?, rango_edicion_max = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE categoria_id = ?`
      ).run(
        values.margen,
        values.umbralRojo,
        values.umbralAmarillo,
        values.rangoEdicionMin,
        values.rangoEdicionMax,
        categoriaId
      );

      registrarLog(db, {
        entidad: "parametros_categoria",
        entidadId: categoriaId,
        accion: "update_parametros",
        usuario,
        rol: res.locals.rol ?? "Gerencia",
        antes: existente,
        despues: values,
      });

      res.json({ mensaje: "Parámetros actualizados." });
    })
  );

  app.use("/api/listas", adminLimiter);

  app.post(
    "/api/listas/generar",
    requireGerencia,
    asyncHandler((req, res) => {
      const db = dbProvider();
      const usuario = String(req.body.usuario || "gerencia");

      const productos = db
        .prepare(
          `SELECT id, precio_propuesto, precio_sugerido, precio_actual
           FROM productos ORDER BY codigo_interno`
        )
        .all() as {
        id: number;
        precio_propuesto: number | null;
        precio_sugerido: number | null;
        precio_actual: number;
      }[];

      const vigente = db
        .prepare("SELECT id FROM listas_base WHERE vigente = 1 ORDER BY id DESC LIMIT 1")
        .get() as { id: number } | undefined;
      if (vigente) {
        db.prepare("UPDATE listas_base SET vigente = 0 WHERE id = ?").run(vigente.id);
      }

      const ultimoCodigo = db
        .prepare("SELECT codigo FROM listas_base ORDER BY id DESC LIMIT 1")
        .get() as { codigo: string } | undefined;

      const correlativo = ultimoCodigo
        ? String(Number(ultimoCodigo.codigo) + 1).padStart(3, "0")
        : "001";

      const lista = db
        .prepare(
          `INSERT INTO listas_base (codigo, fecha_generacion, vigente)
           VALUES (?, CURRENT_TIMESTAMP, 1)`
        )
        .run(correlativo);

      const listaId = Number(lista.lastInsertRowid);

      const insertItem = db.prepare(
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

      registrarLog(db, {
        entidad: "lista_base",
        entidadId: listaId,
        accion: "generar_lista_base",
        usuario,
        rol: res.locals.rol ?? "Gerencia",
        antes: null,
        despues: { codigo: correlativo, totalProductos: productos.length },
      });

      res.status(201).json({
        mensaje: "Lista base generada.",
        id: listaId,
        codigo: correlativo,
      });
    })
  );

  app.get(
    "/api/listas/vigente",
    asyncHandler((_req, res) => {
      const db = dbProvider();
      const lista = db
        .prepare(
          `SELECT id, codigo, fecha_generacion
           FROM listas_base WHERE vigente = 1 ORDER BY id DESC LIMIT 1`
        )
        .get();

      if (!lista) {
        return res.status(404).json({ mensaje: "No hay listas vigentes." });
      }

      res.json(lista);
    })
  );

  app.get(
    "/api/listas/:id/descargar",
    asyncHandler((req, res) => {
      const db = dbProvider();
      const listaId = Number(req.params.id);
      if (!Number.isInteger(listaId) || listaId <= 0) {
        return res.status(400).json({ mensaje: "Identificador inválido" });
      }

      const lista = db
        .prepare("SELECT codigo, fecha_generacion FROM listas_base WHERE id = ?")
        .get(listaId) as { codigo: string; fecha_generacion: string } | undefined;

      if (!lista) {
        return res.status(404).json({ mensaje: "Lista no encontrada." });
      }

      const productos = db
        .prepare(
          `SELECT p.codigo_interno, p.codigo_barras, p.descripcion, i.precio_propuesto
           FROM listas_base_items i
           INNER JOIN productos p ON p.id = i.producto_id
           WHERE i.lista_id = ?
           ORDER BY p.codigo_interno`
        )
        .all(listaId) as {
        codigo_interno: string;
        codigo_barras: string;
        descripcion: string;
        precio_propuesto: number;
      }[];

      const separatorParam = typeof req.query.sep === "string" ? req.query.sep : undefined;
      const separator = separatorParam === ";" ? ";" : APP_CONFIG.csvDefaultSeparator;

      const header = buildCsvRow(
        ["CodigoInterno", "CodigoBarras", "Descripcion", "PrecioPropuesto"],
        separator
      );
      const rows = productos
        .map((p) =>
          buildCsvRow(
            [
              p.codigo_interno,
              p.codigo_barras,
              p.descripcion,
              p.precio_propuesto.toFixed(2),
            ],
            separator
          )
        )
        .join("\n");
      const csvContent = `${header}\n${rows}`;

      const fecha = format(new Date(lista.fecha_generacion), "yyyyMMdd");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=lista_${listaId}_${fecha}.csv`
      );
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.send(csvContent);
    })
  );

  app.get(
    "/api/logs",
    asyncHandler((req, res) => {
      const db = dbProvider();
      const limit = parseLimit(req.query.limit, 50, 200);
      const rows = db
        .prepare(
          `SELECT id, entidad, entidad_id, accion, usuario, datos_antes, datos_despues, created_at
           FROM logs
           ORDER BY created_at DESC
           LIMIT ?`
        )
        .all(limit) as Array<{
        id: number;
        entidad: string;
        entidad_id: number | null;
        accion: string;
        usuario: string;
        datos_antes: string | null;
        datos_despues: string | null;
        created_at: string;
      }>;

      res.json(
        rows.map((log) => ({
          id: log.id,
          entidad: log.entidad,
          entidad_id: log.entidad_id,
          accion: log.accion,
          usuario: log.usuario,
          antes: parseJson(log.datos_antes),
          despues: parseJson(log.datos_despues),
          created_at: log.created_at,
        }))
      );
    })
  );

  app.get(
    "/api/logs/:entidad/:id",
    asyncHandler((req, res) => {
      const db = dbProvider();
      const limit = parseLimit(req.query.limit, 50, 200);
      const entidad = String(req.params.entidad);
      const entidadId = Number(req.params.id);
      if (!Number.isFinite(entidadId)) {
        return res.status(400).json({ mensaje: "Identificador inválido" });
      }

      const rows = db
        .prepare(
          `SELECT id, entidad, entidad_id, accion, usuario, datos_antes, datos_despues, created_at
           FROM logs
           WHERE entidad = ? AND entidad_id = ?
           ORDER BY created_at DESC
           LIMIT ?`
        )
        .all(entidad, entidadId, limit) as Array<{
        id: number;
        entidad: string;
        entidad_id: number | null;
        accion: string;
        usuario: string;
        datos_antes: string | null;
        datos_despues: string | null;
        created_at: string;
      }>;

      res.json(
        rows.map((log) => ({
          id: log.id,
          entidad: log.entidad,
          entidad_id: log.entidad_id,
          accion: log.accion,
          usuario: log.usuario,
          antes: parseJson(log.datos_antes),
          despues: parseJson(log.datos_despues),
          created_at: log.created_at,
        }))
      );
    })
  );

  app.use("/ui", express.static(path.resolve(ROOT_PATH, "app", "src", "ui")));

  // Ruta raíz redirige al login
  app.get(
    "/",
    asyncHandler((_req, res) => {
      res.sendFile(path.resolve(ROOT_PATH, "app", "src", "ui", "login.html"));
    })
  );

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

if (process.env.NODE_ENV !== "test" && !process.env.JEST_WORKER_ID) {
  const app = buildServer();
  app.listen(APP_CONFIG.port, APP_CONFIG.host, () => {
    console.log(
      `Servidor Misalud precios activo en http://${APP_CONFIG.host}:${APP_CONFIG.port}`
    );
  });
}
