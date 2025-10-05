#!/bin/sh
set -e

# Generate a runtime configuration file for the browser
RUNTIME_JSON_PATH="/usr/share/nginx/html/assets/runtime-config.json"
mkdir -p "$(dirname "$RUNTIME_JSON_PATH")"

cat > "$RUNTIME_JSON_PATH" <<EOF
{
  "appEnv": "${AZURE_ENV_NAME:-local}",
  "appEnvName": "${AZURE_ENV_NAME:-Local}",
  "buildVersion": "${APP_VERSION:-}"
}
EOF

echo "[entrypoint] Wrote runtime config to $RUNTIME_JSON_PATH (appEnv='${AZURE_ENV_NAME:-local}')"

exec nginx -g 'daemon off;'
