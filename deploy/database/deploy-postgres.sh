#!/usr/bin/env bash
set -euo pipefail

LOCATION="westus3"
STACK_NAME="lfa2-data-stack"
TEMPLATE_FILE="$(dirname "$0")/postgres.bicep"

# Prompt for password if not set
if [[ -z "${PG_ADMIN_PASSWORD:-}" ]]; then
  read -rsp "Enter PostgreSQL admin password: " PG_ADMIN_PASSWORD
  echo
fi

az stack sub create \
  --name "$STACK_NAME" \
  --location "$LOCATION" \
  --template-file "$TEMPLATE_FILE" \
  --parameters \
    location="$LOCATION" \
    administratorLogin=adotfrank \
    administratorPassword="$PG_ADMIN_PASSWORD" \
  --action-on-unmanage detachAll \
  --deny-settings-mode none
