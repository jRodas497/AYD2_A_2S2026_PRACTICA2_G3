#!/usr/bin/env bash
# Comprueba de punta a punta que la plataforma responde como pide la lista de verificación.
# Uso:   scripts/verificar.sh [URL_BASE]        (por defecto http://localhost:9080)
# Ejemplo en AWS: scripts/verificar.sh http://<dns-del-balanceador>
#
# Registra una venta de un ejemplar para comprobar que el ranking cambia; con SIN_VENTA=1 se omite.
# Opcionales, para comprobar que no hay acceso directo desde internet (deben fallar al conectar):
#   LIBROS_IP, VENTAS_IP (puertos 8081 y 8082) y LIBROS_DB_HOST, VENTAS_DB_HOST (puerto 5432).
# Termina con código 0 si todo pasa y con el número de comprobaciones fallidas si no.
set -u

BASE="${1:-${BASE_URL:-http://localhost:9080}}"
BASE="${BASE%/}"
fallos=0

command -v curl >/dev/null || { echo "Falta curl" >&2; exit 2; }
command -v python3 >/dev/null || { echo "Falta python3" >&2; exit 2; }

ok()  { echo "  ok    $1"; }
mal() { echo "  FALLA $1"; fallos=$((fallos + 1)); }

# Guarda el cuerpo en $CUERPO y el código HTTP en $CODIGO.
pedir() {
  local salida
  salida="$(curl -s -m 15 -w $'\n%{http_code}' "$@")" || { CODIGO=000; CUERPO=""; return; }
  CODIGO="${salida##*$'\n'}"
  CUERPO="${salida%$'\n'*}"
}

comprobar() { # descripción, código esperado
  if [ "$CODIGO" = "$2" ]; then ok "$1"; else mal "$1 (esperaba $2, llegó $CODIGO)"; fi
}

json() { # expresión Python sobre la variable d (el JSON de $CUERPO)
  printf '%s' "$CUERPO" | python3 -c "import sys,json; d=json.load(sys.stdin); print($1)" 2>/dev/null
}

cerrado() { # descripción, host, puerto: debe NO conectar
  if curl -s -m 5 -o /dev/null "http://$2:$3/health"; then
    mal "$1: respondió y no debería ser accesible desde fuera"
  else
    ok "$1: sin acceso directo"
  fi
}

echo "Verificando $BASE"

echo "Gateway y frontend"
pedir "$BASE/health";  comprobar "GET /health" 200
pedir "$BASE/"
if [ "$CODIGO" = 200 ] && printf '%s' "$CUERPO" | grep -q 'id="root"'; then ok "la página principal carga"; else mal "la página principal no carga (código $CODIGO)"; fi
pedir "$BASE/ranking"; comprobar "la ruta /ranking del frontend carga" 200

echo "Libros"
pedir "$BASE/api/libros"; comprobar "GET /api/libros" 200
total="$(json 'len(d)')"
if [ "${total:-0}" -gt 0 ] 2>/dev/null; then ok "el catálogo tiene $total libros"; else mal "el catálogo está vacío"; fi
if [ "$(json 'all(k in d[0] for k in ("titulo","autor","precio","existencias"))')" = "True" ]; then
  ok "cada libro trae título, autor, precio y existencias"
else
  mal "faltan campos en los libros"
fi
titulo="$(json 'd[0]["titulo"].split()[0]')"
autor="$(json 'd[0]["autor"].split()[-1]')"
pedir -G "$BASE/api/libros" --data-urlencode "q=$titulo"
n="$(json 'len(d)')"; if [ "$CODIGO" = 200 ] && [ "${n:-0}" -gt 0 ] 2>/dev/null; then ok "búsqueda por título ($titulo): $n resultados"; else mal "búsqueda por título ($titulo) sin resultados"; fi
pedir -G "$BASE/api/libros" --data-urlencode "q=$autor"
n="$(json 'len(d)')"; if [ "$CODIGO" = 200 ] && [ "${n:-0}" -gt 0 ] 2>/dev/null; then ok "búsqueda por autor ($autor): $n resultados"; else mal "búsqueda por autor ($autor) sin resultados"; fi
pedir -G "$BASE/api/libros" --data-urlencode "q=zzzz-no-existe"
if [ "$CODIGO" = 200 ] && [ "$(json 'len(d)')" = 0 ]; then ok "una búsqueda sin coincidencias devuelve lista vacía"; else mal "búsqueda sin coincidencias"; fi
pedir "$BASE/api/libros/999999"; comprobar "un libro inexistente responde 404" 404

echo "Ventas y ranking"
pedir "$BASE/api/ventas/ranking?limite=10"; comprobar "GET /api/ventas/ranking" 200
if [ "$(json 'len(d) > 0')" = "True" ]; then ok "el ranking tiene $(json 'len(d)') libros"; else mal "el ranking está vacío"; fi
pedir "$BASE/api/ventas"; comprobar "GET /api/ventas" 200
pedir -X POST "$BASE/api/ventas" -H 'Content-Type: application/json' -d '{"libroId":999999,"cantidad":1}'
comprobar "vender un libro inexistente responde 404" 404
pedir -X POST "$BASE/api/ventas" -H 'Content-Type: application/json' -d '{"libroId":1,"cantidad":0}'
comprobar "vender cantidad 0 responde 400" 400

if [ "${SIN_VENTA:-0}" != 1 ]; then
  pedir "$BASE/api/libros"
  libro="$(json 'next(l["id"] for l in d if l["existencias"] > 2)')"
  if [ -z "$libro" ]; then
    mal "no hay un libro con existencias para probar una venta"
  else
    pedir -G "$BASE/api/ventas/ranking" --data-urlencode "limite=100"
    antes="$(json "next((r['totalVendido'] for r in d if r['libroId'] == $libro), 0)")"
    pedir "$BASE/api/libros/$libro"; exist_antes="$(json 'd["existencias"]')"
    pedir -X POST "$BASE/api/ventas" -H 'Content-Type: application/json' -d "{\"libroId\":$libro,\"cantidad\":1}"
    comprobar "registrar una venta del libro $libro" 201
    pedir -G "$BASE/api/ventas/ranking" --data-urlencode "limite=100"
    despues="$(json "next((r['totalVendido'] for r in d if r['libroId'] == $libro), 0)")"
    if [ "${despues:-0}" = "$((antes + 1))" ]; then ok "el ranking subió de $antes a $despues"; else mal "el ranking no reflejó la venta ($antes -> $despues)"; fi
    pedir "$BASE/api/libros/$libro"
    if [ "$(json 'd["existencias"]')" = "$((exist_antes - 1))" ]; then ok "las existencias bajaron de $exist_antes a $((exist_antes - 1))"; else mal "las existencias no bajaron"; fi
    pedir -X POST "$BASE/api/ventas" -H 'Content-Type: application/json' -d "{\"libroId\":$libro,\"cantidad\":999999}"
    comprobar "vender más de lo que hay responde 409" 409
  fi
else
  echo "  (venta omitida por SIN_VENTA=1)"
fi

if [ -n "${LIBROS_IP:-}${VENTAS_IP:-}${LIBROS_DB_HOST:-}${VENTAS_DB_HOST:-}" ]; then
  echo "Acceso directo desde fuera"
  [ -n "${LIBROS_IP:-}" ]  && cerrado "Libros en ${LIBROS_IP}:8081" "$LIBROS_IP" 8081
  [ -n "${VENTAS_IP:-}" ]  && cerrado "Ventas en ${VENTAS_IP}:8082" "$VENTAS_IP" 8082
  for par in "Base de Libros|${LIBROS_DB_HOST:-}" "Base de Ventas|${VENTAS_DB_HOST:-}"; do
    nombre="${par%%|*}"; host="${par#*|}"
    [ -z "$host" ] && continue
    if (exec 3<>"/dev/tcp/$host/5432") 2>/dev/null; then mal "$nombre ($host:5432) acepta conexiones desde fuera"; else ok "$nombre: sin acceso desde fuera"; fi
  done
fi

echo
if [ "$fallos" -eq 0 ]; then echo "Todo en orden."; else echo "$fallos comprobaciones fallaron."; fi
exit "$fallos"
