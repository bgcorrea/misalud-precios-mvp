#!/bin/sh
set -e

echo "=== MiSalud Precios - Starting ==="
echo "Working directory: $(pwd)"
echo "Contents:"
ls -la
echo ""
echo "Database directory:"
ls -la /db 2>/dev/null || echo "/db not found"
echo ""
echo "Environment variables:"
echo "PORT=${PORT}"
echo "HOST=${HOST}"
echo "DEMO_ALLOW_ALL=${DEMO_ALLOW_ALL}"
echo ""
echo "=== Starting server with tsx ==="
exec tsx src/server.ts
