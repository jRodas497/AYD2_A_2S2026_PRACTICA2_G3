resource "aws_ecr_repository" "servicio" {
  for_each = toset(var.servicios)

  name                 = "${var.proyecto}/${each.key}"
  image_tag_mutability = "MUTABLE"
  # Permite destruir el repositorio con imágenes dentro al terminar la práctica.
  force_delete = true

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_lifecycle_policy" "servicio" {
  for_each   = aws_ecr_repository.servicio
  repository = each.value.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Conservar solo las 10 imágenes más recientes"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 10
      }
      action = { type = "expire" }
    }]
  })
}
