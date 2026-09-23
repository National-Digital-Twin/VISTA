#!/bin/bash
# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the UK's Department for Business, Innovation, Science and Trade (BIST) as the governing entity.

echo "Setup user permissions to run migrate."
# Ensure the necessary environment variables are set
if [[ -z "$DB_HOSTNAME" || -z "$POSTGRES_PASSWORD" ]]; then
  echo "Error: DB_HOSTNAME and POSTGRES_PASSWORD environment variables must be set." >&2
  exit 1
fi

# Run the query
echo "Running the query..."
PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$DB_HOSTNAME" -U vista -c "GRANT rds_iam TO vista;" >> /dev/null 2>&1

if [[ $? -eq 0 ]]; then
  echo "Query executed successfully."
else
  echo "Failed to execute the query." >&2
fi


echo "Run migrate"
# Run db migration
/venv/bin/python3 /vista-python-api/src/manage.py migrate
