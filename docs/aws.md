# AWS: preparación, CI/CD y orden de trabajo

## Qué hay listo

| Pieza | Dónde | Estado |
|---|---|---|
| CI (Libros, frontend, imágenes, Terraform, Ansible) | `.github/workflows/ci.yml` | Funcionando; el frontend ya compila |
| CD (subir a ECR y desplegar con Ansible) | `.github/workflows/cd.yml` | Apagado hasta `AWS_DEPLOY_ENABLED=true` |
| Terraform: red, seguridad, cómputo, RDS, balanceador, ECR y outputs | `terraform/` | Aplicado en `us-east-2` (55 recursos) y verificado |
| Ansible: Docker, ECR, esquemas de BD, contenedores | `ansible/` | Validado con `--syntax-check`; sin probar contra una EC2 real |
| Build y push a ECR | `scripts/construir-y-subir.sh` | Sin probar contra ECR |
| Despliegue | `scripts/desplegar.sh` | Sin probar contra EC2 |
| Revisión de cuenta y herramientas | `scripts/preflight-aws.sh` | Solo lecturas |

## Cuenta compartida: región y recursos ajenos

El detalle, con la tabla de nombres de todos los recursos de Terraform, está en [diagrama-despliegue.md](diagrama-despliegue.md#región-y-cuenta-compartida).

La cuenta de AWS la comparte alguien más. En `us-east-1` ya hay una infraestructura que **no es nuestra** (`libreria-ayd-*`: VPC, 3 EC2, 2 RDS, balanceador y las claves `Practica2_AYD2` y `Claves_Proyecto_AYD2`) y que tiene ocupadas las 5 IP elásticas de esa región. No se toca ni se borra.

Nuestro despliegue va en **`us-east-2` (Ohio)**, que estaba vacía, con nombres `ayd-libreria-*` y la etiqueta `proyecto = ayd-libreria`. Las IP elásticas y los pares de claves son por región, así que no chocan con lo anterior.

## Despliegue actual

Desplegado el 22 de octubre de 2026 en `us-east-2`. La aplicación responde en el balanceador:

`http://ayd-libreria-alb-2091800383.us-east-2.elb.amazonaws.com`

`scripts/verificar.sh` contra esa dirección pasa completo: página, catálogo (15 libros), búsquedas, ranking, ventas con sus errores (404, 400 y 409), y comprobación de que Libros, Ventas y las bases no son accesibles desde internet. El balanceador reporta el gateway como `healthy`.

La verificación registra una venta de un ejemplar del libro 1, así que sus existencias y el ranking ya no son los de la siembra inicial.

## Antes de tocar AWS

1. `scripts/preflight-aws.sh`: revisa herramientas, identidad (`aws sts get-caller-identity`), permisos de lectura, IAM, IP elásticas y claves SSH.
2. Instalar lo que falte en la máquina: `terraform` y `ansible` (con la colección `community.docker`).
3. Crear un par de claves EC2 y guardar el `.pem` en `~/.ssh/ayd.pem` con permisos `600`.
4. Copiar `terraform/terraform.tfvars.example` a `terraform/terraform.tfvars` y completar `admin_cidr` y `key_name`.

## Convenciones

- Etiqueta en todo recurso: `proyecto = ayd-libreria` (la pone el `default_tags` del proveedor).
- Repositorios ECR: `ayd-libreria/libros`, `ayd-libreria/ventas`, `ayd-libreria/frontend`, `ayd-libreria/gateway`.
- AMI de las EC2: Amazon Linux 2023 x86_64 (usuario `ec2-user`; el rol `docker` de Ansible usa `dnf`). Tipo `t3.small`.
- Imágenes con etiqueta del commit y `latest`.

| Componente | Puerto | Quién puede llegar |
|---|---|---|
| Balanceador | 80 | Internet |
| Gateway (EC2 del frontend) | 80 | Solo el balanceador |
| Libros | 8081 | EC2 del gateway y EC2 de Ventas |
| Ventas | 8082 | EC2 del gateway |
| PostgreSQL (una por servicio) | 5432 | Solo la EC2 de su servicio |
| SSH | 22 | `admin_cidr` |

El frontend y el gateway comparten EC2. Solo el gateway publica el puerto 80; el frontend queda interno en la red de Docker.

## Qué crea Terraform

`network.tf` (VPC, 2 subredes públicas y 2 privadas en dos zonas, internet gateway, rutas), `security.tf` (grupos y reglas según la tabla), `compute.tf` (3 EC2 `t3.small` con IP elástica; AMI de Amazon Linux 2023 desde el parámetro SSM), `database.tf` (2 RDS PostgreSQL 16 en subredes privadas, con `random_password`), `alb.tf` (balanceador en el 80 hacia la EC2 del gateway, con chequeo `/health`) y `ecr.tf`. Los nombres de cada recurso están en [diagrama-despliegue.md](diagrama-despliegue.md#nombres-de-los-recursos).

El `plan` actual crea 55 recursos y no modifica ni destruye ninguno. Las IP, los endpoints y las contraseñas de las bases salen como outputs; el output sensible `exportar_despliegue` produce las variables que espera `scripts/desplegar.sh`:

```
eval "$(terraform output -raw exportar_despliegue)"
```

## Activar el CD

Configuración del repositorio en GitHub, pestaña Settings. Nada de esto va al código.

**Secrets:** `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN` (solo si la cuenta lo exige), `SSH_PRIVATE_KEY` (contenido del `.pem`), `LIBROS_DB_PASSWORD`, `VENTAS_DB_PASSWORD`.

**Variables:** `AWS_DEPLOY_ENABLED=true`, `AWS_REGION`, `FRONTEND_IP`, `LIBROS_IP`, `VENTAS_IP` (IP elásticas), `LIBROS_PRIVATE_IP`, `VENTAS_PRIVATE_IP`, `LIBROS_DB_HOST`, `VENTAS_DB_HOST`.

**Environment:** crear `produccion` para poder exigir una aprobación antes de desplegar.

Si la cuenta no deja crear IAM, el flujo ya no lo necesita: usa claves de acceso y un token de ECR temporal que `desplegar.sh` genera.

## Orden sugerido

1. `terraform apply -target=aws_ecr_repository.servicio -target=aws_ecr_lifecycle_policy.servicio` para crear solo los repositorios.
2. `scripts/construir-y-subir.sh` y comprobar las 4 imágenes en ECR.
3. `terraform apply` para crear red, seguridad, máquinas, bases y balanceador.
4. `eval "$(terraform output -raw exportar_despliegue)"` y `scripts/desplegar.sh`.
5. Probar `http://<balanceador_dns>/health` y `/api/libros`, y correr `scripts/verificar.sh`.
6. Activar el CD.
7. Al terminar la calificación: `terraform destroy` y revisar en la consola que no queden instancias, IP elásticas, balanceadores ni bases.

## Servicios

Libros, Ventas, frontend y gateway ya tienen Dockerfile y compilan. Cada base usa usuario y nombre igual al del servicio (`libros`, `ventas`), que es lo que esperan los roles de Ansible, y Ventas se conecta a Libros con `LIBROS_URL`.
