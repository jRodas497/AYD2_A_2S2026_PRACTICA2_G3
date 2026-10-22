data "aws_availability_zones" "disponibles" {
  state = "available"
}

locals {
  zonas = slice(data.aws_availability_zones.disponibles.names, 0, 2)
}

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = { Name = "${var.proyecto}-vpc" }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = { Name = "${var.proyecto}-igw" }
}

resource "aws_subnet" "publica" {
  count = 2

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = local.zonas[count.index]
  map_public_ip_on_launch = true

  tags = { Name = "${var.proyecto}-publica-${substr(local.zonas[count.index], -1, 1)}" }
}

resource "aws_subnet" "privada" {
  count = 2

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = local.zonas[count.index]

  tags = { Name = "${var.proyecto}-privada-${substr(local.zonas[count.index], -1, 1)}" }
}

resource "aws_route_table" "publica" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = { Name = "${var.proyecto}-rt-publica" }
}

resource "aws_route_table_association" "publica" {
  count = 2

  subnet_id      = aws_subnet.publica[count.index].id
  route_table_id = aws_route_table.publica.id
}

# Sin ruta a internet: las bases solo se alcanzan desde dentro de la VPC.
resource "aws_route_table" "privada" {
  vpc_id = aws_vpc.main.id

  tags = { Name = "${var.proyecto}-rt-privada" }
}

resource "aws_route_table_association" "privada" {
  count = 2

  subnet_id      = aws_subnet.privada[count.index].id
  route_table_id = aws_route_table.privada.id
}
