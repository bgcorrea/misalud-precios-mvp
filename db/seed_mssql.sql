SET IDENTITY_INSERT dbo.categorias ON;
INSERT INTO dbo.categorias (id, nombre, fragmentado)
VALUES 
  (1, 'Medicamentos Genéricos', 0),
  (2, 'Suplementos y Bienestar', 0),
  (3, 'Tratamientos Fragmentados', 1);
SET IDENTITY_INSERT dbo.categorias OFF;
GO

SET IDENTITY_INSERT dbo.parametros_categoria ON;
INSERT INTO dbo.parametros_categoria
  (id, categoria_id, margen, umbral_rojo, umbral_amarillo, rango_edicion_min, rango_edicion_max)
VALUES
  (1, 1, 0.25, 20, 8, -5, 5),
  (2, 2, 0.30, 18, 7, -7, 7),
  (3, 3, 0.35, 22, 10, -4, 4);
SET IDENTITY_INSERT dbo.parametros_categoria OFF;
GO

SET IDENTITY_INSERT dbo.productos ON;
INSERT INTO dbo.productos
  (id, codigo_interno, codigo_barras, descripcion, categoria_id, fragmentado, factor_fragmentacion, precio_actual)
VALUES
  (1, 'MED-0001', '7501000100011', 'Paracetamol 500 mg 20 comprimidos', 1, 0, 1, 18.90),
  (2, 'MED-0002', '7501000100028', 'Ibuprofeno 400 mg 24 cápsulas', 1, 0, 1, 24.90),
  (3, 'MED-0003', '7501000100035', 'Amoxicilina 500 mg 12 cápsulas', 1, 0, 1, 32.40),
  (4, 'SUP-0101', '7502000200018', 'Vitamina C 1g efervescente x10', 2, 0, 1, 45.00),
  (5, 'SUP-0102', '7502000200025', 'Complejo B 100 x30', 2, 0, 1, 52.80),
  (6, 'SUP-0103', '7502000200032', 'Omega 3 concentrado x60', 2, 0, 1, 89.50),
  (7, 'FRG-1001', '7503000300015', 'Solución pediátrica 120 ml (12 dosis)', 3, 1, 12, 5.80),
  (8, 'FRG-1002', '7503000300022', 'Colirio estéril 60 ml (20 dosis)', 3, 1, 20, 6.40),
  (9, 'FRG-1003', '7503000300039', 'Antibiótico suspensión 90 ml (15 dosis)', 3, 1, 15, 7.10),
  (10, 'MED-0004', '7501000100042', 'Loratadina 10 mg 30 tabletas', 1, 0, 1, 28.10),
  (11, 'MED-0005', '7501000100059', 'Omeprazol 20 mg 14 cápsulas', 1, 0, 1, 34.50),
  (12, 'SUP-0104', '7502000200049', 'Calcio + D3 600mg x60', 2, 0, 1, 72.90);
SET IDENTITY_INSERT dbo.productos OFF;
GO

DECLARE @hoy DATE = CAST(GETDATE() AS DATE);

INSERT INTO dbo.compras (producto_id, fecha, cantidad, costo_total, unidad) VALUES
  (1, DATEADD(DAY, -90, @hoy), 80, 960.00, 'unidad'),
  (1, DATEADD(DAY, -32, @hoy), 100, 1180.00, 'unidad'),
  (1, DATEADD(DAY, -8, @hoy), 120, 1392.00, 'unidad'),

  (2, DATEADD(DAY, -88, @hoy), 90, 1620.00, 'unidad'),
  (2, DATEADD(DAY, -38, @hoy), 110, 2035.00, 'unidad'),
  (2, DATEADD(DAY, -10, @hoy), 130, 2470.00, 'unidad'),

  (3, DATEADD(DAY, -86, @hoy), 70, 1890.00, 'unidad'),
  (3, DATEADD(DAY, -40, @hoy), 85, 2312.50, 'unidad'),
  (3, DATEADD(DAY, -12, @hoy), 95, 2602.50, 'unidad'),

  (4, DATEADD(DAY, -84, @hoy), 60, 1980.00, 'unidad'),
  (4, DATEADD(DAY, -33, @hoy), 80, 2688.00, 'unidad'),
  (4, DATEADD(DAY, -9, @hoy), 90, 3096.00, 'unidad'),

  (5, DATEADD(DAY, -87, @hoy), 55, 1870.00, 'unidad'),
  (5, DATEADD(DAY, -35, @hoy), 65, 2288.00, 'unidad'),
  (5, DATEADD(DAY, -11, @hoy), 75, 2640.00, 'unidad'),

  (6, DATEADD(DAY, -93, @hoy), 40, 2480.00, 'unidad'),
  (6, DATEADD(DAY, -36, @hoy), 45, 2835.00, 'unidad'),
  (6, DATEADD(DAY, -13, @hoy), 55, 3520.00, 'unidad'),

  (7, DATEADD(DAY, -92, @hoy), 30, 540.00, 'pack'),
  (7, DATEADD(DAY, -34, @hoy), 28, 518.00, 'pack'),
  (7, DATEADD(DAY, -7, @hoy), 32, 624.00, 'pack'),

  (8, DATEADD(DAY, -91, @hoy), 20, 400.00, 'pack'),
  (8, DATEADD(DAY, -31, @hoy), 22, 462.00, 'pack'),
  (8, DATEADD(DAY, -6, @hoy), 25, 525.00, 'pack'),

  (9, DATEADD(DAY, -95, @hoy), 26, 481.00, 'pack'),
  (9, DATEADD(DAY, -37, @hoy), 24, 456.00, 'pack'),
  (9, DATEADD(DAY, -8, @hoy), 28, 560.00, 'pack'),

  (10, DATEADD(DAY, -89, @hoy), 75, 1575.00, 'unidad'),
  (10, DATEADD(DAY, -33, @hoy), 85, 1802.50, 'unidad'),
  (10, DATEADD(DAY, -6, @hoy), 95, 1995.00, 'unidad'),

  (11, DATEADD(DAY, -94, @hoy), 65, 1755.00, 'unidad'),
  (11, DATEADD(DAY, -32, @hoy), 70, 1890.00, 'unidad'),
  (11, DATEADD(DAY, -9, @hoy), 90, 2430.00, 'unidad'),

  (12, DATEADD(DAY, -88, @hoy), 50, 2550.00, 'unidad'),
  (12, DATEADD(DAY, -30, @hoy), 55, 2832.50, 'unidad'),
  (12, DATEADD(DAY, -7, @hoy), 60, 3150.00, 'unidad');
GO

INSERT INTO dbo.ventas (producto_id, fecha, cantidad, precio_total, unidad) VALUES
  (1, DATEADD(DAY, -60, @hoy), 60, 1134.00, 'unidad'),
  (1, DATEADD(DAY, -25, @hoy), 72, 1360.80, 'unidad'),
  (1, DATEADD(DAY, -4, @hoy), 54, 1020.60, 'unidad'),

  (2, DATEADD(DAY, -61, @hoy), 70, 1736.00, 'unidad'),
  (2, DATEADD(DAY, -26, @hoy), 82, 2034.60, 'unidad'),
  (2, DATEADD(DAY, -3, @hoy), 68, 1689.60, 'unidad'),

  (3, DATEADD(DAY, -62, @hoy), 55, 1899.00, 'unidad'),
  (3, DATEADD(DAY, -27, @hoy), 62, 2145.60, 'unidad'),
  (3, DATEADD(DAY, -5, @hoy), 58, 2004.60, 'unidad'),

  (4, DATEADD(DAY, -59, @hoy), 46, 2070.00, 'unidad'),
  (4, DATEADD(DAY, -24, @hoy), 54, 2430.00, 'unidad'),
  (4, DATEADD(DAY, -2, @hoy), 50, 2250.00, 'unidad'),

  (5, DATEADD(DAY, -63, @hoy), 42, 2217.60, 'unidad'),
  (5, DATEADD(DAY, -23, @hoy), 48, 2534.40, 'unidad'),
  (5, DATEADD(DAY, -1, @hoy), 40, 2112.00, 'unidad'),

  (6, DATEADD(DAY, -64, @hoy), 30, 2685.00, 'unidad'),
  (6, DATEADD(DAY, -28, @hoy), 34, 3043.00, 'unidad'),
  (6, DATEADD(DAY, -3, @hoy), 28, 2506.00, 'unidad'),

  (7, DATEADD(DAY, -58, @hoy), 48, 336.00, 'unidad'),
  (7, DATEADD(DAY, -22, @hoy), 56, 392.00, 'unidad'),
  (7, DATEADD(DAY, -2, @hoy), 52, 364.00, 'unidad'),

  (8, DATEADD(DAY, -57, @hoy), 60, 480.00, 'unidad'),
  (8, DATEADD(DAY, -21, @hoy), 65, 520.00, 'unidad'),
  (8, DATEADD(DAY, -1, @hoy), 58, 464.00, 'unidad'),

  (9, DATEADD(DAY, -56, @hoy), 54, 426.60, 'unidad'),
  (9, DATEADD(DAY, -20, @hoy), 58, 458.20, 'unidad'),
  (9, DATEADD(DAY, -2, @hoy), 52, 410.40, 'unidad'),

  (10, DATEADD(DAY, -55, @hoy), 62, 2041.80, 'unidad'),
  (10, DATEADD(DAY, -19, @hoy), 68, 2234.80, 'unidad'),
  (10, DATEADD(DAY, -1, @hoy), 60, 1974.00, 'unidad'),

  (11, DATEADD(DAY, -54, @hoy), 58, 2143.20, 'unidad'),
  (11, DATEADD(DAY, -18, @hoy), 62, 2291.40, 'unidad'),
  (11, DATEADD(DAY, -2, @hoy), 55, 2036.50, 'unidad'),

  (12, DATEADD(DAY, -53, @hoy), 52, 2773.20, 'unidad'),
  (12, DATEADD(DAY, -17, @hoy), 58, 3093.20, 'unidad'),
  (12, DATEADD(DAY, -1, @hoy), 54, 2882.40, 'unidad');
GO
