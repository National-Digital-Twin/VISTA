FROM nginx:1.27.4
USER root

RUN ["rm", "/etc/nginx/conf.d/default.conf"]

USER nginx

COPY proxy.conf.template /etc/nginx/templates/proxy.conf.template
COPY settings.conf.template /etc/nginx/templates/settings.conf.template
