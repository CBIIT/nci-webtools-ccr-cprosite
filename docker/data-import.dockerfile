FROM public.ecr.aws/amazonlinux/amazonlinux:2023

RUN dnf -y -q install awscli curl ca-certificates \
    && dnf clean all

CMD ["sh", "-c", "set -e; DB=/deploy/database/cprosite.db; mkdir -p /deploy/database; echo Downloading database...; case \"$DATABASE_URL\" in s3://*) aws s3 cp \"$DATABASE_URL\" \"$DB\";; *) curl -fL -o \"$DB\" \"$DATABASE_URL\";; esac; if [ ! -s \"$DB\" ]; then echo ERROR: downloaded file is empty; exit 1; fi; echo Import complete. Size: $(du -sh \"$DB\" | cut -f1)"]