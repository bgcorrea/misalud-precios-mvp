INSERT INTO categorias (id, nombre, fragmentado) VALUES
  (1, 'Medicamentos Genéricos', 0),
  (2, 'Suplementos y Bienestar', 0),
  (3, 'Tratamientos Fragmentados', 1);

INSERT INTO parametros_categoria (categoria_id, margen, umbral_rojo, umbral_amarillo, rango_edicion_min, rango_edicion_max)
VALUES
  (1, 0.25, 20, 8, -5, 5),
  (2, 0.30, 18, 7, -7, 7),
  (3, 0.35, 22, 10, -4, 4);

INSERT INTO productos (codigo_interno, codigo_barras, descripcion, categoria_id, fragmentado, factor_fragmentacion, precio_actual)
VALUES
  ('MED-0001', '7501000100011', 'Paracetamol 500 mg 20 comprimidos', 1, 0, 1, 18.90),
  ('MED-0002', '7501000100028', 'Ibuprofeno 400 mg 24 cápsulas', 1, 0, 1, 24.90),
  ('MED-0003', '7501000100035', 'Amoxicilina 500 mg 12 cápsulas', 1, 0, 1, 32.40),
  ('SUP-0101', '7502000200018', 'Vitamina C 1g efervescente x10', 2, 0, 1, 45.00),
  ('SUP-0102', '7502000200025', 'Complejo B 100 x30', 2, 0, 1, 52.80),
  ('SUP-0103', '7502000200032', 'Omega 3 concentrado x60', 2, 0, 1, 89.50),
  ('FRG-1001', '7503000300015', 'Solución pediátrica 120 ml (12 dosis)', 3, 1, 12, 5.80),
  ('FRG-1002', '7503000300022', 'Colirio estéril 60 ml (20 dosis)', 3, 1, 20, 6.40),
  ('FRG-1003', '7503000300039', 'Antibiótico suspensión 90 ml (15 dosis)', 3, 1, 15, 7.10),
  ('MED-0004', '7501000100042', 'Loratadina 10 mg 30 tabletas', 1, 0, 1, 28.10),
  ('MED-0005', '7501000100059', 'Omeprazol 20 mg 14 cápsulas', 1, 0, 1, 34.50),
  ('SUP-0104', '7502000200049', 'Calcio + D3 600mg x60', 2, 0, 1, 72.90);

INSERT INTO compras (producto_id, fecha, cantidad, costo_total, unidad) VALUES
  (1, DATE('now','-90 day'), 80, 960.00, 'unidad'),
  (1, DATE('now','-32 day'), 100, 1180.00, 'unidad'),
  (1, DATE('now','-8 day'), 120, 1392.00, 'unidad'),

  (2, DATE('now','-88 day'), 90, 1620.00, 'unidad'),
  (2, DATE('now','-38 day'), 110, 2035.00, 'unidad'),
  (2, DATE('now','-10 day'), 130, 2470.00, 'unidad'),

  (3, DATE('now','-86 day'), 70, 1890.00, 'unidad'),
  (3, DATE('now','-40 day'), 85, 2312.50, 'unidad'),
  (3, DATE('now','-12 day'), 95, 2602.50, 'unidad'),

  (4, DATE('now','-84 day'), 60, 1980.00, 'unidad'),
  (4, DATE('now','-33 day'), 80, 2688.00, 'unidad'),
  (4, DATE('now','-9 day'), 90, 3096.00, 'unidad'),

  (5, DATE('now','-87 day'), 55, 1870.00, 'unidad'),
  (5, DATE('now','-35 day'), 65, 2288.00, 'unidad'),
  (5, DATE('now','-11 day'), 75, 2640.00, 'unidad'),

  (6, DATE('now','-93 day'), 40, 2480.00, 'unidad'),
  (6, DATE('now','-36 day'), 45, 2835.00, 'unidad'),
  (6, DATE('now','-13 day'), 55, 3520.00, 'unidad'),

  (7, DATE('now','-92 day'), 30, 540.00, 'pack'),
  (7, DATE('now','-34 day'), 28, 518.00, 'pack'),
  (7, DATE('now','-7 day'), 32, 624.00, 'pack'),

  (8, DATE('now','-91 day'), 20, 400.00, 'pack'),
  (8, DATE('now','-31 day'), 22, 462.00, 'pack'),
  (8, DATE('now','-6 day'), 25, 525.00, 'pack'),

  (9, DATE('now','-95 day'), 26, 481.00, 'pack'),
  (9, DATE('now','-37 day'), 24, 456.00, 'pack'),
  (9, DATE('now','-8 day'), 28, 560.00, 'pack'),

  (10, DATE('now','-89 day'), 75, 1575.00, 'unidad'),
  (10, DATE('now','-33 day'), 85, 1802.50, 'unidad'),
  (10, DATE('now','-6 day'), 95, 1995.00, 'unidad'),

  (11, DATE('now','-94 day'), 65, 1755.00, 'unidad'),
  (11, DATE('now','-32 day'), 70, 1890.00, 'unidad'),
  (11, DATE('now','-9 day'), 90, 2430.00, 'unidad'),

  (12, DATE('now','-88 day'), 50, 2550.00, 'unidad'),
  (12, DATE('now','-30 day'), 55, 2832.50, 'unidad'),
  (12, DATE('now','-7 day'), 60, 3150.00, 'unidad');

INSERT INTO ventas (producto_id, fecha, cantidad, precio_total, unidad) VALUES
  (1, DATE('now','-60 day'), 60, 1134.00, 'unidad'),
  (1, DATE('now','-25 day'), 72, 1360.80, 'unidad'),
  (1, DATE('now','-4 day'), 54, 1020.60, 'unidad'),

  (2, DATE('now','-61 day'), 70, 1736.00, 'unidad'),
  (2, DATE('now','-26 day'), 82, 2034.60, 'unidad'),
  (2, DATE('now','-3 day'), 68, 1689.60, 'unidad'),

  (3, DATE('now','-62 day'), 55, 1899.00, 'unidad'),
  (3, DATE('now','-27 day'), 62, 2145.60, 'unidad'),
  (3, DATE('now','-5 day'), 58, 2004.60, 'unidad'),

  (4, DATE('now','-59 day'), 46, 2070.00, 'unidad'),
  (4, DATE('now','-24 day'), 54, 2430.00, 'unidad'),
  (4, DATE('now','-2 day'), 50, 2250.00, 'unidad'),

  (5, DATE('now','-63 day'), 42, 2217.60, 'unidad'),
  (5, DATE('now','-23 day'), 48, 2534.40, 'unidad'),
  (5, DATE('now','-1 day'), 40, 2112.00, 'unidad'),

  (6, DATE('now','-64 day'), 30, 2685.00, 'unidad'),
  (6, DATE('now','-28 day'), 34, 3043.00, 'unidad'),
  (6, DATE('now','-3 day'), 28, 2506.00, 'unidad'),

  (7, DATE('now','-58 day'), 48, 336.00, 'unidad'),
  (7, DATE('now','-22 day'), 56, 392.00, 'unidad'),
  (7, DATE('now','-2 day'), 52, 364.00, 'unidad'),

  (8, DATE('now','-57 day'), 60, 480.00, 'unidad'),
  (8, DATE('now','-21 day'), 65, 520.00, 'unidad'),
  (8, DATE('now','-1 day'), 58, 464.00, 'unidad'),

  (9, DATE('now','-56 day'), 54, 426.60, 'unidad'),
  (9, DATE('now','-20 day'), 58, 458.20, 'unidad'),
  (9, DATE('now','-2 day'), 52, 410.40, 'unidad'),

  (10, DATE('now','-55 day'), 62, 2041.80, 'unidad'),
  (10, DATE('now','-19 day'), 68, 2234.80, 'unidad'),
  (10, DATE('now','-1 day'), 60, 1974.00, 'unidad'),

  (11, DATE('now','-54 day'), 58, 2143.20, 'unidad'),
  (11, DATE('now','-18 day'), 62, 2291.40, 'unidad'),
  (11, DATE('now','-2 day'), 55, 2036.50, 'unidad'),

  (12, DATE('now','-53 day'), 52, 2773.20, 'unidad'),
  (12, DATE('now','-17 day'), 58, 3093.20, 'unidad'),
  (12, DATE('now','-1 day'), 54, 2882.40, 'unidad');
