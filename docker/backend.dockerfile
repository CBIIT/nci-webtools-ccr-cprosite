FROM quay.io/centos/centos:stream9

# gcc-c++ needs to be installed first so that postinstall scripts can be properly executed before installing other packages
RUN dnf -y update \
 && dnf -y install \
    gcc-c++ \ 
 && dnf -y install \
    make \
    nodejs \
    python3 \
 && dnf clean all

RUN mkdir -p /deploy/server /deploy/logs

WORKDIR /deploy/server

# use build cache for npm packages
COPY server/package*.json /deploy/server/

RUN npm install

# copy the rest of the application
COPY . /deploy/

CMD npm start
