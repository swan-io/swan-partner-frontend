#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status.

# Check for required environment variables
if [ "$#" -ne 3 ]; then
    echo "❌ Error: Invalid number of arguments."
    echo "Usage: $0 <APP_NAME> <VERSION> <FARO_APP_ID>"
    exit 1
fi

# Params:
# $1 - APP_NAME (e.g., "identity")
# $2 - VERSION from package.json version field or sha hash for master builds
# $3 - Faro App ID
APP_NAME=$1
VERSION=$2
FARO_APP_ID=$3

REQUIRED_ENV_VARS=("FARO_SOURCEMAP_ENDPOINT" "FARO_API_KEY" "FARO_STACK_ID")

MISSING_VARS=0
for VAR in "${REQUIRED_ENV_VARS[@]}"; do
  # Check if the environment variable is set
  if [ -z "${!VAR}" ]; then
    echo "❌ Error: The environment variable '$VAR' is not set."
    MISSING_VARS=1
  fi
done

if [ "$MISSING_VARS" -eq 1 ]; then
  echo "🚫 Stopping script because some secrets are missing."
  exit 1
fi

BUNDLE_ID=$APP_NAME-$VERSION
TARGET_DIR="server/dist/static/$APP_NAME/assets"

echo "🚀 Injecting bundle ID: $BUNDLE_ID"
pnpx @grafana/faro-cli@0.7.1 inject-bundle-id \
  --bundle-id "$BUNDLE_ID" \
  --app-name "$APP_NAME" \
  --files "$TARGET_DIR/**/*.js" \
  --verbose

echo "📤 Uploading sourcemaps for bundle ID: $BUNDLE_ID"
pnpx @grafana/faro-cli@0.7.1 upload \
  --endpoint "$FARO_SOURCEMAP_ENDPOINT" \
  --app-id "$FARO_APP_ID" \
  --api-key "$FARO_API_KEY" \
  --stack-id "$FARO_STACK_ID" \
  --bundle-id "$BUNDLE_ID" \
  --output-path "$TARGET_DIR" \
  --gzip-contents \
  --gzip-payload \
  --recursive \
  --verbose
