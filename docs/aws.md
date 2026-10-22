# AWS: preparación, CI/CD y orden de trabajo

## Qué hay listo

| Pieza | Dónde | Estado |
|---|---|---|
| CI (Libros, frontend, imágenes, Terraform, Ansible) | `.github/workflows/ci.yml` | Funcionando; el frontend ya compila |
| CD (subir a ECR y desplegar con Ansible) | `.github/workflows/cd.yml` | Apagado hasta `AWS_DEPLOY_ENABLED=true` |
| Terraform: proveedor, variables, ECR, outputs | `terraform/` | Validado. Falta red, cómputo, RDS y balanceador |
| Ansible: Docker, ECR, esquemas de BD, contenedores | `ansible/` | Validado con `--syntax-check`; sin probar contra una EC2 real |
| Build y push a ECR | `scripts/construir-y-subir.sh` | Sin probar contra ECR |
| Despliegue | `scripts/desplegar.sh` | Sin probar contra EC2 |
| Revisión de cuenta y herramientas | `scripts/preflight-aws.sh` | Solo lecturas |

## Cuenta compartida: región y recursos ajenos

La cuenta de AWS la comparte alguien más. En `us-east-1` ya hay una infraestructura que **no es nuestra** (`libreria-ayd-*`: VPC, 3 EC2, 2 RDS, balanceador y las claves `Practica2_AYD2` y `Claves_Proyecto_AYD2`) y que tiene ocupadas las 5 IP elásticas de esa región. No se toca ni se borra.

Nuestro despliegue va en **`us-east-2` (Ohio)**, que estaba vacía, con nombres `ayd-libreria-*` y la etiqueta `proyecto = ayd-libreria`. Las IP elásticas y los pares de claves son por región, así que no chocan con lo anterior.

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

## Lo que falta en Terraform

`network.tf` (VPC, 2 subredes públicas y 2 privadas, internet gateway, rutas), `security.tf` (grupos según la tabla), `compute.tf` (3 EC2 con IP elástica; AMI desde el parámetro SSM de Amazon Linux 2023), `database.tf` (2 RDS PostgreSQL 16 en subredes privadas con `random_password`), `alb.tf` (balanceador en el 80, target group hacia la EC2 del gateway con chequeo `/health`), y outputs de IPs y endpoints. Los outputs alimentan las variables del despliegue de abajo.

## Activar el CD

Configuración del repositorio en GitHub, pestaña Settings. Nada de esto va al código.

**Secrets:** `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN` (solo si la cuenta lo exige), `SSH_PRIVATE_KEY` (contenido del `.pem`), `LIBROS_DB_PASSWORD`, `VENTAS_DB_PASSWORD`.

**Variables:** `AWS_DEPLOY_ENABLED=true`, `AWS_REGION`, `FRONTEND_IP`, `LIBROS_IP`, `VENTAS_IP` (IP elásticas), `LIBROS_PRIVATE_IP`, `VENTAS_PRIVATE_IP`, `LIBROS_DB_HOST`, `VENTAS_DB_HOST`.

**Environment:** crear `produccion` para poder exigir una aprobación antes de desplegar.

Si la cuenta no deja crear IAM, el flujo ya no lo necesita: usa claves de acceso y un token de ECR temporal que `desplegar.sh` genera.

## Orden sugerido

1. `terraform init && terraform apply` con solo ECR (ya funciona) y comprobar que se crean los 4 repositorios.
2. `scripts/construir-y-subir.sh libros gateway` y verlos en ECR.
3. Escribir y aplicar red, seguridad, cómputo, RDS y balanceador.
4. Exportar las variables del despliegue desde los outputs y correr `scripts/desplegar.sh`.
5. Probar `http://<dns-del-balanceador>/health` y `/api/libros`.
6. Activar el CD.
7. Al terminar la calificación: `terraform destroy` y revisar en la consola que no queden instancias, IP elásticas, balanceadores ni bases.

## Servicios

Libros, Ventas, frontend y gateway ya tienen Dockerfile y compilan. Cada base usa usuario y nombre igual al del servicio (`libros`, `ventas`), que es lo que esperan los roles de Ansible, y Ventas se conecta a Libros con `LIBROS_URL`.
