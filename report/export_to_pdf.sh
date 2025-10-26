#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPORT_DIR="${ROOT_DIR}/report"
SOURCE="${REPORT_DIR}/informe_1_pagina.md"
OUTPUT="${REPORT_DIR}/aptc105_s4_apellidonombre.pdf"
TEMP_PDF="${REPORT_DIR}/$(basename "${SOURCE}" .md).pdf"

rm -f "${TEMP_PDF}" "${OUTPUT}"

if command -v pandoc >/dev/null 2>&1; then
  ENGINE=""
  if command -v xelatex >/dev/null 2>&1; then
    ENGINE="xelatex"
  elif command -v wkhtmltopdf >/dev/null 2>&1; then
    ENGINE="wkhtmltopdf"
  else
    echo "Advertencia: no se encontró xelatex ni wkhtmltopdf. Se usará el motor por defecto de pandoc." >&2
  fi

  echo "Generando PDF con pandoc..."
  if [[ -n "${ENGINE}" ]]; then
    pandoc "${SOURCE}" \
      --from markdown \
      --pdf-engine="${ENGINE}" \
      -V papersize=letter \
      -V geometry:margin=1in \
      -o "${OUTPUT}"
  else
    pandoc "${SOURCE}" \
      --from markdown \
      -V papersize=letter \
      -V geometry:margin=1in \
      -o "${OUTPUT}"
  fi
else
  echo "pandoc no disponible. Usando md-to-pdf vía npx..."
  if command -v md-to-pdf >/dev/null 2>&1; then
    md-to-pdf "${SOURCE}"
  elif command -v npx >/dev/null 2>&1; then
    npx --yes md-to-pdf "${SOURCE}"
  else
    echo "Error: no se encontró pandoc ni md-to-pdf/npx para exportar a PDF." >&2
    exit 1
  fi
  mv -f "${TEMP_PDF}" "${OUTPUT}"
fi

echo "PDF generado en ${OUTPUT}"

if command -v pdfinfo >/dev/null 2>&1; then
  PAGES=$(pdfinfo "${OUTPUT}" 2>/dev/null | awk '/Pages:/ {print $2}')
  if [ -n "${PAGES}" ] && [ "${PAGES}" -gt 1 ]; then
    echo "⚠️  Advertencia: el informe tiene ${PAGES} páginas (el requisito es 1)." >&2
  fi
fi

CLEAN_FILE=$(mktemp)
trap 'rm -f "${CLEAN_FILE}"' EXIT
sed -E 's/RF-[0-9]+//g; s/RNF-[0-9]+//g;' "${SOURCE}" > "${CLEAN_FILE}"

if command -v aspell >/dev/null 2>&1; then
  ERRORS=$(aspell list --lang=es < "${CLEAN_FILE}" | sort -u)
  if [ -n "${ERRORS}" ]; then
    echo "⚠️  Posibles palabras fuera de diccionario:" >&2
    echo "${ERRORS}" >&2
  fi
elif command -v hunspell >/dev/null 2>&1; then
  ERRORS=$(hunspell -d es_ES -l "${CLEAN_FILE}" | sort -u)
  if [ -n "${ERRORS}" ]; then
    echo "⚠️  Posibles palabras fuera de diccionario:" >&2
    echo "${ERRORS}" >&2
  fi
else
  echo "ℹ️  No se encontró aspell/hunspell para revisión ortográfica." >&2
fi
