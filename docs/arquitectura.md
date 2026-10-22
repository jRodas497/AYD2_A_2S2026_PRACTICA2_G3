# Arquitectura

Cómo está organizada la Librería AYD, qué contrato tiene cada API y cómo se guardan los datos. El despliegue en la nube está en [diagrama-despliegue.md](diagrama-despliegue.md).

## Patrón y capas

La plataforma sigue el patrón de microservicios. Hay dos servicios con responsabilidades separadas, cada uno con su propia base de datos, y un gateway como único punto de entrada.

- **Frontend:** aplicación web de una sola página. Llama siempre a rutas relativas (`/api/libros`, `/api/ventas`) y no sabe dónde viven los servicios.
- **API Gateway:** nginx. Enruta por prefijo: `/api/libros` a Libros, `/api/ventas` a Ventas y todo lo demás al frontend. Reenvía la ruta original sin modificarla.
- **Libros:** dueño del catálogo (título, autor, precio, existencias) y de la búsqueda.
- **Ventas:** dueño de las transacciones y del ranking.

Cada servicio se organiza en capas: controlador (HTTP y validación), servicio (reglas de negocio) y repositorio (acceso a datos). Ventas tiene además un cliente HTTP hacia Libros.

## Comunicación entre servicios

Hay una sola llamada entre servicios: al registrar una venta, Ventas pide a Libros descontar las existencias.

1. Ventas recibe `{libroId, cantidad}` y llama a `PATCH /api/libros/{id}/existencias` con `{"delta": -cantidad}`.
2. Libros descuenta con un solo `UPDATE` condicionado (`existencias + delta >= 0`). Si no alcanzan, responde 409 y no cambia nada. Así dos ventas simultáneas no dejan las existencias en negativo.
3. Libros devuelve el libro ya actualizado. Ventas guarda la venta con una copia del título, el autor y el precio de ese momento.
4. Si el guardado falla, Ventas devuelve las existencias con `delta` positivo para no dejar descuentos de ventas que no existen.

La llamada tiene 2 segundos de espera para conectar y 5 para leer. Si Libros no responde, Ventas contesta 503 en lugar de quedarse colgada.

## Contrato de Libros

Puerto 8081. Todas las rutas cuelgan de `/api/libros`.

| Método | Ruta | Cuerpo | Respuestas |
|---|---|---|---|
| GET | `/api/libros` | | 200 lista ordenada por título |
| GET | `/api/libros?q=texto` | | 200 libros cuyo título o autor contiene el texto, sin distinguir mayúsculas ni acentos |
| GET | `/api/libros/{id}` | | 200, 404 |
| POST | `/api/libros` | libro | 201 con `Location`, 400 |
| PUT | `/api/libros/{id}` | libro | 200, 400, 404 |
| PATCH | `/api/libros/{id}/existencias` | `{"delta": n}` | 200, 404, 409 si no alcanzan |
| GET | `/health` | | 200 `{"status":"UP"}` |

Un libro se ve así: `{"id": 1, "titulo": "Cien años de soledad", "autor": "Gabriel García Márquez", "precio": 95.00, "existencias": 25}`. Al crear o actualizar, el título admite hasta 200 caracteres, el autor hasta 150, y el precio y las existencias no pueden ser negativos.

## Contrato de Ventas

Puerto 8082. Todas las rutas cuelgan de `/api/ventas`.

| Método | Ruta | Cuerpo | Respuestas |
|---|---|---|---|
| POST | `/api/ventas` | `{"libroId": n, "cantidad": n}` | 201, 400 si la cantidad es menor que 1, 404 si no existe el libro, 409 si no alcanzan las existencias, 502 si Libros responde algo inesperado, 503 si Libros no responde |
| GET | `/api/ventas` | | 200 historial, de la más reciente a la más antigua |
| GET | `/api/ventas/ranking?limite=10` | | 200 los libros más vendidos; el límite se acota entre 1 y 100 |
| GET | `/health` | | 200 `{"status":"UP"}` |

Una venta se ve así: `{"id": 19, "libroId": 10, "titulo": "El Aleph", "autor": "Jorge Luis Borges", "cantidad": 2, "precioUnitario": 68.00, "fecha": "2026-10-22T04:15:29Z"}`. La fecha la pone el servidor. Una entrada del ranking es `{"libroId": 1, "titulo": "...", "autor": "...", "totalVendido": 14}`.

Los errores traen siempre el campo `message` con el motivo. El gateway responde además `GET /health` con `ok`, que usa el balanceador.

## Modelo de persistencia

Cada servicio tiene su propia base PostgreSQL 16 y es el único que la toca. Ninguno lee las tablas del otro. En AWS son dos instancias RDS en subredes privadas. El esquema y los datos de ejemplo están en `servicios/libros/db/schema.sql` y `servicios/ventas/db/schema.sql`. Los dos se pueden aplicar varias veces sin duplicar datos.

Tabla `libro` (base `libros`):

| Columna | Tipo | Restricción |
|---|---|---|
| id | bigint | clave primaria, generada |
| titulo | varchar(200) | obligatorio |
| autor | varchar(150) | obligatorio |
| precio | numeric(10,2) | obligatorio, no negativo |
| existencias | integer | obligatorio, no negativo, 0 por defecto |

Tabla `venta` (base `ventas`):

| Columna | Tipo | Restricción |
|---|---|---|
| id | bigint | clave primaria, generada |
| libro_id | bigint | obligatorio, con índice |
| titulo | varchar(200) | copia del momento de la venta |
| autor | varchar(150) | copia del momento de la venta |
| cantidad | integer | mayor que cero |
| precio_unitario | numeric(10,2) | no negativo |
| fecha | timestamptz | por defecto la hora actual |

`libro_id` no es una clave foránea porque las dos tablas viven en bases distintas. Ventas guarda copia del título, el autor y el precio para que el ranking salga de su propia base sin consultar a Libros, y para que el historial no cambie si después se edita el libro. El ranking es una agrupación por `libro_id` con la suma de `cantidad`, de mayor a menor.

Hibernate nunca crea ni cambia tablas (`ddl-auto: none`): el esquema solo cambia por los archivos SQL.

## Decisiones de diseño

- **Una base por servicio.** Mantiene los servicios desacoplados y permite escalarlos o cambiarlos por separado.
- **Gateway por prefijo.** Un nginx cumple el papel de API Gateway sin lógica propia y deja al frontend con rutas relativas.
- **Descuento sincrónico.** Es la forma más simple de que las existencias tengan sentido. Su costo es que Ventas depende de Libros, y por eso la llamada tiene tiempos de espera y compensación.
- **Sin autenticación.** La práctica no la pide.
- **Configuración por variables de entorno.** Las conexiones a las bases y la dirección de Libros llegan por variables (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `LIBROS_URL`). Ninguna contraseña está en el repositorio.
