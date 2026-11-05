# Same Amazon Linux 2023 base as the backend/frontend images so there is one OS to keep patched
# (the previous debian:bookworm-slim base carried perl/openssl/expat/cryptography findings).
FROM public.ecr.aws/amazonlinux/amazonlinux:2023

RUN dnf -y update \
    && dnf -y install \
    awscli-2 \
    curl-minimal \
    && dnf clean all

# python3-pygments (2.7.4, PRISMA-2023-0033) is only reachable through "aws help" rendering, which
# this image never calls; AL2023 ships no patched build, so drop it. docutils must stay: the CLI
# imports it at startup.
RUN rpm -e --nodeps python3-pygments

RUN chmod 700 /usr/bin/python3.9

CMD ["sh", "-ec", "set -eu; DB=/deploy/database/cprosite.db; TMP=${DB}.tmp; mkdir -p /deploy/database; : \"${DATABASE_URL:?DATABASE_URL is required}\"; echo Downloading database from $DATABASE_URL ...; rm -f \"$TMP\"; case \"$DATABASE_URL\" in s3://*) aws s3 cp \"$DATABASE_URL\" \"$TMP\" ;; *) curl -fL -o \"$TMP\" \"$DATABASE_URL\" ;; esac; if [ ! -s \"$TMP\" ]; then echo ERROR: downloaded file is empty; rm -f \"$TMP\"; exit 1; fi; mv -f \"$TMP\" \"$DB\"; echo Import complete. Size: $(du -sh \"$DB\" | cut -f1)"]
