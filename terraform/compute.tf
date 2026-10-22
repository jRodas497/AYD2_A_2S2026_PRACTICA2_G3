# Amazon Linux 2023 x86_64, la imagen más reciente. El rol de Ansible "docker" usa dnf y ec2-user.
data "aws_ssm_parameter" "ami" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64"
}

resource "aws_instance" "frontend" {
  ami                    = data.aws_ssm_parameter.ami.value
  instance_type          = var.instance_type
  key_name               = var.key_name
  subnet_id              = aws_subnet.publica[0].id
  vpc_security_group_ids = [aws_security_group.gateway.id]

  metadata_options {
    http_tokens = "required"
  }

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  tags = {
    Name      = "${var.proyecto}-frontend"
    Component = "frontend"
  }
}

resource "aws_instance" "libros" {
  ami                    = data.aws_ssm_parameter.ami.value
  instance_type          = var.instance_type
  key_name               = var.key_name
  subnet_id              = aws_subnet.publica[0].id
  vpc_security_group_ids = [aws_security_group.libros.id]

  metadata_options {
    http_tokens = "required"
  }

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  tags = {
    Name      = "${var.proyecto}-libros"
    Component = "libros"
  }
}

resource "aws_instance" "ventas" {
  ami                    = data.aws_ssm_parameter.ami.value
  instance_type          = var.instance_type
  key_name               = var.key_name
  subnet_id              = aws_subnet.publica[1].id
  vpc_security_group_ids = [aws_security_group.ventas.id]

  metadata_options {
    http_tokens = "required"
  }

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  tags = {
    Name      = "${var.proyecto}-ventas"
    Component = "ventas"
  }
}

# IP públicas estáticas: no cambian aunque se reinicien las máquinas.
resource "aws_eip" "frontend" {
  domain   = "vpc"
  instance = aws_instance.frontend.id

  tags       = { Name = "${var.proyecto}-frontend-eip" }
  depends_on = [aws_internet_gateway.main]
}

resource "aws_eip" "libros" {
  domain   = "vpc"
  instance = aws_instance.libros.id

  tags       = { Name = "${var.proyecto}-libros-eip" }
  depends_on = [aws_internet_gateway.main]
}

resource "aws_eip" "ventas" {
  domain   = "vpc"
  instance = aws_instance.ventas.id

  tags       = { Name = "${var.proyecto}-ventas-eip" }
  depends_on = [aws_internet_gateway.main]
}
