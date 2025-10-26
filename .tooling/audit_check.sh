#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AUDIT_DIR="${ROOT_DIR}/audit"
EVIDENCE_DIR="${AUDIT_DIR}/evidencia"
SUMMARY_FILE="${EVIDENCE_DIR}/summary.txt"

API_BASE="${API:-http://localhost:3000/api}"
HOST_URL="${API_BASE%/api}"

mkdir -p "${EVIDENCE_DIR}"

summary_lines=()
overall_status=0

if ! command -v jq >/dev/null 2>&1; then
  echo "Error: se requiere 'jq' para ejecutar la auditoría." >&2
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "Error: se requiere 'python3' para calcular precios de prueba." >&2
  exit 1
fi

log_summary() {
  local line="$1"
  summary_lines+=("$line")
  printf '%s\n' "$line"
}

mark_result() {
  local status="$1"
  local label="$2"
  if [[ "$status" == "ok" ]]; then
    log_summary "✅ ${label}"
  elif [[ "$status" == "warn" ]]; then
    log_summary "⚠️  ${label}"
  else
    log_summary "❌ ${label}"
    overall_status=1
  fi
}

curl_json() {
  local url="$1"
  local output="$2"
  local headers=("${@:3}")
  local http_code
  http_code=$(curl -sS -w "%{http_code}" -o "${output}" "${headers[@]}" "${url}") || http_code=0
  printf '%s' "$http_code"
}

printf '==> Ejecutando auditoría de API en %s\n' "${API_BASE}"

# 1. Healthcheck o fallback a /parametros
HEALTH_FILE="${EVIDENCE_DIR}/health.json"
health_code=$(curl_json "${API_BASE}/health" "${HEALTH_FILE}")
if [[ "$health_code" == "200" ]]; then
  mark_result ok "Healthcheck /api/health 200"
else
  rm -f "${HEALTH_FILE}"
  health_code=$(curl_json "${API_BASE}/parametros" "${HEALTH_FILE}")
  if [[ "$health_code" == "200" ]]; then
    mark_result warn "Healthcheck falló, pero /api/parametros respondió 200"
  else
    mark_result fail "Healthcheck /api/health devolvió ${health_code}"
  fi
fi

# 2. GET /api/parametros
PARAM_FILE="${EVIDENCE_DIR}/parametros.json"
param_code=$(curl_json "${API_BASE}/parametros" "${PARAM_FILE}")
if [[ "$param_code" == "200" ]]; then
  mark_result ok "GET /api/parametros 200"
  jq '.' "${PARAM_FILE}" >/dev/null 2>&1 || mark_result warn "parametros.json no es JSON válido"
else
  mark_result fail "GET /api/parametros devolvió ${param_code}"
fi

# Guardar valor original de parámetros categoría 1 para revertir
ORIG_PARAM_PAYLOAD=""
if [[ -s "${PARAM_FILE}" ]]; then
  ORIG_PARAM_PAYLOAD=$(jq -c 'map(select(.categoria_id == 1)) | first | {
    margen, umbralRojo: .umbral_rojo, umbralAmarillo: .umbral_amarillo,
    rangoEdicionMin: .rango_edicion_min, rangoEdicionMax: .rango_edicion_max,
    usuario: "audit-script"
  }' "${PARAM_FILE}" || echo "")
fi

# 3. GET /api/productos?limit=5&offset=0
PROD_FILE="${EVIDENCE_DIR}/productos_5.json"
prod_resp=$(curl -sS -w "%{http_code} %{time_total}" -o "${PROD_FILE}.tmp" "${API_BASE}/productos?limit=5&offset=0" || echo "0 0")
prod_code=${prod_resp%% *}
prod_latency=${prod_resp##* }
prod_resp_25=$(curl -sS -w "%{http_code} %{time_total}" -o /dev/null "${API_BASE}/productos?limit=25&offset=0" || echo "0 0")
prod_time=${prod_resp_25##* }
if [[ -f "${PROD_FILE}.tmp" ]]; then
  mv "${PROD_FILE}.tmp" "${PROD_FILE}"
else
  : > "${PROD_FILE}"
fi
if [[ "$prod_code" == "200" ]]; then
  if jq '.' "${PROD_FILE}" >/dev/null 2>&1 && [[ $(jq '.data | length' "${PROD_FILE}") -gt 0 ]]; then
    mark_result ok "GET /api/productos?limit=5 200 (t=5→${prod_latency}s, t=25→${prod_time}s)"
  else
    mark_result warn "/api/productos respondió 200 pero sin datos"
  fi
else
  mark_result fail "GET /api/productos devolvió ${prod_code}"
fi

# 4. GET /api/productos/1/historico
HIST_FILE="${EVIDENCE_DIR}/historico_1.json"
hist_code=$(curl_json "${API_BASE}/productos/1/historico" "${HIST_FILE}")
if [[ "$hist_code" == "200" ]]; then
  mark_result ok "GET /api/productos/1/historico 200"
else
  mark_result fail "GET /api/productos/1/historico devolvió ${hist_code}"
fi

# Observar valores actuales para revertir ediciones (producto 1)
ORIG_PRECIO_PROP=""
if [[ -s "${PROD_FILE}" ]]; then
  ORIG_PRECIO_PROP=$(jq -r '.data[] | select(.id == 1) | .precioPropuesto' "${PROD_FILE}" 2>/dev/null || echo "")
fi
if [[ -z "${ORIG_PRECIO_PROP}" || "${ORIG_PRECIO_PROP}" == "null" ]]; then
  ORIG_PRECIO_PROP=$(jq -r '.data[0].precioPropuesto' "${PROD_FILE}" 2>/dev/null || echo "")
fi

# 5. PUT /api/parametros/1
PUT_PARAM_FILE="${EVIDENCE_DIR}/put_parametros_1.txt"
put_param_code=$(curl -sS -w "%{http_code}" -o "${PUT_PARAM_FILE}" \
  -H "Content-Type: application/json" \
  -H "x-role: Gerencia" \
  -X PUT \
  -d '{"umbralRojo":25,"umbralAmarillo":8,"margen":0.25,"rangoEdicionMin":-5,"rangoEdicionMax":10,"usuario":"audit"}' \
  "${API_BASE}/parametros/1" || echo 0)
if [[ "$put_param_code" == "200" ]]; then
  mark_result ok "PUT /api/parametros/1 200"
else
  mark_result fail "PUT /api/parametros/1 devolvió ${put_param_code}"
fi

# 6. PUT /api/productos/1/precio-propuesto (válido)
PUT_PRECIO_OK="${EVIDENCE_DIR}/put_precio_ok.txt"
PRECIO_OBJ=$(jq -r '.data[] | select(.id == 1) | .precioSugerido' "${PROD_FILE}" 2>/dev/null || echo "")
if [[ -z "${PRECIO_OBJ}" || "${PRECIO_OBJ}" == "null" ]]; then
  PRECIO_OBJ=$(jq -r '.data[0].precioSugerido' "${PROD_FILE}" 2>/dev/null || echo "")
fi
PRECIO_OK="15.20"
if [[ -n "${PRECIO_OBJ}" && "${PRECIO_OBJ}" != "null" ]]; then
  PRECIO_OK=$(python3 -c "import sys; print(f'{float(sys.argv[1])*0.98:.2f}')" "${PRECIO_OBJ}" 2>/dev/null || echo "")
  if [[ -z "${PRECIO_OK}" ]]; then
    PRECIO_OK="15.20"
  fi
fi
put_precio_ok_code=$(curl -sS -w "%{http_code}" -o "${PUT_PRECIO_OK}" \
  -H "Content-Type: application/json" \
  -H "x-role: Operador" \
  -X PUT \
  -d '{"precioPropuesto":'"${PRECIO_OK}"',"usuario":"audit"}' \
  "${API_BASE}/productos/1/precio-propuesto" || echo 0)
if [[ "$put_precio_ok_code" == "200" ]]; then
  mark_result ok "PUT /api/productos/1/precio-propuesto (válido) 200"
else
  mark_result fail "PUT /api/productos/1/precio-propuesto (válido) devolvió ${put_precio_ok_code}"
fi

# 7. PUT /api/productos/1/precio-propuesto (fuera de rango)
PUT_PRECIO_FAIL="${EVIDENCE_DIR}/put_precio_fail.txt"
put_precio_fail_code=$(curl -sS -w "%{http_code}" -o "${PUT_PRECIO_FAIL}" \
  -H "Content-Type: application/json" \
  -H "x-role: Operador" \
  -X PUT \
  -d '{"precioPropuesto":999990,"usuario":"audit"}' \
  "${API_BASE}/productos/1/precio-propuesto" || echo 0)
if [[ "$put_precio_fail_code" =~ ^4 ]]; then
  mark_result ok "PUT /api/productos/1/precio-propuesto (fuera de rango) rechazado (${put_precio_fail_code})"
else
  mark_result fail "PUT /api/productos/1/precio-propuesto (fuera de rango) devolvió ${put_precio_fail_code}"
fi

# 8. POST /api/listas/generar
LIST_HEADERS="${EVIDENCE_DIR}/generar_lista_headers.txt"
LIST_BODY="${EVIDENCE_DIR}/generar_lista_body.json"
curl -sS -D "${LIST_HEADERS}" -o "${LIST_BODY}" \
  -H "Content-Type: application/json" \
  -H "x-role: Gerencia" \
  -X POST \
  -d '{"usuario":"audit"}' \
  "${API_BASE}/listas/generar" >/dev/null || true
LIST_STATUS=$(head -n 1 "${LIST_HEADERS}" | awk '{print $2}')
LIST_ID=$(jq -r '.id' "${LIST_BODY}" 2>/dev/null || echo "")
if [[ -n "${LIST_STATUS}" && "${LIST_STATUS}" == "201" ]]; then
  mark_result ok "POST /api/listas/generar 201 (ID ${LIST_ID})"
else
  mark_result fail "POST /api/listas/generar devolvió ${LIST_STATUS:-desconocido}"
fi

# 9. GET /api/listas/vigente
LISTA_VIGENTE="${EVIDENCE_DIR}/lista_vigente.json"
lista_vigente_code=$(curl_json "${API_BASE}/listas/vigente" "${LISTA_VIGENTE}")
if [[ "$lista_vigente_code" == "200" ]]; then
  mark_result ok "GET /api/listas/vigente 200"
else
  mark_result fail "GET /api/listas/vigente devolvió ${lista_vigente_code}"
fi
LIST_CODIGO=$(jq -r '.codigo' "${LISTA_VIGENTE}" 2>/dev/null || echo "")

# 10. GET /api/listas/:id/descargar
if [[ -n "${LIST_ID}" && "${LIST_ID}" != "null" ]]; then
  LIST_CSV="${EVIDENCE_DIR}/lista_${LIST_CODIGO:-${LIST_ID}}.csv"
  csv_code=$(curl -sS -w "%{http_code}" -o "${LIST_CSV}" \
    "${API_BASE}/listas/${LIST_ID}/descargar")
  if [[ "$csv_code" == "200" ]]; then
    mark_result ok "GET /api/listas/${LIST_ID}/descargar 200"
  else
    mark_result fail "GET /api/listas/${LIST_ID}/descargar devolvió ${csv_code}"
  fi
else
  mark_result fail "No se pudo determinar ID de lista para descargar"
fi

# 11. Verificación de artefactos
PDF_PATH="${ROOT_DIR}/report/aptc105_s4_apellidonombre.pdf"
UML_PNG="${ROOT_DIR}/docs/uml.png"
UML_PUML="${ROOT_DIR}/docs/uml.puml"
MATRIZ="${ROOT_DIR}/docs/matriz_trazabilidad.csv"
PDF_SIZE=0
if [[ -f "${PDF_PATH}" ]]; then
  PDF_SIZE=$(stat --printf='%s' "${PDF_PATH}" 2>/dev/null || echo 0)
fi

if [[ -f "${PDF_PATH}" && -f "${UML_PNG}" && -f "${UML_PUML}" && -f "${MATRIZ}" && "${PDF_SIZE}" -gt 20000 ]]; then
  mark_result ok "Artefactos clave detectados (PDF=${PDF_SIZE} bytes)"
else
  mark_result fail "Faltan artefactos requeridos o PDF <20KB"
fi

# Escribir resumen
printf '%s\n' "${summary_lines[@]}" > "${SUMMARY_FILE}"
printf 'Resumen guardado en %s\n' "${SUMMARY_FILE}"

# Revertir cambios si se capturó estado previo
if [[ -n "${ORIG_PARAM_PAYLOAD}" ]]; then
  curl -sS -o /dev/null \
    -H "Content-Type: application/json" \
    -H "x-role: Gerencia" \
    -X PUT \
    -d "${ORIG_PARAM_PAYLOAD}" \
    "${API_BASE}/parametros/1" || true
fi

if [[ -n "${ORIG_PRECIO_PROP}" && "${ORIG_PRECIO_PROP}" != "null" ]]; then
  curl -sS -o /dev/null \
    -H "Content-Type: application/json" \
    -H "x-role: Operador" \
    -X PUT \
    -d '{"precioPropuesto":'"${ORIG_PRECIO_PROP}"',"usuario":"audit"}' \
    "${API_BASE}/productos/1/precio-propuesto" || true
fi

exit "${overall_status}"
