# Reparto del trabajo

Entrega el 22 de octubre de 2026 a las 18:00, calificación el 24. Somos dos: Ricardo (9516085) y Juan José, que tiene la cuenta de AWS.

## Estado

Ya está en `develop` el servicio de Libros (probado en local), el gateway nginx y un `docker-compose.yml` con Libros y el gateway. Faltan Ventas, el frontend, toda la infraestructura y los dos documentos.

Juan José tiene el frontend además de la infraestructura, que es la parte más pesada. Si el tiempo aprieta, Ricardo toma Ansible cuando termine Ventas.

## Ricardo

- Servicio de Ventas: registro de ventas, listado, ranking, llamada a Libros para descontar existencias, `schema.sql` y Dockerfile.
- Compose local completo, para probar todo junto antes de subir nada.
- Manual de usuario y borrador del diagrama de despliegue.

## Juan José

- Frontend: listado con buscador, detalle y ranking, con su Dockerfile. Llama siempre a rutas relativas (`/api/libros`, `/api/ventas/ranking`). Parte de `servicios/frontend/`, que trae la configuración de la Fase 3; el código del catálogo hay que adaptarlo a `Libro`.
- Terraform en `terraform/`: VPC con dos subredes públicas y dos privadas, grupos de seguridad, tres EC2 con IP elástica (frontend y gateway, libros, ventas), balanceador en el puerto 80 hacia la máquina del gateway, dos RDS PostgreSQL 16 sin acceso público y cuatro repositorios en ECR (libros, ventas, frontend y gateway). Todo con la etiqueta `proyecto = ayd-libreria`.
- `scripts/construir-y-subir.sh`: construye con `--platform linux/amd64` y sube a ECR.
- Ansible en `ansible/` y `scripts/desplegar.sh`: instala Docker, configura el sistema y levanta los contenedores. Una segunda corrida no debe cambiar nada.
- Ajustar el diagrama de despliegue con lo que Terraform realmente cree, y la verificación final en la nube.

## Contrato entre las dos partes

| Componente | Puerto | Salud | Variables |
|---|---|---|---|
| Libros | 8081 | `/health` | `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` |
| Ventas | 8082 | `/health` | las mismas y `LIBROS_URL` |
| Frontend | 80 | `/` | ninguna |
| Gateway | 80 | `/health` | `LIBROS_HOST`, `VENTAS_HOST`, `FRONTEND_HOST` |

El balanceador usa `/health` como chequeo hacia el gateway. Cada servicio trae su `db/schema.sql`, que se puede aplicar varias veces sin duplicar datos. Las contraseñas de las bases las genera Terraform con `random_password` y no van al repositorio.

## Antes de empezar con AWS

Juan José corre `aws sts get-caller-identity` y confirma que es su cuenta. Revisa si deja crear roles IAM y los límites de IP elásticas y RDS. Si es una cuenta educativa sin roles, Ansible hace `docker login` a ECR con un token temporal. Ansible en Windows solo corre con WSL.

## Git

Ramas `feature/<carnet>-<tema>` que salen de `develop`, un tema por rama. Commits con el formato `<carnet>: mensaje`, sin pies de página. Los PR se mezclan sin borrar la rama. Un merge de PR no cuenta como commit válido, así que cada quien necesita commits propios en sus ramas.

## Al terminar

Después de la calificación se corre `terraform destroy` y se revisa en la consola que no queden instancias, IP elásticas, balanceadores ni bases.
