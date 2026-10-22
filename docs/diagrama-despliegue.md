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
