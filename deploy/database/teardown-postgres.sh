#!/usr/bin/env bash
set -euo pipefail

STACK_NAME="lfa2-data-stack"

echo "Deleting deployment stack '$STACK_NAME' and all managed resources..."

az stack sub delete \
  --name "$STACK_NAME" \
  --action-on-unmanage deleteAll \
  --yes
