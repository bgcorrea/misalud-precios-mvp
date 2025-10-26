PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    fragmentado INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS parametros_categoria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    categoria_id INTEGER NOT NULL,
    margen REAL NOT NULL,
    umbral_rojo REAL NOT NULL,
    umbral_amarillo REAL NOT NULL,
    rango_edicion_min REAL NOT NULL,
    rango_edicion_max REAL NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo_interno TEXT NOT NULL UNIQUE,
    codigo_barras TEXT NOT NULL UNIQUE,
    descripcion TEXT NOT NULL,
    categoria_id INTEGER NOT NULL,
    fragmentado INTEGER NOT NULL DEFAULT 0,
    factor_fragmentacion REAL NOT NULL DEFAULT 1,
    precio_actual REAL NOT NULL,
    precio_propuesto REAL,
    precio_sugerido REAL,
    ultimo_cpp REAL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

CREATE TABLE IF NOT EXISTS compras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    producto_id INTEGER NOT NULL,
    fecha TEXT NOT NULL,
    cantidad REAL NOT NULL,
    costo_total REAL NOT NULL,
    unidad TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

CREATE TABLE IF NOT EXISTS ventas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    producto_id INTEGER NOT NULL,
    fecha TEXT NOT NULL,
    cantidad REAL NOT NULL,
    precio_total REAL NOT NULL,
    unidad TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

CREATE TABLE IF NOT EXISTS listas_base (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT NOT NULL UNIQUE,
    fecha_generacion TEXT NOT NULL,
    vigente INTEGER NOT NULL DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS listas_base_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lista_id INTEGER NOT NULL,
    producto_id INTEGER NOT NULL,
    precio_propuesto REAL NOT NULL,
    margen_aplicado REAL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lista_id) REFERENCES listas_base(id),
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT NOT NULL,
    usuario TEXT NOT NULL,
    rol TEXT,
    entidad TEXT NOT NULL,
    entidad_id INTEGER,
    accion TEXT NOT NULL,
    datos_antes TEXT,
    datos_despues TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_productos_codigo_barras ON productos(codigo_barras);
CREATE INDEX IF NOT EXISTS idx_compras_producto_fecha ON compras(producto_id, fecha);
CREATE INDEX IF NOT EXISTS idx_ventas_producto_fecha ON ventas(producto_id, fecha);
