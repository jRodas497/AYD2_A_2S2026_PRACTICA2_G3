# Diagrama de despliegue

Muestra cómo queda desplegada la Librería AYD en AWS y cómo intervienen Terraform y Ansible.

![Diagrama de despliegue](diagramas/despliegue-p2.svg)

El archivo editable está en [diagramas/despliegue-p2.drawio](diagramas/despliegue-p2.drawio) y se abre en draw.io.

## Componentes

Todo vive en una VPC en `us-east-2`, dividida en subredes públicas y privadas repartidas en dos zonas de disponibilidad.

- **Application Load Balancer:** recibe el tráfico de internet por el puerto 80 y lo envía al gateway. Revisa la salud con `/health`.
- **VM Frontend:** corre dos contenedores en una red de Docker. El gateway (nginx) publica el puerto 80 y el frontend queda interno.
- **VM Libros:** contenedor de Libros (Spring Boot) en el puerto 8081.
- **VM Ventas:** contenedor de Ventas (Spring Boot) en el puerto 8082.
- **Tres IP elásticas**, una por máquina, que no cambian al reiniciar.
- **Dos bases RDS PostgreSQL 16**, una por microservicio, en subredes privadas y sin acceso público.
- **Amazon ECR:** cuatro repositorios (libros, ventas, frontend y gateway) con las imágenes.

## Flujo de una petición

El usuario entra por el balanceador, que llega al gateway. El gateway sirve el frontend y reenvía `/api/libros` a Libros y `/api/ventas` a Ventas. Al registrar una venta, Ventas pide a Libros descontar existencias. Cada servicio habla solo con su propia base, por el puerto 5432.

## Seguridad de red

- El balanceador acepta el puerto 80 desde internet.
- El gateway acepta el 80 solo desde el balanceador.
- Libros acepta el 8081 solo desde el gateway y desde Ventas. Ventas acepta el 8082 solo desde el gateway.
- Cada base acepta el 5432 solo desde la máquina de su servicio.
- SSH (puerto 22) solo desde la IP de quien despliega.

## Aprovisionamiento y despliegue

Las líneas punteadas del diagrama son lo que corre el equipo, no tráfico de la aplicación.

- **Terraform** crea la red, las máquinas, las IP elásticas, el balanceador, las bases y los repositorios de ECR.
- **Docker** construye las imágenes y las sube a ECR.
- **Ansible** entra por SSH a cada máquina, configura el sistema, instala Docker Engine, descarga las imágenes de ECR, aplica el esquema SQL a cada base y levanta los contenedores con sus variables de entorno.

## Región y cuenta compartida

La cuenta de AWS es compartida y en `us-east-1` ya existe una infraestructura que **no pertenece a este proyecto**: VPC `libreria-ayd-vpc`, 3 EC2, 2 RDS, un balanceador `libreria-ayd-alb`, una EC2 `Proyecto_Fase3_SgoLogic` y las claves `Practica2_AYD2` y `Claves_Proyecto_AYD2`. Esos recursos ocupan las 5 IP elásticas de esa región. **No se tocan, no se modifican y no se borran.**

Por eso este proyecto se despliega en **`us-east-2` (Ohio)**, donde no había nada y las 5 IP elásticas estaban libres. Las IP elásticas y los pares de claves son por región, así que no chocan con lo anterior. Todo recurso que creamos lleva la etiqueta `proyecto = ayd-libreria` (la pone el `default_tags` del proveedor), y es lo que permite distinguirlo y borrarlo al final con `terraform destroy` sin afectar lo ajeno.

Para quien documente o despliegue de aquí en adelante:

- La región se define en la variable `region` de `terraform/variables.tf` y es `us-east-2` por defecto. Los scripts y el CD usan la misma.
- Si en la consola de AWS no se ve nuestra infraestructura, hay que cambiar la región arriba a la derecha a **Ohio (us-east-2)**.
- Los nombres de la infraestructura ajena empiezan con `libreria-ayd-`; los nuestros, con `ayd-libreria-`. No confundirlos.
- Antes de borrar algo a mano en la consola, comprobar la etiqueta `proyecto` y la región.

## Nombres de los recursos

Los nombres que se ven en la consola (etiqueta `Name`) siguen el patrón `ayd-libreria-<componente>`. En Terraform, el código vive en un solo módulo, así que los archivos se refieren entre sí por el nombre del recurso y no por outputs.

| Recurso | Nombre en Terraform | Nombre en AWS | Archivo | Responsable |
|---|---|---|---|---|
| VPC | `aws_vpc.main` | `ayd-libreria-vpc` | `network.tf` | Williams |
| Subredes públicas (2, una por zona) | `aws_subnet.publica[0]`, `[1]` | `ayd-libreria-publica-a`, `-b` | `network.tf` | Williams |
| Subredes privadas (2, una por zona) | `aws_subnet.privada[0]`, `[1]` | `ayd-libreria-privada-a`, `-b` | `network.tf` | Williams |
| Balanceador, grupo de seguridad | `aws_security_group.alb` | `ayd-libreria-alb` | `security.tf` | Williams |
| Gateway y frontend, grupo de seguridad | `aws_security_group.gateway` | `ayd-libreria-gateway` | `security.tf` | Williams |
| Libros, grupo de seguridad | `aws_security_group.libros` | `ayd-libreria-libros` | `security.tf` | Williams |
| Ventas, grupo de seguridad | `aws_security_group.ventas` | `ayd-libreria-ventas` | `security.tf` | Williams |
| Base de Libros, grupo de seguridad | `aws_security_group.db_libros` | `ayd-libreria-db-libros` | `security.tf` | Williams |
| Base de Ventas, grupo de seguridad | `aws_security_group.db_ventas` | `ayd-libreria-db-ventas` | `security.tf` | Williams |
| EC2 del gateway y el frontend | `aws_instance.frontend` | `ayd-libreria-frontend` | `compute.tf` | Juan José |
| EC2 de Libros | `aws_instance.libros` | `ayd-libreria-libros` | `compute.tf` | Juan José |
| EC2 de Ventas | `aws_instance.ventas` | `ayd-libreria-ventas` | `compute.tf` | Juan José |
| IP elásticas | `aws_eip.frontend`, `.libros`, `.ventas` | `ayd-libreria-<componente>-eip` | `compute.tf` | Juan José |
| Base de Libros | `aws_db_instance.libros` | `ayd-libreria-libros-db` | `database.tf` | Juan José |
| Base de Ventas | `aws_db_instance.ventas` | `ayd-libreria-ventas-db` | `database.tf` | Juan José |
| Balanceador de carga | `aws_lb.main` | `ayd-libreria-alb` | `alb.tf` | Juan José |
| Grupo de destino del balanceador | `aws_lb_target_group.gateway` | `ayd-libreria-gateway` | `alb.tf` | Juan José |
| Repositorios de imágenes | `aws_ecr_repository.servicio["<servicio>"]` | `ayd-libreria/<servicio>` | `ecr.tf` | ya creado |
| Par de claves SSH | creado con la CLI de AWS | `ayd-libreria` | | ya creado en `us-east-2` |

Las bases usan el usuario y el nombre de base `libros` y `ventas`, que son los que esperan los roles de Ansible. Las contraseñas las genera `random_password` sin caracteres especiales (RDS rechaza `/`, `@`, `"` y espacios) y no se guardan en el repositorio.
