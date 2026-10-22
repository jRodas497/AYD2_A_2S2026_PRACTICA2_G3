# Base tomada de la Fase 3

Copias sin modificar de archivos de la rama `develop` de la Fase 3, en el commit `469470c`. Están aquí como punto de partida; el original no se toca y no hay enlace entre los dos. Si algo cambia allá, esto no se entera.

Todo lleva nombres de SGO-Logic (`com.sgologic`, `sgologic-backend`, `FASE 2/...`). Al pasarlo al repositorio de la práctica hay que renombrarlo y quitar lo que no aplica.

## Frontend

`frontend/` trae la configuración completa de Vite, React 19, TypeScript, Tailwind y oxlint, con su `package-lock.json` para que `npm ci` instale lo mismo. Va a `servicios/frontend/`.

- `src/shared/components`: botón, etiqueta, precio, enlace de regreso y selector de cantidad. Sirven tal cual.
- `src/shared/api/httpErrors.ts`: manejo de errores de las respuestas HTTP, con su prueba.
- `src/features/catalogo`: la lista con buscador, la tarjeta de producto, el hook y la lógica de búsqueda. Es la referencia para el listado de libros; usa tipos y repositorio del catálogo de SGO-Logic, así que hay que adaptarlos a `Libro`. No se copió `apiFetch` porque ata las llamadas a la sesión de login, y la práctica no tiene login.
- `nginx.conf.template`: el proxy de `/api` con `envsubst` y resolver dinámico. Es el punto de partida del gateway (cambiar el único `location /api/` por uno para Libros y otro para Ventas).

## Backend

`backend/` es una referencia, no un proyecto que compile solo.

- `pom.xml`: Spring Boot, Java 21, JPA, PostgreSQL. Hay que quitar Kafka, seguridad, JWT y el SDK de S3.
- `application.yml`: patrón de puerto por variable y datasource por variables de entorno. Quitar todo lo de Kafka, ERP, proveedores y auth.
- `DatabaseUrlEnvironmentPostProcessor.java` y `META-INF/spring.factories`: traducen `DATABASE_URL` a `spring.datasource.*`. Opcional; con RDS bastan `DB_HOST` y compañía.

## Docker, base de datos y CI

- `docker/Dockerfile.backend` y `Dockerfile.frontend`: construcción en dos etapas. Las rutas apuntan a `FASE 2/...` y hay que cambiarlas. Usan contexto en la raíz por una limitación de Render con espacios en la ruta que acá no existe, así que cada servicio puede tener su Dockerfile dentro de su carpeta y contexto propio. `.dockerignore` va con ellos como referencia.
- `db/migrate.sh` y `aplicar-migraciones-nube.sh`: aplicar SQL a una base administrada desde un contenedor `postgres:16-alpine`. La idea se reutiliza en el rol de Ansible; los scripts dependen de las migraciones de SGO-Logic y de dos roles de base que acá no se usan.
- `ci/ci.yml`: pruebas de backend y frontend en GitHub Actions. Como plantilla, quitar el job de e2e y la Fase 3.

## Diagramas

`diagramas/Diagrama-Despliegue-Fase2.drawio` es el diagrama de despliegue de la Fase 2, para tomar el estilo de dibujo en draw.io. El de la práctica es distinto (nube, VPC, balanceador, Terraform y Ansible).

## Lo que no se copió

Kafka, outbox, proveedores simulados, autenticación, reservas, crédito, migraciones y el resto de módulos de SGO-Logic: no los usa la práctica.
