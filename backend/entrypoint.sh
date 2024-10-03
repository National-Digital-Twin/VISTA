#!/bin/bash
echo "Setup user permissions to run migrate."
# Ensure the necessary environment variables are set
if [[ -z "$DB_HOSTNAME" || -z "$POSTGRES_PASSWORD" ]]; then
  echo "Error: DB_HOSTNAME and POSTGRES_PASSWORD environment variables must be set."
  exit 1
fi

# Install the PostgreSQL client
echo "Installing PostgreSQL client..."
apt-get update
apt-get install -y postgresql-client

# Run the query
echo "Running the query..."
PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$DB_HOSTNAME" -U paralog -c "GRANT rds_iam TO paralog;" >> /dev/null 2>&1

if [[ $? -eq 0 ]]; then
  echo "Query executed successfully."
else
  echo "Failed to execute the query."
fi


echo "Run migrate"
# Run db migration
/venv/bin/python3 /paralog-python-api/core/manage.py migrate
