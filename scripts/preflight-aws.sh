#!/usr/bin/env bash
# Revisa, solo con lecturas, que la cuenta de AWS y la máquina estén listas para la práctica.
# No crea ni modifica nada. Uso: scripts/preflight-aws.sh
cd "$(dirname "$0")/.."

REGION="${AWS_REGION:-us-east-2}"
fallos=0
ok()   { printf '  [ OK ] %s\n' "$1"; }
aviso() { printf '  [AVISO] %s\n' "$1"; }
falla() { printf '  [FALLA] %s\n' "$1"; fallos=$((fallos + 1)); }

echo "Herramientas"
for herramienta in aws docker terraform ansible-playbook git; do
  if command -v "$herramienta" >/dev/null; then ok "$herramienta"; else falla "$herramienta no está instalado"; fi
done
docker info >/dev/null 2>&1 && ok "el demonio de Docker responde" || falla "Docker no responde (¿está corriendo?)"

echo "Cuenta de AWS (región ${REGION})"
if identidad="$(aws sts get-caller-identity --output text --query '[Account,Arn]' 2>&1)"; then
  ok "identidad: ${identidad}"
else
  falla "aws sts get-caller-identity falló: ${identidad}"
  echo; echo "Sin credenciales válidas no se puede revisar lo demás."; exit 1
fi

echo "Permisos y límites"
if aws ec2 describe-availability-zones --region "$REGION" --query 'AvailabilityZones[].ZoneName' --output text >/dev/null 2>&1; then
  ok "EC2: lectura permitida"
else
  falla "EC2: sin permiso de lectura"
fi
if aws ecr describe-repositories --region "$REGION" >/dev/null 2>&1; then ok "ECR: lectura permitida"; else falla "ECR: sin permiso"; fi
if aws rds describe-db-instances --region "$REGION" >/dev/null 2>&1; then ok "RDS: lectura permitida"; else falla "RDS: sin permiso"; fi
if aws elbv2 describe-load-balancers --region "$REGION" >/dev/null 2>&1; then ok "ELB: lectura permitida"; else falla "ELB: sin permiso"; fi

if aws iam list-roles --max-items 1 >/dev/null 2>&1; then
  ok "IAM: se pueden listar roles"
else
  aviso "IAM sin acceso (cuenta educativa): Ansible usará un token temporal para ECR, que ya está previsto"
fi

usadas="$(aws ec2 describe-addresses --region "$REGION" --query 'length(Addresses)' --output text 2>/dev/null || echo '?')"
cuota="$(aws service-quotas get-service-quota --region "$REGION" --service-code ec2 --quota-code L-0263D0A3 --query 'Quota.Value' --output text 2>/dev/null || echo '?')"
echo "  IP elásticas en uso: ${usadas}; cuota: ${cuota} (se necesitan 3)"

vpcs="$(aws ec2 describe-vpcs --region "$REGION" --query 'length(Vpcs)' --output text 2>/dev/null || echo '?')"
echo "  VPC existentes: ${vpcs} (el límite por defecto es 5; se crea 1)"

claves="$(aws ec2 describe-key-pairs --region "$REGION" --query 'KeyPairs[].KeyName' --output text 2>/dev/null || true)"
if [ -n "$claves" ]; then ok "pares de claves EC2: ${claves}"; else aviso "no hay un par de claves EC2; crear uno para el acceso SSH"; fi

echo
[ "$fallos" -eq 0 ] && echo "Listo para empezar." || echo "${fallos} cosa(s) por resolver antes de empezar."
exit "$fallos"
