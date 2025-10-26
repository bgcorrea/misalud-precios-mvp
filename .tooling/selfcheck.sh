#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${BASE_URL:-"http://localhost:3000"}
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

print_status() {
  local status=$1
  local message=$2
  if [ "$status" -eq 0 ]; then
    printf '✅ %s\n' "$message"
  elif [ "$status" -eq 1 ]; then
    printf '⚠️  %s\n' "$message"
  else
    printf '❌ %s\n' "$message"
  fi
}

status_ok=0
status_warn=1
status_fail=2

# Check parametros
PARAM_FILE="$TMP_DIR/parametros.json"
HTTP_CODE=$(curl -s -w "%{http_code}" -o "$PARAM_FILE" "$BASE_URL/api/parametros") || HTTP_CODE=0
if [ "$HTTP_CODE" = "200" ]; then
  print_status $status_ok "/api/parametros 200"
else
  print_status $status_fail "/api/parametros devolvió $HTTP_CODE"
fi

# List products
PROD_FILE="$TMP_DIR/productos.json"
HTTP_CODE=$(curl -s -w "%{http_code}" -o "$PROD_FILE" "$BASE_URL/api/productos?page=1&pageSize=5") || HTTP_CODE=0
if [ "$HTTP_CODE" = "200" ]; then
  if python3 - "$PROD_FILE" <<'PY'
import json, sys
try:
    with open(sys.argv[1], 'r', encoding='utf-8') as fh:
        data = json.load(fh)
    if isinstance(data.get('data'), list) and len(data['data']) >= 1:
        sys.exit(0)
except Exception as exc:
    print(exc, file=sys.stderr)
sys.exit(1)
PY
  then
    print_status $status_ok "Listado de productos (>0)"
  else
    print_status $status_warn "Listado de productos vacío"
  fi
else
  print_status $status_fail "/api/productos devolvió $HTTP_CODE"
fi

# Generate list (Gerencia)
LIST_GEN_FILE="$TMP_DIR/lista_gen.json"
HTTP_CODE=$(curl -s -w "%{http_code}" -o "$LIST_GEN_FILE" \
  -H "Content-Type: application/json" -H "x-role: Gerencia" \
  -d '{"usuario":"selfcheck"}' \
  "$BASE_URL/api/listas/generar") || HTTP_CODE=0
if [ "$HTTP_CODE" = "201" ]; then
  LIST_ID=$(node -e "const fs=require('fs');const data=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));console.log(data.id||'');" "$LIST_GEN_FILE")
  print_status $status_ok "Generación de lista base (ID $LIST_ID)"
else
  print_status $status_fail "Generación de lista base devolvió $HTTP_CODE"
fi

# Lista vigente
HTTP_CODE=$(curl -s -w "%{http_code}" -o "$TMP_DIR/lista_vigente.json" "$BASE_URL/api/listas/vigente") || HTTP_CODE=0
if [ "$HTTP_CODE" = "200" ]; then
  print_status $status_ok "/api/listas/vigente 200"
else
  print_status $status_fail "/api/listas/vigente devolvió $HTTP_CODE"
fi

# Descargar CSV
if [ -s "$LIST_GEN_FILE" ]; then
  LIST_ID=${LIST_ID:-$(node -e "const fs=require('fs');const data=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));console.log(data.id||'');" "$LIST_GEN_FILE")}
  if [ -n "$LIST_ID" ]; then
    HTTP_CODE=$(curl -s -w "%{http_code}" -o "$TMP_DIR/lista.csv" "$BASE_URL/api/listas/${LIST_ID}/descargar?sep=%3B") || HTTP_CODE=0
    if [ "$HTTP_CODE" = "200" ]; then
      print_status $status_ok "Descarga CSV lista ${LIST_ID}"
    else
      print_status $status_warn "Descarga CSV devolvió $HTTP_CODE"
    fi
  fi
fi

# Precio propuesto tests
readarray -t PRODUCT_INFO < <(python3 - "$PROD_FILE" <<'PY'
import json, sys
with open(sys.argv[1], 'r', encoding='utf-8') as fh:
    payload = json.load(fh)
items = payload.get('data') or []
if items:
    first = items[0]
    sugerido = first.get('precioSugerido') or first.get('precioActual') or 0
    print(first.get('id', ''))
    print(sugerido)
else:
    print('')
    print('')
PY
)
PRODUCT_ID=${PRODUCT_INFO[0]:-}
PRECIO_PROP=${PRODUCT_INFO[1]:-}
if [ -n "$PRODUCT_ID" ] && [ -n "$PRECIO_PROP" ]; then
  PRECIO_OK=$(node -e "const base=Number(process.argv[1]);console.log((base*0.98).toFixed(2));" "$PRECIO_PROP")
  HTTP_CODE=$(curl -s -w "%{http_code}" -o /dev/null \
    -X PUT \
    -H "Content-Type: application/json" -H "x-role: Operador" \
    -d '{"usuario":"selfcheck","precioPropuesto":'"$PRECIO_OK"'}' \
    "$BASE_URL/api/productos/${PRODUCT_ID}/precio-propuesto") || HTTP_CODE=0
  if [ "$HTTP_CODE" = "200" ]; then
    print_status $status_ok "PUT precio-propuesto dentro de rango"
  else
    print_status $status_warn "PUT precio-propuesto dentro de rango devolvió $HTTP_CODE"
  fi

  PRECIO_BAD=$(node -e "const base=Number(process.argv[1]);console.log((base*1.5).toFixed(2));" "$PRECIO_PROP")
  HTTP_CODE=$(curl -s -w "%{http_code}" -o /dev/null \
    -X PUT \
    -H "Content-Type: application/json" -H "x-role: Operador" \
    -d '{"usuario":"selfcheck","precioPropuesto":'"$PRECIO_BAD"'}' \
    "$BASE_URL/api/productos/${PRODUCT_ID}/precio-propuesto") || HTTP_CODE=0
  if [ "$HTTP_CODE" != "200" ]; then
    print_status $status_ok "PUT fuera de rango rechazado ($HTTP_CODE)"
  else
    print_status $status_warn "PUT fuera de rango no fue rechazado"
  fi
fi

# Artefacts existence
if [ -f "report/aptc105_s4_apellidonombre.pdf" ] && \
   [ -f "docs/uml.png" ] && [ -f "docs/uml.puml" ] && [ -f "docs/matriz_trazabilidad.csv" ]; then
  print_status $status_ok "Artefactos principales presentes"
else
  print_status $status_warn "Faltan artefactos requeridos"
fi
