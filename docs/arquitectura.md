# Arquitectura

Organización de la Librería AYD, contrato de cada API y modelo de datos. El despliegue en AWS está en [diagrama-despliegue.md](diagrama-despliegue.md).

## Componentes

La plataforma usa microservicios: dos servicios, cada uno con su propia base de datos, y un gateway como único punto de entrada.

| Componente | Responsabilidad |
|---|---|
| Frontend | Aplicación web de una sola página. Llama a rutas relativas (`/api/libros`, `/api/ventas`) y no necesita saber dónde corren los servicios. |
| API Gateway | nginx. Envía `/api/libros` a Libros, `/api/ventas` a Ventas y el resto al frontend, sin modificar la ruta. |
| Libros | Catálogo (título, autor, precio, existencias) y búsqueda. |
| Ventas | Registro de ventas y ranking. |

Los dos servicios tienen tres capas: controlador (HTTP y validación), servicio (reglas de negocio) y repositorio (acceso a datos). Ventas tiene además un cliente HTTP para llamar a Libros.

## Comunicación entre servicios

Los servicios solo se llaman entre sí en un caso: al registrar una venta, Ventas pide a Libros que descuente las existencias.

1. Ventas recibe `{libroId, cantidad}` y llama a `PATCH /api/libros/{id}/existencias` con `{"delta": -cantidad}`.
2. Libros descuenta con un único `UPDATE` que exige `existencias + delta >= 0`. Si no hay suficientes, responde 409 y no cambia nada. Por eso dos ventas simultáneas no pueden dejar las existencias en negativo.
3. Libros devuelve el libro actualizado y Ventas guarda la venta con el título, el autor y el precio de ese momento.
4. Si falla el guardado, Ventas devuelve las existencias con un `delta` positivo.

El cliente espera 2 segundos para conectar y 5 para leer. Si Libros no responde en ese tiempo, Ventas contesta 503.

## Contrato de Libros

Puerto 8081. Las rutas empiezan con `/api/libros`.

| Método | Ruta | Cuerpo | Respuestas |
|---|---|---|---|
| GET | `/api/libros` | | 200 lista ordenada por título |
| GET | `/api/libros?q=texto` | | 200 libros cuyo título o autor contiene el texto, sin distinguir mayúsculas ni acentos |
| GET | `/api/libros/{id}` | | 200, 404 |
| POST | `/api/libros` | libro | 201 con `Location`, 400 |
| PUT | `/api/libros/{id}` | libro | 200, 400, 404 |
| PATCH | `/api/libros/{id}/existencias` | `{"delta": n}` | 200, 404, 409 si no hay suficientes |
| GET | `/health` | | 200 `{"status":"UP"}` |

Ejemplo de libro: `{"id": 1, "titulo": "Cien años de soledad", "autor": "Gabriel García Márquez", "precio": 95.00, "existencias": 25}`. El título admite hasta 200 caracteres y el autor hasta 150. El precio y las existencias no pueden ser negativos.

## Contrato de Ventas

Puerto 8082. Las rutas empiezan con `/api/ventas`.

| Método | Ruta | Cuerpo | Respuestas |
|---|---|---|---|
| POST | `/api/ventas` | `{"libroId": n, "cantidad": n}` | 201; 400 si la cantidad es menor que 1; 404 si el libro no existe; 409 si no hay suficientes existencias; 502 si Libros responde algo inesperado; 503 si Libros no responde |
| GET | `/api/ventas` | | 200 historial, de la venta más reciente a la más antigua |
| GET | `/api/ventas/ranking?limite=10` | | 200 libros más vendidos; el límite va de 1 a 100 |
| GET | `/health` | | 200 `{"status":"UP"}` |

Ejemplo de venta: `{"id": 19, "libroId": 10, "titulo": "El Aleph", "autor": "Jorge Luis Borges", "cantidad": 2, "precioUnitario": 68.00, "fecha": "2026-10-22T04:15:29Z"}`. La fecha la asigna el servidor. Una entrada del ranking tiene la forma `{"libroId": 1, "titulo": "...", "autor": "...", "totalVendido": 14}`.

Las respuestas de error incluyen el campo `message` con el motivo. El gateway también responde `GET /health` con `ok`; es el chequeo que usa el balanceador.

## Modelo de persistencia

Cada servicio tiene su propia base PostgreSQL 16 y ninguno lee las tablas del otro. En AWS son dos instancias RDS en subredes privadas. El esquema y los datos de ejemplo están en `servicios/libros/db/schema.sql` y `servicios/ventas/db/schema.sql`; se pueden aplicar más de una vez sin duplicar filas.

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

`libro_id` no es clave foránea porque las tablas están en bases distintas. Ventas copia el título, el autor y el precio para calcular el ranking sin consultar a Libros y para que el historial no cambie si luego se edita un libro. El ranking agrupa por `libro_id`, suma `cantidad` y ordena de mayor a menor.

Hibernate no crea ni modifica tablas (`ddl-auto: none`). El esquema solo cambia con los archivos SQL.

## Decisiones de diseño

Cada servicio tiene su propia base para que puedan cambiar o escalar por separado.

El gateway es un nginx que solo enruta por prefijo. No tiene lógica propia y le permite al frontend usar rutas relativas.

El descuento de existencias es sincrónico porque era la forma más simple de mantenerlas correctas. A cambio, Ventas depende de Libros para registrar una venta, y por eso la llamada tiene tiempos de espera y compensación.

No hay autenticación porque el enunciado no la pide.

La configuración llega por variables de entorno: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` y, en Ventas, `LIBROS_URL`.
