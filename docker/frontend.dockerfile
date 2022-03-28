FROM quay.io/centos/centos:stream9

RUN dnf -y update --allowerasing --nobest \
 && dnf -y install \
    gcc-c++ \
    httpd \
    make \
    nodejs \
 && dnf clean all

RUN mkdir /client

WORKDIR /client

COPY client/package*.json /client/

RUN npm install

COPY client /client/

RUN npm run build \
 && cp -r /client/build/* /var/www/html

WORKDIR /var/www/html

# Add custom httpd configuration
COPY docker/httpd-cprosite.conf /etc/httpd/conf.d/httpd-cprosite.conf

EXPOSE 80
EXPOSE 443

CMD rm -rf /run/httpd/* /tmp/httpd* \
 && exec /usr/sbin/apachectl -DFOREGROUND