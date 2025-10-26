export type CategoriaParametros = {
  margen: number; // porcentaje (ej: 0.25 = 25 %)
  umbralRojo: number; // porcentaje
  umbralAmarillo: number; // porcentaje
  rangoEdicionMin: number; // porcentaje negativo permitido vs precio sugerido
  rangoEdicionMax: number; // porcentaje positivo permitido vs precio sugerido
};

export type RangoValidacionResultado = {
  valido: boolean;
  mensaje?: string;
};

/**
 * Valida que un operador edite un precio dentro del rango autorizado por la gerencia.
 * El rango se expresa en porcentaje respecto al precio sugerido calculado automáticamente.
 */
export function validarRangoEdicion(
  precioSugerido: number,
  precioNuevo: number,
  parametros: CategoriaParametros
): RangoValidacionResultado {
  if (precioSugerido <= 0) {
    return {
      valido: false,
      mensaje: "No hay precio sugerido de referencia para validar el cambio.",
    };
  }

  const diferencia = precioNuevo - precioSugerido;
  const porcentaje = (diferencia / precioSugerido) * 100;

  if (porcentaje < parametros.rangoEdicionMin) {
    return {
      valido: false,
      mensaje: `El nuevo precio queda ${porcentaje.toFixed(
        2
      )}% por debajo del permitido (${parametros.rangoEdicionMin}%).`,
    };
  }

  if (porcentaje > parametros.rangoEdicionMax) {
    return {
      valido: false,
      mensaje: `El nuevo precio supera el máximo autorizado (${parametros.rangoEdicionMax}%) en ${porcentaje.toFixed(
        2
      )}%.`,
    };
  }

  return { valido: true };
}
