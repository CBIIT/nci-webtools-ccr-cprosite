FROM public.ecr.aws/amazonlinux/amazonlinux:2023

RUN dnf -y update \
   && dnf -y install \
   gcc-c++ \
   make \
   nodejs24 \
   && dnf clean all

RUN npm install -g npm@latest
RUN npm update -g

# restrict python3.9 to root user
RUN chmod 700 /usr/bin/python3.9 

RUN mkdir -p /deploy/server /deploy/logs

WORKDIR /deploy/server

# use build cache for npm packages
COPY server/package*.json /deploy/server/

RUN npm install

# strip prebuilt contrast-service binaries for platforms that never run in this linux/x64 container,
# so their bundled Go stdlib CVEs (net/http, crypto/tls, grpc, etc.) aren't scanned/shipped
RUN find /deploy/server/node_modules/@contrast/agent/bin -type f \
   ! -name 'contrast-service-linux-x64' ! -name 'VERSION' -delete

# copy the rest of the application
COPY . /deploy/

CMD npm start
