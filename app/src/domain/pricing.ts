import { FragmentConfig, Transaction, costoUnitarioDesdeCompra, unidadesVendidas } from "./fragments";
import { CategoriaParametros } from "./params";

export type Compra = Transaction & { costoTotal: number; fecha: string };
export type Venta = Transaction & { precioTotal: number; fecha: string };

export type Semaforo = "ROJO" | "AMARILLO" | "VERDE";

export type CalculoPrecio = {
  cpp: number | null;
  precioMargen: number | null;
  precioPropuesto: number | null;
  margenAplicado: number | null;
  detalle?: string;
};

/**
 * Calcula el costo promedio ponderado (CPP) a partir de compras válidas.
 * Fórmula: CPP = (Σ costoTotalNormalizado) / (Σ unidadesNormalizadas)
 * Casos borde:
 * - Sin compras suficientes: retorna null.
 * - Compras con costo/cantidad inválidas: se ignoran.
 * - Productos fragmentados: se normalizan las cantidades a unidades individuales.
 */
export function calcularCostoPromedioPonderado(
  compras: Compra[],
  config: FragmentConfig
): number | null {
  let costoAcumulado = 0;
  let unidadesAcumuladas = 0;

  for (const compra of compras) {
    const costoUnitario = costoUnitarioDesdeCompra(compra, config);
    if (costoUnitario === null) {
      continue;
    }
    const unidades = unidadesVendidas(compra, config);
    costoAcumulado += costoUnitario * unidades;
    unidadesAcumuladas += unidades;
  }

  if (unidadesAcumuladas === 0) {
    return null;
  }

  return Number((costoAcumulado / unidadesAcumuladas).toFixed(4));
}

/**
 * Calcula el precio sugerido aplicando margen y regla de terminado en 90.
 */
export function calcularPrecioSugerido(
  cpp: number | null,
  parametros: CategoriaParametros
): CalculoPrecio {
  if (cpp === null) {
    return {
      cpp,
      precioMargen: null,
      precioPropuesto: null,
      margenAplicado: null,
      detalle: "Sin compras suficientes para calcular costo promedio.",
    };
  }

  const precioMargen = cpp * (1 + parametros.margen);
  const precioPropuesto = Math.max(0, aplicarReglaTerminadoEn90(precioMargen));

  return {
    cpp,
    precioMargen: Number(precioMargen.toFixed(2)),
    precioPropuesto: Number(precioPropuesto.toFixed(2)),
    margenAplicado: parametros.margen,
  };
}

/**
 * Regla “terminado en 90” con base 40/41:
 * Se calcula el valor terminado en .90 inmediatamente inferior y superior.
 * - Si la distancia al inferior es ≤ 0.40 se mantiene el inferior.
 * - Si la distancia es ≥ 0.41 se redondea al superior.
 */
export function aplicarReglaTerminadoEn90(valor: number): number {
  if (valor <= 0) {
    return 0;
  }

  const EPSILON = 0.000001;
  const base = Math.floor(valor);
  const decimales = valor - base;

  if (decimales <= 0.4 + EPSILON) {
    const inferiorBase = Math.max(base - 1, 0);
    const inferior = Math.max(inferiorBase + 0.9, 0.9);
    return Number(inferior.toFixed(2));
  }

  const superiorBase = decimales >= 0.9 - EPSILON ? base + 1 : base;
  const superior = Math.max(superiorBase + 0.9, 0.9);
  return Number(superior.toFixed(2));
}

/**
 * Determina el color del semáforo según la diferencia porcentual.
 * Si el precio actual es menor al propuesto el resultado siempre es ROJO.
 * Por defecto se evalúa con base en el precio actual.
 */
export function calcularSemaforo(
  precioActual: number,
  precioPropuesto: number,
  parametros: CategoriaParametros
): Semaforo {
  if (precioActual <= 0) {
    return "ROJO";
  }

  if (precioActual < precioPropuesto) {
    return "ROJO";
  }

  const diferenciaPorcentual =
    ((precioActual - precioPropuesto) / precioActual) * 100;

  if (diferenciaPorcentual >= parametros.umbralRojo) {
    return "ROJO";
  }

  if (diferenciaPorcentual >= parametros.umbralAmarillo) {
    return "AMARILLO";
  }

  return "VERDE";
}
