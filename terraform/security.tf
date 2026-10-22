resource "aws_security_group" "alb" {
  name        = "${var.proyecto}-alb"
  description = "Balanceador: HTTP desde internet"
  vpc_id      = aws_vpc.main.id

  tags = { Name = "${var.proyecto}-alb" }
}

resource "aws_security_group" "gateway" {
  name        = "${var.proyecto}-gateway"
  description = "VM del gateway y el frontend"
  vpc_id      = aws_vpc.main.id

  tags = { Name = "${var.proyecto}-gateway" }
}

resource "aws_security_group" "libros" {
  name        = "${var.proyecto}-libros"
  description = "VM del servicio de Libros"
  vpc_id      = aws_vpc.main.id

  tags = { Name = "${var.proyecto}-libros" }
}

resource "aws_security_group" "ventas" {
  name        = "${var.proyecto}-ventas"
  description = "VM del servicio de Ventas"
  vpc_id      = aws_vpc.main.id

  tags = { Name = "${var.proyecto}-ventas" }
}

resource "aws_security_group" "db_libros" {
  name        = "${var.proyecto}-db-libros"
  description = "Base de datos de Libros"
  vpc_id      = aws_vpc.main.id

  tags = { Name = "${var.proyecto}-db-libros" }
}

resource "aws_security_group" "db_ventas" {
  name        = "${var.proyecto}-db-ventas"
  description = "Base de datos de Ventas"
  vpc_id      = aws_vpc.main.id

  tags = { Name = "${var.proyecto}-db-ventas" }
}

# Balanceador: el puerto 80 desde internet.
resource "aws_vpc_security_group_ingress_rule" "alb_http" {
  security_group_id = aws_security_group.alb.id
  description       = "HTTP desde internet"
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
  cidr_ipv4         = "0.0.0.0/0"
}

# Gateway: el 80 solo desde el balanceador.
resource "aws_vpc_security_group_ingress_rule" "gateway_http" {
  security_group_id            = aws_security_group.gateway.id
  description                  = "HTTP desde el balanceador"
  ip_protocol                  = "tcp"
  from_port                    = 80
  to_port                      = 80
  referenced_security_group_id = aws_security_group.alb.id
}

# Libros: el 8081 desde el gateway y desde Ventas.
resource "aws_vpc_security_group_ingress_rule" "libros_desde_gateway" {
  security_group_id            = aws_security_group.libros.id
  description                  = "Libros desde el gateway"
  ip_protocol                  = "tcp"
  from_port                    = 8081
  to_port                      = 8081
  referenced_security_group_id = aws_security_group.gateway.id
}

resource "aws_vpc_security_group_ingress_rule" "libros_desde_ventas" {
  security_group_id            = aws_security_group.libros.id
  description                  = "Libros desde Ventas"
  ip_protocol                  = "tcp"
  from_port                    = 8081
  to_port                      = 8081
  referenced_security_group_id = aws_security_group.ventas.id
}

# Ventas: el 8082 solo desde el gateway.
resource "aws_vpc_security_group_ingress_rule" "ventas_desde_gateway" {
  security_group_id            = aws_security_group.ventas.id
  description                  = "Ventas desde el gateway"
  ip_protocol                  = "tcp"
  from_port                    = 8082
  to_port                      = 8082
  referenced_security_group_id = aws_security_group.gateway.id
}

# Bases: el 5432 solo desde la VM de su servicio.
resource "aws_vpc_security_group_ingress_rule" "db_libros_desde_libros" {
  security_group_id            = aws_security_group.db_libros.id
  description                  = "PostgreSQL desde la VM de Libros"
  ip_protocol                  = "tcp"
  from_port                    = 5432
  to_port                      = 5432
  referenced_security_group_id = aws_security_group.libros.id
}

resource "aws_vpc_security_group_ingress_rule" "db_ventas_desde_ventas" {
  security_group_id            = aws_security_group.db_ventas.id
  description                  = "PostgreSQL desde la VM de Ventas"
  ip_protocol                  = "tcp"
  from_port                    = 5432
  to_port                      = 5432
  referenced_security_group_id = aws_security_group.ventas.id
}

# SSH solo desde la IP de quien despliega.
resource "aws_vpc_security_group_ingress_rule" "ssh" {
  for_each = {
    gateway = aws_security_group.gateway.id
    libros  = aws_security_group.libros.id
    ventas  = aws_security_group.ventas.id
  }

  security_group_id = each.value
  description       = "SSH desde la IP del equipo"
  ip_protocol       = "tcp"
  from_port         = 22
  to_port           = 22
  cidr_ipv4         = var.admin_cidr
}

# Salida libre para las VM y el balanceador (ECR, paquetes del sistema, health checks).
resource "aws_vpc_security_group_egress_rule" "salida" {
  for_each = {
    alb     = aws_security_group.alb.id
    gateway = aws_security_group.gateway.id
    libros  = aws_security_group.libros.id
    ventas  = aws_security_group.ventas.id
  }

  security_group_id = each.value
  description       = "Todo el trafico de salida"
  ip_protocol       = "-1"
  cidr_ipv4         = "0.0.0.0/0"
}
