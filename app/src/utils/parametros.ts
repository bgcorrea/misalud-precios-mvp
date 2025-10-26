export type ParametrosValores = {
  margen: number;
  umbralRojo: number;
  umbralAmarillo: number;
  rangoEdicionMin: number;
  rangoEdicionMax: number;
};

export function validarParametrosEntrada(body: any) {
  const errors: string[] = [];
  const margen = Number(body?.margen);
  const umbralRojo = Number(body?.umbralRojo);
  const umbralAmarillo = Number(body?.umbralAmarillo);
  const rangoEdicionMin = Number(body?.rangoEdicionMin);
  const rangoEdicionMax = Number(body?.rangoEdicionMax);

  if (!Number.isFinite(margen) || margen < 0 || margen > 1) {
    errors.push("margen debe estar entre 0 y 1");
  }
  if (
    !Number.isFinite(umbralRojo) ||
    !Number.isFinite(umbralAmarillo) ||
    umbralRojo <= 0 ||
    umbralRojo > 100 ||
    umbralAmarillo < 0 ||
    umbralAmarillo >= umbralRojo
  ) {
    errors.push("Umbrales deben cumplir 0 ≤ amarillo < rojo ≤ 100");
  }
  if (
    !Number.isFinite(rangoEdicionMin) ||
    !Number.isFinite(rangoEdicionMax) ||
    rangoEdicionMin < -15 ||
    rangoEdicionMax > 15 ||
    rangoEdicionMin >= rangoEdicionMax
  ) {
    errors.push("Rangos permitidos entre -15 y 15 y min < max");
  }

  return {
    errors,
    values: {
      margen,
      umbralRojo,
      umbralAmarillo,
      rangoEdicionMin,
      rangoEdicionMax,
    } as ParametrosValores,
  };
}
