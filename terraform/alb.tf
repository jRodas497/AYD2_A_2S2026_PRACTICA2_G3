resource "aws_lb" "main" {
  name               = "${var.proyecto}-alb"
  load_balancer_type = "application"
  internal           = false
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.publica[*].id

  tags = { Name = "${var.proyecto}-alb" }
}

# El balanceador solo habla con el gateway, que sirve el frontend y reenvía las APIs.
resource "aws_lb_target_group" "gateway" {
  name                 = "${var.proyecto}-gateway"
  port                 = 80
  protocol             = "HTTP"
  vpc_id               = aws_vpc.main.id
  target_type          = "instance"
  deregistration_delay = 30

  health_check {
    path                = "/health"
    matcher             = "200"
    interval            = 15
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }

  tags = { Name = "${var.proyecto}-gateway" }
}

resource "aws_lb_target_group_attachment" "frontend" {
  target_group_arn = aws_lb_target_group.gateway.arn
  target_id        = aws_instance.frontend.id
  port             = 80
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.gateway.arn
  }
}
