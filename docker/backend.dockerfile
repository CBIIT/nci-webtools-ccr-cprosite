# ---- build stage: compiles native modules (better-sqlite3) and installs production deps ----
FROM public.ecr.aws/amazonlinux/amazonlinux:2023 AS build

RUN dnf -y update \
   && dnf -y install \
   gcc-c++ \
   make \
   nodejs24 \
   nodejs24-npm \
   && dnf clean all

WORKDIR /deploy/server

COPY server/package*.json /deploy/server/

RUN npm ci --omit=dev

# ---- runtime stage: Node.js only; no gcc/make/kernel headers, no npm and its bundled deps ----
FROM public.ecr.aws/amazonlinux/amazonlinux:2023

# install_weak_deps=False keeps dnf from pulling nodejs24-npm (a weak dependency); the runtime
# does not need npm, and npm's bundled node_modules are a recurring source of scan findings
RUN dnf -y update \
   && dnf -y install --setopt=install_weak_deps=False \
   nodejs24 \
   && dnf clean all

RUN chmod 700 /usr/bin/python3.9

RUN mkdir -p /deploy/server /deploy/logs /deploy/database

WORKDIR /deploy/server

COPY --from=build /deploy/server/node_modules /deploy/server/node_modules
COPY server/ /deploy/server/

CMD ["node", "app.js"]
