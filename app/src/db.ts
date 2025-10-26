import DatabaseConstructor from "better-sqlite3";
import fs from "fs";
import path from "path";

function detectProjectRoot(): string {
  const candidates = [
    process.cwd(),
    path.resolve(process.cwd(), ".."),
    path.resolve(process.cwd(), "..", ".."),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(path.resolve(candidate, "db"))) {
      return candidate;
    }
  }

  return process.cwd();
}

const PROJECT_ROOT = detectProjectRoot();
const DATA_PATH = path.resolve(PROJECT_ROOT, "app", "data", "misalud_demo.sqlite");
const SCHEMA_PATH = path.resolve(PROJECT_ROOT, "db", "schema_sqlite.sql");
const SEED_PATH = path.resolve(PROJECT_ROOT, "db", "seed_sqlite.sql");

let dbInstance: DatabaseConstructor.Database | null = null;

function fileExists(filePath: string): boolean {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function runSqlFile(db: DatabaseConstructor.Database, filePath: string) {
  const script = fs.readFileSync(filePath, "utf-8");
  db.exec(script);
}

export function getDb(): DatabaseConstructor.Database {
  if (dbInstance) {
    return dbInstance;
  }

  const dataDir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const needsBootstrap = !fileExists(DATA_PATH);
  dbInstance = new DatabaseConstructor(DATA_PATH);
  dbInstance.pragma("journal_mode = WAL");

  if (needsBootstrap) {
    runSqlFile(dbInstance, SCHEMA_PATH);
    runSqlFile(dbInstance, SEED_PATH);
  }

  return dbInstance;
}

export function resetDemoDatabase() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
  if (fileExists(DATA_PATH)) {
    fs.unlinkSync(DATA_PATH);
  }
  getDb();
}

export const resetDatabaseForTests = resetDemoDatabase;
