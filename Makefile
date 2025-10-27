.PHONY: build run stop logs restart clean test selfcheck help

help:
	@echo "MiSalud Precios - Comandos disponibles:"
	@echo ""
	@echo "  make build       - Construir imagen Docker"
	@echo "  make run         - Levantar servicio en background"
	@echo "  make stop        - Detener servicio"
	@echo "  make restart     - Reiniciar servicio"
	@echo "  make logs        - Ver logs del servicio"
	@echo "  make clean       - Eliminar contenedores e imágenes"
	@echo "  make test        - Ejecutar pruebas"
	@echo "  make selfcheck   - Ejecutar autoverificación"
	@echo ""

build:
	docker compose build

run:
	docker compose up -d

stop:
	docker compose down

restart: stop run

logs:
	docker compose logs -f api

clean:
	docker compose down -v --rmi local
	rm -rf app/data/*.sqlite

test:
	cd app && npm test

selfcheck:
	./.tooling/selfcheck.sh
