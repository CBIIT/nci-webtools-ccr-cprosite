FROM public.ecr.aws/amazonlinux/amazonlinux:2023 AS build

RUN dnf -y update \
   && dnf -y install \
   gcc-c++ \
   make \
   nodejs24 \
   nodejs24-npm \
   && dnf clean all

RUN npm install -g npm@latest

RUN mkdir /client

WORKDIR /client

COPY client/package*.json /client/

RUN npm install

COPY client /client/

RUN npm run build

# Final image only ships the static build output and httpd, not Node.js/npm or node_modules
FROM public.ecr.aws/amazonlinux/amazonlinux:2023

RUN dnf -y update \
   && dnf -y install \
   httpd \
   && dnf clean all

COPY --from=build /client/build/ /var/www/html/

WORKDIR /var/www/html

# Add custom httpd configuration
COPY docker/httpd-cprosite.conf /etc/httpd/conf.d/httpd-cprosite.conf

EXPOSE 80
EXPOSE 443

CMD rm -rf /run/httpd/* /tmp/httpd* \
   && exec /usr/sbin/httpd -DFOREGROUND