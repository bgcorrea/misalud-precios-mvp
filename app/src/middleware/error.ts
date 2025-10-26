import { NextFunction, Request, Response } from "express";

export type AppError = Error & { status?: number; detalle?: unknown };

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ mensaje: "Recurso no encontrado." });
}

export function errorHandler(err: AppError, _req: Request, res: Response, _next: NextFunction) {
  const status = err.status && Number.isFinite(err.status) ? err.status : 500;
  const detalle =
    process.env.NODE_ENV === "production" ? undefined : err.detalle || err.message;

  res.status(status).json({
    mensaje: status === 500 ? "Error interno" : err.message || "Error",
    detalle,
  });
}
