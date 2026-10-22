data "aws_caller_identity" "actual" {}

output "cuenta" {
  description = "Cuenta de AWS con la que se está desplegando"
  value       = data.aws_caller_identity.actual.account_id
}

output "ecr_repositorios" {
  description = "URL de cada repositorio de ECR"
  value       = { for nombre, repo in aws_ecr_repository.servicio : nombre => repo.repository_url }
}

output "balanceador_dns" {
  description = "Dirección pública de la aplicación (puerto 80)"
  value       = aws_lb.main.dns_name
}

output "ips_publicas" {
  description = "IP elásticas de las máquinas"
  value = {
    frontend = aws_eip.frontend.public_ip
    libros   = aws_eip.libros.public_ip
    ventas   = aws_eip.ventas.public_ip
  }
}

output "ips_privadas" {
  description = "IP privadas de las máquinas, las que usan el gateway y Ventas"
  value = {
    frontend = aws_instance.frontend.private_ip
    libros   = aws_instance.libros.private_ip
    ventas   = aws_instance.ventas.private_ip
  }
}

output "bases_endpoint" {
  description = "Host de cada base de datos"
  value = {
    libros = aws_db_instance.libros.address
    ventas = aws_db_instance.ventas.address
  }
}

# Variables que espera scripts/desplegar.sh. Uso: eval "$(terraform output -raw exportar_despliegue)"
# Es sensible porque incluye las contraseñas de las bases; no se imprime ni se guarda en archivos.
output "exportar_despliegue" {
  description = "Comandos export con las variables de scripts/desplegar.sh"
  sensitive   = true
  value = join("\n", [
    "export AWS_REGION='${var.region}'",
    "export FRONTEND_IP='${aws_eip.frontend.public_ip}'",
    "export LIBROS_IP='${aws_eip.libros.public_ip}'",
    "export VENTAS_IP='${aws_eip.ventas.public_ip}'",
    "export LIBROS_PRIVATE_IP='${aws_instance.libros.private_ip}'",
    "export VENTAS_PRIVATE_IP='${aws_instance.ventas.private_ip}'",
    "export LIBROS_DB_HOST='${aws_db_instance.libros.address}'",
    "export VENTAS_DB_HOST='${aws_db_instance.ventas.address}'",
    "export LIBROS_DB_PASSWORD='${random_password.libros.result}'",
    "export VENTAS_DB_PASSWORD='${random_password.ventas.result}'",
  ])
}
