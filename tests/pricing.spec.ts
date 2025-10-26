import {
  aplicarReglaTerminadoEn90,
  calcularCostoPromedioPonderado,
  calcularSemaforo,
  calcularPrecioSugerido,
} from "../app/src/domain/pricing";
import { validarRangoEdicion } from "../app/src/domain/params";
import { FragmentConfig } from "../app/src/domain/fragments";

describe("Dominio de precios", () => {
  test("aplicarReglaTerminadoEn90 respeta base 40/41 hacia abajo", () => {
    expect(aplicarReglaTerminadoEn90(12.30)).toBe(11.9);
    expect(aplicarReglaTerminadoEn90(20.40)).toBe(19.9);
  });

  test("aplicarReglaTerminadoEn90 escala hacia arriba al exceder base 41", () => {
    expect(aplicarReglaTerminadoEn90(12.42)).toBe(12.9);
    expect(aplicarReglaTerminadoEn90(0.41)).toBe(0.9);
  });

  test("aplicarReglaTerminadoEn90 devuelve cero para valores no positivos", () => {
    expect(aplicarReglaTerminadoEn90(0)).toBe(0);
    expect(aplicarReglaTerminadoEn90(-12.5)).toBe(0);
  });

  test("aplicarReglaTerminadoEn90 maneja múltiples decimales", () => {
    expect(aplicarReglaTerminadoEn90(45.3999)).toBe(44.9);
    expect(aplicarReglaTerminadoEn90(45.4099)).toBe(45.9);
  });

  test("calcularSemaforo aplica regla roja si precio actual es menor al propuesto", () => {
    const semaforo = calcularSemaforo(
      10,
      12,
      { margen: 0.2, umbralRojo: 20, umbralAmarillo: 5, rangoEdicionMin: -5, rangoEdicionMax: 5 }
    );
    expect(semaforo).toBe("ROJO");
  });

  test("calcularSemaforo distingue entre amarillo y verde", () => {
    const parametros = { margen: 0.25, umbralRojo: 20, umbralAmarillo: 5, rangoEdicionMin: -5, rangoEdicionMax: 5 };
    expect(calcularSemaforo(100, 90, parametros)).toBe("AMARILLO");
    expect(calcularSemaforo(100, 97, parametros)).toBe("VERDE");
  });

  test("calcularSemaforo fuerza rojo cuando precio actual es menor al propuesto", () => {
    const parametros = { margen: 0.25, umbralRojo: 50, umbralAmarillo: 10, rangoEdicionMin: -5, rangoEdicionMax: 5 };
    expect(calcularSemaforo(80, 85, parametros)).toBe("ROJO");
  });

  test("calcularCostoPromedioPonderado considera fragmentados por pack", () => {
    const config: FragmentConfig = { fragmentado: true, factorConversion: 12 };
    const cpp = calcularCostoPromedioPonderado(
      [
        { cantidad: 10, costoTotal: 240, unidad: "pack", fecha: "2024-08-01" },
        { cantidad: 8, costoTotal: 192, unidad: "pack", fecha: "2024-08-15" },
      ],
      config
    );
    expect(cpp).toBeCloseTo(2.0, 2);
  });

  test("calcularCostoPromedioPonderado retorna null si no hay compras válidas", () => {
    const config: FragmentConfig = { fragmentado: false, factorConversion: 1 };
    const cpp = calcularCostoPromedioPonderado(
      [
        { cantidad: 0, costoTotal: 0, unidad: "unidad", fecha: "2024-08-01" },
      ],
      config
    );
    expect(cpp).toBeNull();
  });

  test("calcularPrecioSugerido conserva detalle cuando no hay cpp", () => {
    const resultado = calcularPrecioSugerido(null, {
      margen: 0.3,
      umbralRojo: 20,
      umbralAmarillo: 5,
      rangoEdicionMin: -5,
      rangoEdicionMax: 5,
    });
    expect(resultado.precioPropuesto).toBeNull();
    expect(resultado.detalle).toMatch(/Sin compras/);
  });

  test("validarRangoEdicion detecta valores fuera de la autorización", () => {
    const resultado = validarRangoEdicion(100, 108, {
      margen: 0.2,
      umbralRojo: 20,
      umbralAmarillo: 5,
      rangoEdicionMin: -5,
      rangoEdicionMax: 10,
    });
    expect(resultado.valido).toBe(true);

    const fuera = validarRangoEdicion(100, 150, {
      margen: 0.2,
      umbralRojo: 20,
      umbralAmarillo: 5,
      rangoEdicionMin: -5,
      rangoEdicionMax: 10,
    });
    expect(fuera.valido).toBe(false);
  });
});
