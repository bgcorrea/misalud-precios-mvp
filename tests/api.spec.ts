/// <reference types="supertest" />
import request from "supertest";
import { buildServer } from "../app/src/server";
import { resetDatabaseForTests } from "../app/src/db";

process.env.NODE_ENV = "test";

describe("API Misalud Precios", () => {
  let app = buildServer();

  beforeEach(() => {
    process.env.DEMO_ALLOW_ALL = "false";
    resetDatabaseForTests();
    app = buildServer();
  });

  test("health check expone servicio y timestamp", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("ok", true);
    expect(response.body).toHaveProperty("service", "misalud-precios");
    expect(typeof response.body.ts).toBe("string");
  });

  test("lista productos paginados respeta límite", async () => {
    const response = await request(app)
      .get("/api/productos?page=1&pageSize=5")
      .set("x-role", "Operador");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.pageSize).toBeLessThanOrEqual(5);
  });

  test("impide guardar precio fuera de rango", async () => {
    const productos = await request(app)
      .get("/api/productos?page=1&pageSize=1")
      .set("x-role", "Operador");

    const producto = productos.body.data[0];

    const response = await request(app)
      .put(`/api/productos/${producto.id}/precio-propuesto`)
      .set("x-role", "Operador")
      .send({
        precioPropuesto: producto.precioSugerido * 1.5,
        usuario: "operador.demo",
      });

    expect(response.status).toBe(400);
  });

  test("permite guardar precio dentro de rango y registra log", async () => {
    const productos = await request(app)
      .get("/api/productos?page=1&pageSize=1")
      .set("x-role", "Operador");

    const producto = productos.body.data[0];
    const nuevo = producto.precioSugerido * 0.98;

    const response = await request(app)
      .put(`/api/productos/${producto.id}/precio-propuesto`)
      .set("x-role", "Operador")
      .send({
        precioPropuesto: nuevo,
        usuario: "operador.demo",
      });

    expect(response.status).toBe(200);

    const logs = await request(app)
      .get("/api/logs")
      .query({ limit: 5 })
      .set("x-role", "Gerencia");

    const registro = logs.body.find((log: any) => log.accion === "update_precio_propuesto");
    expect(registro).toBeDefined();
    expect(registro.entidad_id).toBe(producto.id);
  });

  test("solo gerencia genera lista base", async () => {
    const failResponse = await request(app)
      .post("/api/listas/generar")
      .set("x-role", "Operador")
      .send({ usuario: "operador.demo" });
    expect(failResponse.status).toBe(403);

    const okResponse = await request(app)
      .post("/api/listas/generar")
      .set("x-role", "Gerencia")
      .send({ usuario: "gerencia.demo" });
    expect(okResponse.status).toBe(201);

    const vigente = await request(app)
      .get("/api/listas/vigente")
      .set("x-role", "Operador");
    expect(vigente.status).toBe(200);
    expect(vigente.body.codigo).toBeDefined();
  });

  test("descarga lista en CSV con separador configurable", async () => {
    const okResponse = await request(app)
      .post("/api/listas/generar")
      .set("x-role", "Gerencia")
      .send({ usuario: "gerencia.demo" });
    const listaId = okResponse.body.id;

    const csvResponse = await request(app)
      .get(`/api/listas/${listaId}/descargar?sep=%3B`)
      .set("x-role", "Operador");

    expect(csvResponse.status).toBe(200);
    expect(csvResponse.text.split("\n")[0]).toBe("CodigoInterno;CodigoBarras;Descripcion;PrecioPropuesto");
  });

  test("GET /api/logs limita resultados", async () => {
    await request(app)
      .post("/api/listas/generar")
      .set("x-role", "Gerencia")
      .send({ usuario: "gerencia.demo" });

    const logs = await request(app)
      .get("/api/logs")
      .query({ limit: 10 })
      .set("x-role", "Gerencia");

    expect(logs.status).toBe(200);
    expect(Array.isArray(logs.body)).toBe(true);
    expect(logs.body.length).toBeGreaterThan(0);
    const first = logs.body[0];
    expect(first).toHaveProperty("id");
    expect(first).toHaveProperty("accion");
  });

  test("GET /api/logs/:entidad/:id filtra por entidad", async () => {
    const okResponse = await request(app)
      .post("/api/listas/generar")
      .set("x-role", "Gerencia")
      .send({ usuario: "gerencia.demo" });
    const listaId = okResponse.body.id;

    const logs = await request(app)
      .get(`/api/logs/lista_base/${listaId}`)
      .set("x-role", "Gerencia");

    expect(logs.status).toBe(200);
    expect(logs.body.length).toBeGreaterThan(0);
    expect(logs.body[0].entidad).toBe("lista_base");
  });

  test("validación de parámetros con datos inválidos", async () => {
    const response = await request(app)
      .put("/api/parametros/1")
      .set("x-role", "Gerencia")
      .send({
        usuario: "gerencia",
        margen: 1.5,
        umbralRojo: 10,
        umbralAmarillo: 20,
        rangoEdicionMin: -20,
        rangoEdicionMax: 2,
      });

    expect(response.status).toBe(400);
  });

  test("middleware de gerencia rechaza ausencia de x-role", async () => {
    const response = await request(app)
      .post("/api/listas/generar")
      .send({ usuario: "anon" });
    expect(response.status).toBe(403);
  });

  test("DEMO_ALLOW_ALL habilita rutas administrativas", async () => {
    process.env.DEMO_ALLOW_ALL = "true";
    resetDatabaseForTests();
    const openApp = buildServer();

    const response = await request(openApp)
      .post("/api/listas/generar")
      .send({ usuario: "demo" });

    expect([200, 201]).toContain(response.status);
  });
});
