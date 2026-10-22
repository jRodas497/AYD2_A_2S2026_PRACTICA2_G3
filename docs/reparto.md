# Reparto del trabajo

Entrega el 22 de octubre de 2026 a las 18:00, calificación el 24. Todos los integrantes necesitan commits propios y deben estar presentes en la calificación.

## Estado

Está en `develop` y probado en local: servicios de Libros y Ventas, frontend, gateway, `docker-compose.yml`, manual de usuario, diagrama de despliegue, arquitectura y README. También hay CI y CD (apagado), scripts de despliegue, roles de Ansible y los repositorios de ECR en Terraform.

Falta el resto de Terraform (red, seguridad, máquinas, bases y balanceador), el despliegue real y las pruebas.

## Quién hace qué

| Integrante | Carnet | Tarea |
|---|---|---|
| Juan José Rodas Mansilla | 202200389 | `compute.tf`, `database.tf` y `alb.tf` de Terraform; despliegue con Ansible y verificación en la nube |
| Williams Bramlley Constanza Oscal | 199919737 | `network.tf` y `security.tf` de Terraform: VPC, dos subredes públicas y dos privadas, rutas y grupos de seguridad según la tabla de [aws.md](aws.md) |
| Carmen Maria Marroquin Llamas | 202001132 | Pruebas de Libros: búsqueda con acentos y comodines, 404, descuento de existencias y 409 |
| Sebastian Alejandro Vasquez Cartagena | 202109114 | Pruebas de Ventas con Libros simulado: descuento, rechazo y compensación si falla el guardado |
| Hernan Ricardo Avila Castillo | 9516085 | Servicios, frontend, gateway, compose y documentación; `scripts/verificar.sh` |

Williams y Juan José acuerdan los nombres de los outputs de la red (`vpc_id`, subredes públicas y privadas, grupos de seguridad) antes de escribir sus archivos. `terraform validate` no necesita cuenta de AWS; `plan` y `apply` sí.

## Contrato entre las partes

| Componente | Puerto | Salud | Variables |
|---|---|---|---|
| Libros | 8081 | `/health` | `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` |
| Ventas | 8082 | `/health` | las mismas y `LIBROS_URL` |
| Frontend | 80 | `/health` | ninguna |
| Gateway | 80 | `/health` | `LIBROS_HOST`, `VENTAS_HOST`, `FRONTEND_HOST` |

El balanceador usa `/health` como chequeo hacia el gateway. Las rutas de cada API están en [arquitectura.md](arquitectura.md).

## Git

Ramas `feature/<carnet>-<tema>` que salen de `develop`, un tema por rama. Commits con el formato `<carnet>: mensaje`, sin pies de página. Los PR se mezclan sin borrar la rama. Un merge de PR no cuenta como commit válido, así que cada quien necesita commits propios en sus ramas.

## Antes de la calificación

- Aceptar la invitación al repositorio y revisar que el último `develop` compile.
- Con la infraestructura arriba, correr `scripts/verificar.sh` y repetir las capturas del manual contra el balanceador.
- Todos presentes el día de la calificación.

## Al terminar

Después de la calificación se corre `terraform destroy` y se revisa en la consola que no queden instancias, IP elásticas, balanceadores ni bases.
