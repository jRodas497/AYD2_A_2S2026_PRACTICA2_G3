data "aws_caller_identity" "actual" {}

output "cuenta" {
  description = "Cuenta de AWS con la que se está desplegando"
  value       = data.aws_caller_identity.actual.account_id
}

output "ecr_repositorios" {
  description = "URL de cada repositorio de ECR"
  value       = { for nombre, repo in aws_ecr_repository.servicio : nombre => repo.repository_url }
}
