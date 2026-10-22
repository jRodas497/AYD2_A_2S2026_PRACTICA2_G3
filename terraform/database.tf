resource "aws_db_subnet_group" "main" {
  name       = "${var.proyecto}-db"
  subnet_ids = aws_subnet.privada[*].id

  tags = { Name = "${var.proyecto}-db" }
}

# Sin caracteres especiales: RDS rechaza "/", "@", comillas y espacios en la contraseña.
resource "random_password" "libros" {
  length  = 24
  special = false
}

resource "random_password" "ventas" {
  length  = 24
  special = false
}

resource "aws_db_instance" "libros" {
  identifier        = "${var.proyecto}-libros-db"
  engine            = "postgres"
  engine_version    = "16"
  instance_class    = var.db_instance_class
  allocated_storage = 20
  storage_type      = "gp3"

  db_name  = "libros"
  username = "libros"
  password = random_password.libros.result

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.db_libros.id]
  publicly_accessible    = false
  multi_az               = false

  # Práctica: se destruye al terminar, sin copias ni protección que lo impidan.
  backup_retention_period = 0
  skip_final_snapshot     = true
  deletion_protection     = false
  apply_immediately       = true

  tags = { Name = "${var.proyecto}-libros-db" }
}

resource "aws_db_instance" "ventas" {
  identifier        = "${var.proyecto}-ventas-db"
  engine            = "postgres"
  engine_version    = "16"
  instance_class    = var.db_instance_class
  allocated_storage = 20
  storage_type      = "gp3"

  db_name  = "ventas"
  username = "ventas"
  password = random_password.ventas.result

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.db_ventas.id]
  publicly_accessible    = false
  multi_az               = false

  backup_retention_period = 0
  skip_final_snapshot     = true
  deletion_protection     = false
  apply_immediately       = true

  tags = { Name = "${var.proyecto}-ventas-db" }
}
