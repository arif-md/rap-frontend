#!/bin/sh
set -e

echo "[entrypoint] Starting nginx with runtime configuration generation"

# Runtime configuration path
RUNTIME_JSON_PATH="/usr/share/nginx/html/assets/runtime-config.json"

# Check if Node.js and merge script are available
if command -v node >/dev/null 2>&1 && [ -f "/usr/share/nginx/html/scripts/merge-runtime-config.js" ]; then
    echo "[entrypoint] Using Node.js script to merge runtime configuration"
    node /usr/share/nginx/html/scripts/merge-runtime-config.js "$RUNTIME_JSON_PATH"
else
    echo "[entrypoint] Node.js or merge script not available, using basic configuration"
    
    # Fallback: Create basic runtime config
    mkdir -p "$(dirname "$RUNTIME_JSON_PATH")"
    
    cat > "$RUNTIME_JSON_PATH" <<EOF
{
  "appEnv": "${AZURE_ENV_NAME:-local}",
  "appEnvName": "${AZURE_ENV_NAME:-Local}",
  "buildVersion": "${APP_VERSION:-0.0.1-SNAPSHOT}",
  "apiBaseUrl": "${API_BASE_URL:-http://localhost:8080}",
  "_runtimeGenerated": true,
  "_generatedAt": "$(date -Iseconds)",
  "_fallbackMode": true
}
EOF
    
    echo "[entrypoint] Created basic runtime config at $RUNTIME_JSON_PATH"
    echo "[entrypoint] Environment: '${AZURE_ENV_NAME:-local}', Version: '${APP_VERSION:-0.0.1-SNAPSHOT}'"
fi

# Show final config for debugging
if [ -f "$RUNTIME_JSON_PATH" ]; then
    echo "[entrypoint] Final runtime configuration:"
    cat "$RUNTIME_JSON_PATH"
else
    echo "[entrypoint] Warning: No runtime configuration file was created!"
fi

echo "[entrypoint] Starting nginx..."
exec nginx -g 'daemon off;'
