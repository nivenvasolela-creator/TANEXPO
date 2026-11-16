#!/bin/sh
# Hosts mount the persistent disk owned by root. The app runs as the unprivileged "node" user,
# so when started as root this hands the data directory to that user and then drops privileges.
set -e

DATA_DIR="${PG_DATA_DIR:-/data/pg}"

if [ "$(id -u)" = "0" ]; then
  mkdir -p "$DATA_DIR"
  # The parent is included because a damaged database is set aside next to the data directory.
  chown -R node:node "$(dirname "$DATA_DIR")"
  exec setpriv --reuid=node --regid=node --init-groups "$@"
fi

exec "$@"
