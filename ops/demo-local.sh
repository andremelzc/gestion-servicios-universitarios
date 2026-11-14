#!/bin/sh
set -eu

usage() {
  echo "Uso: sh ops/demo-local.sh {crear|estado|eliminar} demo191-NOMBRE" >&2
  exit 2
}

[ "$#" -eq 2 ] || usage
accion=$1
proyecto=$2
case "$proyecto" in
  demo191-*) sufijo=${proyecto#demo191-} ;;
  *) usage ;;
esac
case "$sufijo" in
  ''|*[!a-z0-9-]*) usage ;;
esac
case "$accion" in crear|estado|eliminar) ;; *) usage ;; esac

# Compose siempre usa únicamente el archivo y proyecto indicados aquí.
raiz=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$raiz"
compose() {
  docker compose --project-name "$proyecto" --file docker-compose.demo.yml "$@"
}

for variable in DB_PASSWORD DB_ROOT_PASSWORD JWT_SECRET DEMO_USER_PASSWORD; do
  eval 'valor=${'"$variable"'-}'
  if [ -z "$valor" ]; then
    echo "Falta exportar $variable; consulte la documentación." >&2
    exit 1
  fi
done

case "$accion" in
  crear)
    # No reutilizar ningún recurso Compose de un proyecto previo, incluidos volúmenes huérfanos.
    contenedores=$(docker ps -aq --filter "label=com.docker.compose.project=$proyecto")
    volumenes=$(docker volume ls -q --filter "label=com.docker.compose.project=$proyecto")
    redes=$(docker network ls -q --filter "label=com.docker.compose.project=$proyecto")
    if [ -n "$contenedores$volumenes$redes" ]; then
      echo "Ya existen recursos del proyecto $proyecto; no se modificaron. Elija otro nombre o elimínelos explícitamente." >&2
      exit 1
    fi
    echo "Creando proyecto aislado $proyecto; no se borrarán recursos existentes."
    compose up -d --build --wait --wait-timeout 300
    echo "Demo disponible en http://127.0.0.1:${DEMO_PORT:-8088}/"
    ;;
  estado)
    compose ps --all
    ;;
  eliminar)
    [ -t 0 ] || { echo "La eliminación requiere una terminal interactiva." >&2; exit 1; }
    echo "ATENCIÓN: se eliminarán contenedores, red y volúmenes del proyecto $proyecto, incluyendo BD y evidencias."
    printf 'Escriba exactamente %s para confirmar: ' "$proyecto" >&2
    IFS= read -r confirmacion || exit 1
    if [ "$confirmacion" != "$proyecto" ]; then
      echo "Cancelado; no se eliminó nada." >&2
      exit 1
    fi
    compose down --volumes --remove-orphans
    ;;
esac
