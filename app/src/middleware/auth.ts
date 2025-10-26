import { Request, Response, NextFunction } from "express";
import { APP_CONFIG } from "../config";

function demoAllowAllEnabled(): boolean {
  if (APP_CONFIG.demoAllowAll) return true;
  const envValue = String(process.env.DEMO_ALLOW_ALL || "").toLowerCase();
  return envValue === "true" || envValue === "1";
}

export type RolUsuario = "Gerencia" | "Operador";

export function obtenerRol(req: Request): RolUsuario | null {
  const role = (req.header("x-role") || "").trim().toLowerCase();
  if (role === "gerencia") return "Gerencia";
  if (role === "operador") return "Operador";
  return null;
}

export function requireGerencia(req: Request, res: Response, next: NextFunction) {
  if (demoAllowAllEnabled()) {
    res.locals.rol = "Gerencia";
    return next();
  }

  const rol = obtenerRol(req);
  if (rol !== "Gerencia") {
    return res.status(403).json({ mensaje: "Acción reservada a Gerencia." });
  }
  res.locals.rol = rol;
  next();
}
