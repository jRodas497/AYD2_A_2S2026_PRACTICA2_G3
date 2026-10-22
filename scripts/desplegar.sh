#!/usr/bin/env bash
# Despliega con Ansible. Lo usan el CD (.github/workflows/cd.yml) y la corrida manual.
# Variables obligatorias: FRONTEND_IP LIBROS_IP VENTAS_IP LIBROS_PRIVATE_IP VENTAS_PRIVATE_IP
#                         LIBROS_DB_HOST VENTAS_DB_HOST LIBROS_DB_PASSWORD VENTAS_DB_PASSWORD
# Opcionales: SSH_KEY_FILE (por defecto ~/.ssh/ayd.pem), AWS_REGION, ECR_PREFIX, IMAGE_TAG
set -euo pipefail
cd "$(dirname "$0")/../ansible"

for variable in FRONTEND_IP LIBROS_IP VENTAS_IP LIBROS_PRIVATE_IP VENTAS_PRIVATE_IP \
                LIBROS_DB_HOST VENTAS_DB_HOST LIBROS_DB_PASSWORD VENTAS_DB_PASSWORD; do
  [ -n "${!variable:-}" ] || { echo "Falta la variable ${variable}" >&2; exit 1; }
done

REGION="${AWS_REGION:-us-east-2}"
CUENTA="$(aws sts get-caller-identity --query Account --output text)"
export ECR_REGISTRY="${CUENTA}.dkr.ecr.${REGION}.amazonaws.com"
export ECR_TOKEN="$(aws ecr get-login-password --region "$REGION")"

# Ansible no expande "~" en esta variable del inventario.
LLAVE="${SSH_KEY_FILE:-$HOME/.ssh/ayd.pem}"
LLAVE="${LLAVE/#\~/$HOME}"

cat > inventario.ini <<EOF
[frontend]
vm-frontend ansible_host=${FRONTEND_IP}

[libros]
vm-libros ansible_host=${LIBROS_IP}

[ventas]
vm-ventas ansible_host=${VENTAS_IP}

[all:vars]
ansible_user=ec2-user
ansible_ssh_private_key_file=${LLAVE}
EOF

ansible-galaxy collection install -r requirements.yml
ansible-playbook site.yml
