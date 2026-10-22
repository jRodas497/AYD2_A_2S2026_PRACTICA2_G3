# Reparto del trabajo

Entrega el 22 de octubre de 2026 a las 18:00, calificación el 24. Todos los integrantes necesitan commits propios y deben estar presentes en la calificación.

## Estado

Está en `develop` y probado: servicios de Libros y Ventas, frontend, gateway, `docker-compose.yml`, manual de usuario, diagramas de despliegue, arquitectura, README y `scripts/verificar.sh`. Terraform está aplicado en `us-east-2` con Ansible y CI/CD, y el despliegue pasa la verificación.

Falta repetir las capturas del manual contra el balanceador, las pruebas unitarias de Libros y Ventas y la revisión final antes de la calificación.

## Quién hace qué

Trabajan Juan José y Ricardo. Los otros tres integrantes del grupo figuran en el README, pero no tienen tareas asignadas.

| Integrante | Carnet | Tarea |
|---|---|---|
| Juan José Rodas Mansilla | 202200389 | Terraform completo (red, seguridad, máquinas, bases, balanceador y ECR), Ansible, CI/CD y despliegue en la nube |
| Hernan Ricardo Avila Castillo | 9516085 | Servicios de Libros y Ventas, frontend, gateway, compose, documentación y `scripts/verificar.sh`; pruebas de Libros y Ventas si queda tiempo |

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
