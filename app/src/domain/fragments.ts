export type FragmentConfig = {
  fragmentado: boolean;
  factorConversion: number;
};

export type Transaction = {
  cantidad: number;
  costoTotal?: number;
  precioTotal?: number;
  unidad: "unidad" | "pack";
};

/**
 * Convierte una cantidad a unidades individuales considerando el factor de fragmentación.
 * Siempre garantiza un resultado positivo y evita divisiones por cero.
 */
export function normalizarCantidad(
  cantidad: number,
  unidad: Transaction["unidad"],
  config: FragmentConfig
): number {
  if (cantidad <= 0) {
    return 0;
  }

  if (!config.fragmentado || unidad === "unidad") {
    return cantidad;
  }

  return cantidad * (config.factorConversion > 0 ? config.factorConversion : 1);
}

/**
 * Calcula el costo unitario asociado a una transacción de compra.
 * Para productos fragmentados las compras pueden venir por pack/caja y se normaliza.
 */
export function costoUnitarioDesdeCompra(
  compra: Transaction,
  config: FragmentConfig
): number | null {
  if (!compra.costoTotal || compra.costoTotal <= 0) {
    return null;
  }

  const unidades = normalizarCantidad(compra.cantidad, compra.unidad, config);
  if (unidades === 0) {
    return null;
  }

  return compra.costoTotal / unidades;
}

/**
 * Permite convertir una cantidad vendida a unidades homogéneas para estimar consumos.
 */
export function unidadesVendidas(
  venta: Transaction,
  config: FragmentConfig
): number {
  return normalizarCantidad(venta.cantidad, venta.unidad, config);
}
