FROM debian:bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        awscli \
        curl \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

CMD ["sh", "-c", "set -eu\
DB=/deploy/database/cprosite.db\
TMP=${DB}.tmp\
mkdir -p /deploy/database\
: \"${DATABASE_URL:?DATABASE_URL is required}\"\
echo Downloading database from $DATABASE_URL ...\
rm -f \"$TMP\"\
case \"$DATABASE_URL\" in\
    s3://*) aws s3 cp \"$DATABASE_URL\" \"$TMP\" ;;\
    *) curl -fL -o \"$TMP\" \"$DATABASE_URL\" ;;\
esac\
if [ ! -s \"$TMP\" ]; then\
    echo ERROR: downloaded file is empty\
    rm -f \"$TMP\"\
    exit 1\
fi\
mv -f \"$TMP\" \"$DB\"\
echo Import complete. Size: $(du -sh \"$DB\" | cut -f1)"]