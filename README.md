# Librería AYD: infraestructura como código

Práctica 2 de Análisis y Diseño de Sistemas 2. Es una plataforma web para una librería con catálogo de libros, búsqueda por título o autor, registro de ventas y ranking de los más vendidos. Tiene dos microservicios (Libros y Ventas), una API Gateway y un frontend, y se despliega en AWS con Terraform, Docker y Ansible.

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

El usuario entra por un balanceador de carga que apunta a una máquina con el gateway (nginx) y el frontend. El gateway reenvía `/api/libros` al servicio de Libros y `/api/ventas` al de Ventas. Cada servicio corre en su propia máquina y tiene su propia base PostgreSQL en RDS. Cuando se registra una venta, Ventas le pide a Libros que descuente las existencias.

| Componente | Tecnología | Puerto |
|---|---|---|
| Frontend | React, Vite, Tailwind, servido por nginx | 80 |
| Gateway | nginx | 80 |
| Libros | Spring Boot, Java 21 | 8081 |
| Ventas | Spring Boot, Java 21 | 8082 |
| Bases de datos | PostgreSQL 16 en RDS, una por servicio | 5432 |

Los contratos de las APIs y el modelo de datos están en [docs/arquitectura.md](docs/arquitectura.md), y el diagrama de despliegue en [docs/diagrama-despliegue.md](docs/diagrama-despliegue.md).

## Estructura del repositorio

```text
servicios/
  libros/      microservicio de Libros, con su Dockerfile y db/schema.sql
  ventas/      microservicio de Ventas, con su Dockerfile y db/schema.sql
  gateway/     nginx que enruta por prefijo
  frontend/    aplicación web
terraform/     infraestructura en AWS
ansible/       configuración de las máquinas y despliegue de contenedores
scripts/       construir y subir imágenes, desplegar, revisar la cuenta, verificar
docs/          manual, arquitectura, diagrama y guía de AWS
docker-compose.yml   todo el sistema en local, sin nube
```

## Probar en local

Hace falta Docker. Desde la raíz del repositorio:

```bash
docker compose -p ayd-libreria up -d --build
```

La aplicación queda en <http://localhost:9080>. La API también se puede consultar directamente:

```bash
curl "localhost:9080/api/libros?q=garcia"
curl localhost:9080/api/ventas/ranking
curl -X POST localhost:9080/api/ventas -H 'Content-Type: application/json' -d '{"libroId":1,"cantidad":2}'
```

Los puertos locales son 9080 (gateway), 9081 (Libros), 9082 (Ventas), 5433 y 5434 (bases). Para bajar todo y borrar los datos: `docker compose -p ayd-libreria down -v`.

## Pruebas

| Dónde | Qué prueba | Cómo correrlas |
|---|---|---|
| `servicios/libros` y `servicios/ventas` | Servicios con Mockito, controladores con MockMvc (códigos 201, 400, 404 y 409, y validaciones) y, en Ventas, el cliente HTTP contra un servidor de Libros simulado | `mvn verify` dentro de cada carpeta (JDK 21) |
| `servicios/frontend` | Componentes y pantallas con Vitest y Testing Library, y las utilidades de formato y errores | `npm test` (Node 22) |
| Toda la plataforma | Flujo completo contra el sistema en marcha | `scripts/verificar.sh [URL]` |

El CI corre las pruebas de Java y del frontend en cada push. Esas pruebas no usan base de datos, así que la búsqueda de Libros con `unaccent`, que depende de PostgreSQL, solo se comprueba con `scripts/verificar.sh`.

`scripts/verificar.sh` recibe la URL base: por defecto `http://localhost:9080`, y en la nube el DNS del balanceador. Revisa la página, el listado, las búsquedas, el ranking y una venta que lo cambia. Si se le pasan `LIBROS_IP`, `VENTAS_IP`, `LIBROS_DB_HOST` y `VENTAS_DB_HOST`, comprueba además que los servicios y las bases no respondan desde fuera.

## Despliegue en AWS

Terraform crea la infraestructura, las imágenes se construyen y se suben a ECR, y Ansible configura las máquinas y levanta los contenedores. Los pasos, las variables y la activación del CD están en [docs/aws.md](docs/aws.md).

Las contraseñas de las bases no están en el repositorio. Terraform las genera y Ansible las recibe como variables de entorno. Después de la calificación se borra todo con `terraform destroy`.

## Documentación

- [Manual de usuario](docs/manual-usuario.md)
- [Arquitectura, contratos de las APIs y modelo de datos](docs/arquitectura.md)
- [Diagrama de despliegue](docs/diagrama-despliegue.md)
- [Despliegue en AWS, CI y CD](docs/aws.md)
- [Código tomado de la Fase 3](docs/base-fase3.md)

## Código reutilizado

Parte del frontend y de la estructura de contenedores viene de la Fase 3 de nuestro grupo (proyecto SGO-Logic, commit `469470c`): la configuración de Vite, TypeScript, Tailwind y oxlint, algunos componentes de interfaz, el manejo de errores HTTP, la plantilla de nginx y los Dockerfile en dos etapas. En [docs/base-fase3.md](docs/base-fase3.md) está qué se tomó y cómo se adaptó. Los servicios de Libros y Ventas, el catálogo, el ranking y la infraestructura se escribieron para esta práctica.

Herramientas y librerías externas: Spring Boot, PostgreSQL, React, Vite, Tailwind CSS, nginx, Docker, Terraform y Ansible.

## Convenciones de git

Cada tema va en una rama `feature/<carnet>-<tema>` que sale de `develop`. Los commits llevan el formato `<carnet>: mensaje` y los cambios entran a `develop` por pull request.
