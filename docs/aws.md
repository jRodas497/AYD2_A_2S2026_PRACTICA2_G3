# Despliegue en AWS

Cómo se despliega la Librería AYD en AWS, qué crea Terraform y cómo se activa el CD. El diagrama está en [diagrama-despliegue.md](diagrama-despliegue.md).

## Despliegue actual

La aplicación se desplegó el 22 de octubre de 2026 en `us-east-2` y responde en:

`http://ayd-libreria-alb-2091800383.us-east-2.elb.amazonaws.com`

`scripts/verificar.sh` pasa completo contra esa dirección: página, catálogo (15 libros), búsquedas, ranking, ventas con sus errores (404, 400 y 409) y la comprobación de que Libros, Ventas y las bases no responden desde internet. El balanceador marca el gateway como `healthy`.

La verificación registra la venta de un ejemplar del libro 1, así que sus existencias y el ranking ya no coinciden con los datos iniciales.

## Región y cuenta compartida

La cuenta de AWS es compartida. En `us-east-1` hay otra infraestructura que no es de este proyecto: la VPC `libreria-ayd-vpc`, 3 EC2, 2 RDS, el balanceador `libreria-ayd-alb`, la EC2 `Proyecto_Fase3_SgoLogic` y las claves `Practica2_AYD2` y `Claves_Proyecto_AYD2`. Esos recursos ocupan las 5 IP elásticas de la región y no se deben modificar ni borrar.

Por eso este proyecto va en `us-east-2` (Ohio), que estaba vacía. Las IP elásticas y los pares de claves son por región, así que no hay choque. Todos nuestros recursos llevan la etiqueta `proyecto = ayd-libreria`, que pone el `default_tags` del proveedor, y eso permite borrarlos con `terraform destroy` sin tocar lo demás.

- La región es la variable `region` de `terraform/variables.tf`, con `us-east-2` por defecto. Los scripts y el CD usan la misma.
- En la consola de AWS hay que elegir Ohio (us-east-2) para ver nuestros recursos.
- Los recursos ajenos empiezan con `libreria-ayd-` y los nuestros con `ayd-libreria-`.
- Antes de borrar algo a mano en la consola, revisar la región y la etiqueta `proyecto`.

## Requisitos

1. Correr `scripts/preflight-aws.sh`. Solo hace lecturas: revisa herramientas, identidad (`aws sts get-caller-identity`), permisos de lectura, IAM, IP elásticas y claves SSH.
2. Instalar `terraform` y `ansible`, con la colección `community.docker`.
3. Crear un par de claves EC2 y guardar el `.pem` en `~/.ssh/ayd.pem` con permisos `600`.
4. Copiar `terraform/terraform.tfvars.example` a `terraform/terraform.tfvars` y completar `admin_cidr` y `key_name`.

## Qué crea Terraform

Terraform crea 55 recursos repartidos así:

| Archivo | Recursos |
|---|---|
| `network.tf` | VPC, 2 subredes públicas y 2 privadas en dos zonas, internet gateway y rutas |
| `security.tf` | Grupos de seguridad con las reglas de [diagrama-despliegue.md](diagrama-despliegue.md#seguridad-de-red) |
| `compute.tf` | 3 EC2 `t3.small` con Amazon Linux 2023 x86_64 (AMI tomada del parámetro SSM, usuario `ec2-user`) y una IP elástica para cada una |
| `database.tf` | 2 RDS PostgreSQL 16 en subredes privadas, con contraseñas de `random_password` |
| `alb.tf` | Balanceador en el puerto 80 hacia la EC2 del gateway, con chequeo en `/health` |
| `ecr.tf` | Repositorios `ayd-libreria/libros`, `ayd-libreria/ventas`, `ayd-libreria/frontend` y `ayd-libreria/gateway` |

Las imágenes se suben con dos etiquetas: el hash del commit y `latest`.

Las IP, los endpoints y las contraseñas de las bases salen como outputs. El output sensible `exportar_despliegue` genera las variables que necesita `scripts/desplegar.sh`:

```bash
eval "$(terraform output -raw exportar_despliegue)"
```

## Nombres de los recursos

En la consola, la etiqueta `Name` sigue el patrón `ayd-libreria-<componente>`. Todo el código de Terraform está en un solo módulo, así que los archivos se refieren unos a otros por el nombre del recurso y no por outputs.

| Recurso | Nombre en Terraform | Nombre en AWS | Archivo |
|---|---|---|---|
| VPC | `aws_vpc.main` | `ayd-libreria-vpc` | `network.tf` |
| Subredes públicas (2, una por zona) | `aws_subnet.publica[0]`, `[1]` | `ayd-libreria-publica-a`, `-b` | `network.tf` |
| Subredes privadas (2, una por zona) | `aws_subnet.privada[0]`, `[1]` | `ayd-libreria-privada-a`, `-b` | `network.tf` |
| Grupo de seguridad del balanceador | `aws_security_group.alb` | `ayd-libreria-alb` | `security.tf` |
| Grupo de seguridad del gateway y el frontend | `aws_security_group.gateway` | `ayd-libreria-gateway` | `security.tf` |
| Grupo de seguridad de Libros | `aws_security_group.libros` | `ayd-libreria-libros` | `security.tf` |
| Grupo de seguridad de Ventas | `aws_security_group.ventas` | `ayd-libreria-ventas` | `security.tf` |
| Grupo de seguridad de la base de Libros | `aws_security_group.db_libros` | `ayd-libreria-db-libros` | `security.tf` |
| Grupo de seguridad de la base de Ventas | `aws_security_group.db_ventas` | `ayd-libreria-db-ventas` | `security.tf` |
| EC2 del gateway y el frontend | `aws_instance.frontend` | `ayd-libreria-frontend` | `compute.tf` |
| EC2 de Libros | `aws_instance.libros` | `ayd-libreria-libros` | `compute.tf` |
| EC2 de Ventas | `aws_instance.ventas` | `ayd-libreria-ventas` | `compute.tf` |
| IP elásticas | `aws_eip.frontend`, `.libros`, `.ventas` | `ayd-libreria-<componente>-eip` | `compute.tf` |
| Base de Libros | `aws_db_instance.libros` | `ayd-libreria-libros-db` | `database.tf` |
| Base de Ventas | `aws_db_instance.ventas` | `ayd-libreria-ventas-db` | `database.tf` |
| Balanceador de carga | `aws_lb.main` | `ayd-libreria-alb` | `alb.tf` |
| Grupo de destino del balanceador | `aws_lb_target_group.gateway` | `ayd-libreria-gateway` | `alb.tf` |
| Repositorios de imágenes | `aws_ecr_repository.servicio["<servicio>"]` | `ayd-libreria/<servicio>` | `ecr.tf` |
| Par de claves SSH | creado con la CLI de AWS | `ayd-libreria` | fuera de Terraform |

Cada base usa como usuario y como nombre el del servicio (`libros` o `ventas`), que es lo que esperan los roles de Ansible. Las contraseñas se generan sin caracteres especiales porque RDS rechaza `/`, `@`, `"` y espacios.

## Pasos

1. `terraform apply -target=aws_ecr_repository.servicio -target=aws_ecr_lifecycle_policy.servicio` para crear solo los repositorios.
2. `scripts/construir-y-subir.sh` y revisar que las 4 imágenes estén en ECR.
3. `terraform apply` para crear la red, la seguridad, las máquinas, las bases y el balanceador.
4. `eval "$(terraform output -raw exportar_despliegue)"` y luego `scripts/desplegar.sh`.
5. Probar `http://<balanceador_dns>/health` y `/api/libros`, y correr `scripts/verificar.sh`.
6. Activar el CD.
7. Después de la calificación: `terraform destroy` y revisar en la consola que no queden instancias, IP elásticas, balanceadores ni bases.

## CI y CD

El CI (`.github/workflows/ci.yml`) compila y prueba Libros, Ventas y el frontend, construye las imágenes y valida Terraform y Ansible.

El CD (`.github/workflows/cd.yml`) sube las imágenes a ECR y despliega con Ansible. No corre mientras la variable `AWS_DEPLOY_ENABLED` no sea `true`. Para activarlo, en Settings del repositorio en GitHub:

- Secrets: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN` (solo si la cuenta lo exige), `SSH_PRIVATE_KEY` (contenido del `.pem`), `LIBROS_DB_PASSWORD` y `VENTAS_DB_PASSWORD`.
- Variables: `AWS_DEPLOY_ENABLED=true`, `AWS_REGION`, `FRONTEND_IP`, `LIBROS_IP` y `VENTAS_IP` (IP elásticas), `LIBROS_PRIVATE_IP`, `VENTAS_PRIVATE_IP`, `LIBROS_DB_HOST` y `VENTAS_DB_HOST`.
- Environment: crear `produccion`, que permite pedir una aprobación antes de cada despliegue.

El despliegue no necesita permisos de IAM: usa las claves de acceso y un token temporal de ECR que genera `desplegar.sh`.
