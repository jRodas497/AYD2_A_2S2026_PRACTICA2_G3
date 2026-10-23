# Código tomado de la Fase 3

Parte del proyecto partió de la rama `develop` de la Fase 3 de nuestro grupo (SGO-Logic), en el commit `469470c`. Los archivos se copiaron una sola vez y no quedaron enlazados con el original. Al traerlos se quitaron los nombres de SGO-Logic (`com.sgologic`, `sgologic-backend`, rutas `FASE 2/...`) y todo lo que la práctica no usa.

## Frontend

| De la Fase 3 | En esta práctica |
|---|---|
| Configuración de Vite, React 19, TypeScript, Tailwind y oxlint, con su `package-lock.json` | `servicios/frontend/` |
| Componentes de botón, precio, enlace de regreso y selector de cantidad | `servicios/frontend/src/shared/components/` (`Button`, `PriceTag`, `BackLink`, `QuantityStepper`) |
| Manejo de errores de las respuestas HTTP, con su prueba | `servicios/frontend/src/shared/api/httpErrors.ts` |
| Módulo de catálogo: lista con buscador, tarjeta de producto, hook y búsqueda | Sirvió de modelo para `servicios/frontend/src/features/libros/`, con tipos y llamadas propias para `Libro` |
| Plantilla `nginx.conf.template` con `envsubst` y resolver dinámico | `servicios/gateway/nginx.conf.template`, con una ruta para Libros y otra para Ventas en lugar de un único `/api/` |

No se copió `apiFetch`, porque dependía de la sesión de login y la práctica no tiene login.

## Backend

El `pom.xml` y el `application.yml` de la Fase 3 sirvieron de base para Libros y Ventas: Spring Boot, Java 21, JPA, PostgreSQL, puerto por variable y conexión a la base por variables de entorno. Se quitaron Kafka, seguridad, JWT, el SDK de S3 y la configuración de ERP, proveedores y autenticación.

`DatabaseUrlEnvironmentPostProcessor`, que traducía `DATABASE_URL` a `spring.datasource.*`, no se usó. Con RDS bastan `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` y `DB_PASSWORD`.

## Docker, base de datos y CI

Los Dockerfile en dos etapas (compilar y luego ejecutar) vienen de los de la Fase 3. Allá el contexto de construcción era la raíz del repositorio por una limitación de Render con espacios en la ruta. Aquí ese problema no existe, así que cada servicio tiene su Dockerfile y su `.dockerignore` en su propia carpeta.

`migrate.sh` y `aplicar-migraciones-nube.sh` están en `scripts/referencia/` sin cambios. Aplican SQL a una base administrada desde un contenedor `postgres:16-alpine`, y los roles `libros` y `ventas` de Ansible usan esa misma idea para cargar `schema.sql` en RDS. Los scripts no se ejecutan en esta práctica porque dependen de las migraciones de SGO-Logic.

El `ci.yml` de la Fase 3, sin el job de pruebas end-to-end, sirvió de plantilla para `.github/workflows/ci.yml`.

## Lo que no se tomó

Kafka, outbox, proveedores simulados, autenticación, reservas, crédito, migraciones y el resto de módulos de SGO-Logic.
