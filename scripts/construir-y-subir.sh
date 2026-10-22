#!/usr/bin/env bash
# Construye las imágenes (linux/amd64, la arquitectura de las EC2) y las sube a ECR.
# Uso: scripts/construir-y-subir.sh [servicio ...]   (por defecto: libros ventas frontend gateway)
set -euo pipefail
cd "$(dirname "$0")/.."

REGION="${AWS_REGION:-us-east-2}"
PREFIJO="${ECR_PREFIX:-ayd-libreria}"
ETIQUETA="${IMAGE_TAG:-$(git rev-parse --short HEAD)}"
SERVICIOS=("$@")
[ ${#SERVICIOS[@]} -gt 0 ] || SERVICIOS=(libros ventas frontend gateway)

CUENTA="$(aws sts get-caller-identity --query Account --output text)"
REGISTRO="${CUENTA}.dkr.ecr.${REGION}.amazonaws.com"

aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$REGISTRO"

for servicio in "${SERVICIOS[@]}"; do
  if [ ! -f "servicios/${servicio}/Dockerfile" ]; then
    echo "-- ${servicio}: sin Dockerfile, se omite"
    continue
  fi
  imagen="${REGISTRO}/${PREFIJO}/${servicio}"
  echo "== ${servicio} -> ${imagen}:${ETIQUETA}"
  docker build --platform linux/amd64 -t "${imagen}:${ETIQUETA}" -t "${imagen}:latest" "servicios/${servicio}"
  docker push "${imagen}:${ETIQUETA}"
  docker push "${imagen}:latest"
done
