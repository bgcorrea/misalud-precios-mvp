IF OBJECT_ID('dbo.logs', 'U') IS NOT NULL DROP TABLE dbo.logs;
IF OBJECT_ID('dbo.listas_base_items', 'U') IS NOT NULL DROP TABLE dbo.listas_base_items;
IF OBJECT_ID('dbo.listas_base', 'U') IS NOT NULL DROP TABLE dbo.listas_base;
IF OBJECT_ID('dbo.ventas', 'U') IS NOT NULL DROP TABLE dbo.ventas;
IF OBJECT_ID('dbo.compras', 'U') IS NOT NULL DROP TABLE dbo.compras;
IF OBJECT_ID('dbo.productos', 'U') IS NOT NULL DROP TABLE dbo.productos;
IF OBJECT_ID('dbo.parametros_categoria', 'U') IS NOT NULL DROP TABLE dbo.parametros_categoria;
IF OBJECT_ID('dbo.categorias', 'U') IS NOT NULL DROP TABLE dbo.categorias;
GO

CREATE TABLE dbo.categorias (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(120) NOT NULL UNIQUE,
    fragmentado BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);
GO

CREATE TABLE dbo.parametros_categoria (
    id INT IDENTITY(1,1) PRIMARY KEY,
    categoria_id INT NOT NULL,
    margen DECIMAL(6,4) NOT NULL,
    umbral_rojo DECIMAL(5,2) NOT NULL,
    umbral_amarillo DECIMAL(5,2) NOT NULL,
    rango_edicion_min DECIMAL(6,2) NOT NULL,
    rango_edicion_max DECIMAL(6,2) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_parametros_categoria_categoria FOREIGN KEY (categoria_id)
        REFERENCES dbo.categorias(id)
);
GO

CREATE TABLE dbo.productos (
    id INT IDENTITY(1,1) PRIMARY KEY,
    codigo_interno NVARCHAR(40) NOT NULL UNIQUE,
    codigo_barras NVARCHAR(40) NOT NULL UNIQUE,
    descripcion NVARCHAR(200) NOT NULL,
    categoria_id INT NOT NULL,
    fragmentado BIT NOT NULL DEFAULT 0,
    factor_fragmentacion DECIMAL(10,2) NOT NULL DEFAULT 1,
    precio_actual DECIMAL(18,4) NOT NULL,
    precio_propuesto DECIMAL(18,4) NULL,
    precio_sugerido DECIMAL(18,4) NULL,
    ultimo_cpp DECIMAL(18,4) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_productos_categoria FOREIGN KEY (categoria_id)
        REFERENCES dbo.categorias(id)
);
GO

CREATE TABLE dbo.compras (
    id INT IDENTITY(1,1) PRIMARY KEY,
    producto_id INT NOT NULL,
    fecha DATE NOT NULL,
    cantidad DECIMAL(18,3) NOT NULL,
    costo_total DECIMAL(18,4) NOT NULL,
    unidad NVARCHAR(20) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_compras_producto FOREIGN KEY (producto_id)
        REFERENCES dbo.productos(id)
);
GO

CREATE TABLE dbo.ventas (
    id INT IDENTITY(1,1) PRIMARY KEY,
    producto_id INT NOT NULL,
    fecha DATE NOT NULL,
    cantidad DECIMAL(18,3) NOT NULL,
    precio_total DECIMAL(18,4) NOT NULL,
    unidad NVARCHAR(20) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_ventas_producto FOREIGN KEY (producto_id)
        REFERENCES dbo.productos(id)
);
GO

CREATE TABLE dbo.listas_base (
    id INT IDENTITY(1,1) PRIMARY KEY,
    codigo CHAR(3) NOT NULL UNIQUE,
    fecha_generacion DATETIME2 NOT NULL,
    vigente BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);
GO

CREATE TABLE dbo.listas_base_items (
    id INT IDENTITY(1,1) PRIMARY KEY,
    lista_id INT NOT NULL,
    producto_id INT NOT NULL,
    precio_propuesto DECIMAL(12,4) NOT NULL,
    margen_aplicado DECIMAL(6,4) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_listas_items_lista FOREIGN KEY (lista_id)
        REFERENCES dbo.listas_base(id),
    CONSTRAINT FK_listas_items_producto FOREIGN KEY (producto_id)
        REFERENCES dbo.productos(id)
);
GO

CREATE TABLE dbo.logs (
    id INT IDENTITY(1,1) PRIMARY KEY,
    fecha DATETIME2 NOT NULL,
    usuario NVARCHAR(80) NOT NULL,
    rol NVARCHAR(40) NULL,
    entidad NVARCHAR(80) NOT NULL,
    entidad_id INT NULL,
    accion NVARCHAR(120) NOT NULL,
    datos_antes NVARCHAR(MAX) NULL,
    datos_despues NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);
GO

CREATE INDEX IX_productos_codigo_barras ON dbo.productos(codigo_barras);
CREATE INDEX IX_compras_producto_fecha ON dbo.compras(producto_id, fecha);
CREATE INDEX IX_ventas_producto_fecha ON dbo.ventas(producto_id, fecha);
GO
