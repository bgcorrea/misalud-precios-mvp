#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="${REPO_DIR}/app"
DB_FILE="${APP_DIR}/data/misalud_demo.sqlite"

echo "==> Instalando dependencias del demo (si es necesario)..."
cd "${APP_DIR}"
NODE_ENV=development npm install --include=dev

if [[ -f "${DB_FILE}" ]]; then
  echo "==> Reiniciando base de datos demo..."
  rm -f "${DB_FILE}"
fi

echo "==> Iniciando API demo en http://localhost:3000 ..."
PORT=3000 npm start &
SERVER_PID=$!

cleanup() {
  echo "==> Deteniendo servidor (${SERVER_PID})"
  kill "${SERVER_PID}" >/dev/null 2>&1 || true
}
trap cleanup EXIT

sleep 3

DEMO_URL="http://localhost:3000/ui"
if command -v xdg-open >/dev/null 2>&1; then
  xdg-open "${DEMO_URL}" >/dev/null 2>&1 || true
elif command -v open >/dev/null 2>&1; then
  open "${DEMO_URL}" || true
else
  echo "Abra ${DEMO_URL} en su navegador."
fi

echo "==> Presione Ctrl+C para detener la demo."
wait "${SERVER_PID}"
