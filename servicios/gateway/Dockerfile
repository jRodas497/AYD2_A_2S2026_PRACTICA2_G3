FROM nginx:1.27-alpine
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
# Hace que el entrypoint exporte NGINX_LOCAL_RESOLVERS, que usa la plantilla en resolver.
ENV NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1 \
    PORT=80
EXPOSE 80
