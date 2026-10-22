# Librería AYD: infraestructura como código

Práctica 2 de Análisis y Diseño de Sistemas 2. Plataforma web para una librería: catálogo de libros con búsqueda por título o autor, registro de ventas y ranking de los más vendidos. Se divide en dos microservicios (Libros y Ventas), una API Gateway y un frontend, desplegados en AWS con Terraform, Docker y Ansible.

## Integrantes

Grupo 3, sección A.

| Carnet | Nombre |
|---|---|
| 202001132 | Carmen Maria Marroquin Llamas |
| 202109114 | Sebastian Alejandro Vasquez Cartagena |
| 199919737 | Williams Bramlley Constanza Oscal |
| 9516085 | Hernan Ricardo Avila Castillo |
| 202200389 | Juan Jose Rodas Mansilla |

## Arquitectura

El usuario entra por un balanceador de carga que llega a una máquina con el gateway (nginx) y el frontend. El gateway reenvía `/api/libros` al servicio de Libros y `/api/ventas` al de Ventas, cada uno en su propia máquina y con su propia base PostgreSQL en RDS. Al registrar una venta, Ventas pide a Libros descontar las existencias.

| Componente | Tecnología | Puerto |
|---|---|---|
| Frontend | React, Vite, Tailwind, servido por nginx | 80 |
| Gateway | nginx | 80 |
| Libros | Spring Boot, Java 21 | 8081 |
| Ventas | Spring Boot, Java 21 | 8082 |
| Bases de datos | PostgreSQL 16 en RDS, una por servicio | 5432 |

El diagrama de despliegue está en [docs/diagrama-despliegue.md](docs/diagrama-despliegue.md).

## Estructura del repositorio

```text
servicios/
  libros/      microservicio de Libros, con su Dockerfile y db/schema.sql
  ventas/      microservicio de Ventas, con su Dockerfile y db/schema.sql
  gateway/     nginx que enruta por prefijo
  frontend/    aplicación web
terraform/     infraestructura en AWS
ansible/       configuración de las máquinas y despliegue de contenedores
scripts/       construir y subir imágenes, desplegar, revisar la cuenta
docs/          manual, diagrama y guía de AWS
docker-compose.yml   todo el sistema en local, sin nube
```

## Probar en local

Se necesita Docker. Desde la raíz del repositorio:

```bash
docker compose -p ayd-libreria up -d --build
```

La aplicación queda en <http://localhost:9080>. También se puede consultar la API:

```bash
curl "localhost:9080/api/libros?q=garcia"
curl localhost:9080/api/ventas/ranking
curl -X POST localhost:9080/api/ventas -H 'Content-Type: application/json' -d '{"libroId":1,"cantidad":2}'
```

Los puertos de prueba son 9080 (gateway), 9081 (Libros), 9082 (Ventas), 5433 y 5434 (bases). Para bajar todo y borrar los datos: `docker compose -p ayd-libreria down -v`.

## Despliegue en AWS

Terraform crea la infraestructura, las imágenes se construyen y se suben a ECR, y Ansible configura las máquinas y levanta los contenedores. El orden, las variables y la activación del CD están en [docs/aws.md](docs/aws.md).

Las contraseñas de las bases no se guardan en el repositorio: Terraform las genera y llegan a Ansible como variables de entorno. Después de la calificación se destruye todo con `terraform destroy`.

## Documentación

- [Manual de usuario](docs/manual-usuario.md)
- [Diagrama de despliegue](docs/diagrama-despliegue.md)
- [Guía de AWS, CI y CD](docs/aws.md)
- [Reparto del trabajo](docs/reparto.md)
- [Código tomado de la Fase 3](docs/base-fase3.md)

## Código reutilizado

Una parte del frontend y de la estructura de contenedores viene de la **base de la Fase 3 de nuestro grupo** (proyecto SGO-Logic, commit `469470c`): la configuración de Vite, TypeScript, Tailwind y oxlint, los componentes de interfaz, el manejo de errores HTTP, la plantilla de nginx y la forma de los Dockerfile en dos etapas. El detalle de qué se tomó y qué se adaptó está en [docs/base-fase3.md](docs/base-fase3.md). Los servicios de Libros y Ventas, el catálogo, el ranking y toda la infraestructura son nuevos de esta práctica.

Se usan además estas herramientas y librerías externas: Spring Boot, PostgreSQL, React, Vite, Tailwind CSS, nginx, Docker, Terraform y Ansible.

## Convenciones de git

Cada tema va en una rama `feature/<carnet>-<tema>` que sale de `develop`. Los commits llevan el formato `<carnet>: mensaje` y los cambios entran a `develop` por pull request.
