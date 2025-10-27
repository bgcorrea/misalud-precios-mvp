// Sistema de autenticación básico para MVP
// En producción, esto se reemplaza con integración Laravel

export type UserRole = "Operador" | "Gerencia";

export interface User {
  username: string;
  password: string;  // En producción usar bcrypt
  rol: UserRole;
  nombre: string;
}

// Base de datos de usuarios en memoria (Demo)
// En producción: consultar base de datos Laravel/SQL Server
const USERS: User[] = [
  {
    username: "operador1",
    password: "operador123",  // En prod: hash bcrypt
    rol: "Operador",
    nombre: "Juan Pérez"
  },
  {
    username: "operador2",
    password: "operador123",
    rol: "Operador",
    nombre: "María González"
  },
  {
    username: "gerencia1",
    password: "gerencia123",
    rol: "Gerencia",
    nombre: "Carlos Rodríguez"
  }
];

export function authenticateUser(username: string, password: string): User | null {
  const user = USERS.find(
    u => u.username === username && u.password === password
  );

  return user || null;
}

export function getUserByUsername(username: string): User | null {
  return USERS.find(u => u.username === username) || null;
}

// Generar token simple (en producción usar JWT)
export function generateToken(user: User): string {
  // Token formato: base64(username:timestamp)
  const payload = `${user.username}:${Date.now()}`;
  return Buffer.from(payload).toString('base64');
}

// Validar token simple
export function validateToken(token: string): User | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [username, timestamp] = decoded.split(':');

    // Token expira en 8 horas
    const EIGHT_HOURS = 8 * 60 * 60 * 1000;
    if (Date.now() - Number(timestamp) > EIGHT_HOURS) {
      return null;  // Token expirado
    }

    return getUserByUsername(username);
  } catch {
    return null;
  }
}
