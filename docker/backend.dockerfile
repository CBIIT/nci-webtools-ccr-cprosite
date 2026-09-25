FROM public.ecr.aws/amazonlinux/amazonlinux:2023

RUN dnf -y update \
   && dnf -y install \
   gcc-c++ \
   make \
   nodejs24 \
   && dnf clean all

# pinned (not @latest): CI builds cache-from the previous published image, so a floating
# "latest" tag here never actually re-resolves once this line's text stops changing between
# builds - bump this version whenever npm's own bundled deps (tar, ip-address, etc.) get CVEs
RUN npm install -g npm@12.1.0

# restrict python3.9 to root user
RUN chmod 700 /usr/bin/python3.9 

RUN mkdir -p /deploy/server /deploy/logs

WORKDIR /deploy/server

# use build cache for npm packages
COPY server/package*.json /deploy/server/

RUN npm install

# copy the rest of the application
COPY . /deploy/

CMD ["node", "app.js"]
