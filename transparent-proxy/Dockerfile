FROM nginxinc/nginx-unprivileged:1.29.5-alpine3.23

USER root
RUN apk update && apk upgrade --no-cache
USER 101

RUN ["rm", "/etc/nginx/conf.d/default.conf"]

COPY proxy.conf.template /etc/nginx/templates/proxy.conf.template
COPY settings.conf.template /etc/nginx/templates/settings.conf.template
