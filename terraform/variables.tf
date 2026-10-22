variable "region" {
  description = "Región de AWS"
  type        = string
  default     = "us-east-2"
}

variable "proyecto" {
  description = "Prefijo de nombres y valor de la etiqueta proyecto"
  type        = string
  default     = "ayd-libreria"
}

variable "vpc_cidr" {
  description = "Rango de direcciones de la VPC"
  type        = string
  default     = "10.20.0.0/16"
}

variable "servicios" {
  description = "Servicios que se empaquetan como imagen y tienen repositorio en ECR"
  type        = list(string)
  default     = ["libros", "ventas", "frontend", "gateway"]
}

variable "instance_type" {
  description = "Tipo de EC2. Libros usa -Xmx384m y se dimensionó para 2 GB"
  type        = string
  default     = "t3.small"
}

variable "db_instance_class" {
  description = "Clase de las instancias RDS"
  type        = string
  default     = "db.t3.micro"
}

variable "admin_cidr" {
  description = "CIDR desde el que se permite SSH, por ejemplo 203.0.113.7/32"
  type        = string
}

variable "key_name" {
  description = "Par de claves EC2 existente para el acceso SSH"
  type        = string
}
