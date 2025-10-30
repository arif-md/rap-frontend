# Version Management Guide

This application uses a **two-stage version management system** that integrates with the existing runtime configuration architecture:

1. **Build-time**: Generate detailed version info from Git and package.json
2. **Runtime**: Merge build-time info with environment variables via `docker-entrypoint.sh`

## Architecture Integration

### Existing Pattern (Preserved)
```
docker-entrypoint.sh → runtime-config.json → app-config.service.ts → Angular App
```

### Enhanced Pattern (New)
```
Build: set-version.js → runtime-config.json (build-time)
                           ↓
Runtime: docker-entrypoint.sh → merge-runtime-config.js → runtime-config.json (final)
                           ↓
Angular: app-config.service.ts → header.component.ts → Version Display
```

## How It Works

### Build-Time Generation
- **Script**: `scripts/set-version.js`
- **Triggers**: npm scripts (`start`, `build`, `docker:build`)
- **Output**: `src/assets/runtime-config.json` with detailed version info

### Runtime Merging  
- **Script**: `docker-entrypoint.sh` → `scripts/merge-runtime-config.js`
- **Input**: Build-time config + Environment variables
- **Output**: Final `runtime-config.json` in container

### Application Loading
- **Service**: `app-config.service.ts` loads final config
- **Display**: `header.component.ts` shows version in UI

## Version Formats

| Environment | Build Version Format | Example |
|-------------|---------------------|---------|
| **Local Clean** | `{version}-{shortSha}` | `0.0.0-3d1a2222` |
| **Local Dirty** | `{version}-{shortSha}-dirty` | `0.0.0-3d1a2222-dirty` |
| **CI/CD** | `{version}-{shortSha}` | `1.2.3-a1b2c3d4` |

## Configuration Merging

The runtime merge preserves all build-time information while allowing runtime environment overrides:

```json
{
  // Build-time info (preserved)
  "version": "0.0.0",
  "gitSha": "3d1a2222b17e554f26a8ec1a39dd9bf99977d618", 
  "gitRef": "main",
  "shortSha": "3d1a2222",
  "isDirty": true,
  "buildDate": "2025-10-29T04:51:39.763Z",
  "buildType": "local",
  "isCI": false,
  
  // Runtime overrides (from environment)
  "appEnv": "production",
  "appEnvName": "Production", 
  "buildVersion": "1.2.3-a1b2c3d4",
  
  // Merge metadata
  "_runtimeGenerated": true,
  "_generatedAt": "2025-10-29T04:53:05.140Z"
}
```

## Usage

### Local Development
```bash
# Development server (auto-generates version)
npm start

# Build with version
npm run build:prod

# Docker build with version 
npm run docker:build

# Check generated version
npm run check-version
```

### Docker Environment Variables
```bash
# Set these in your deployment
AZURE_ENV_NAME=production
APP_VERSION=1.2.3-a1b2c3d4
```

### CI/CD Integration
The GitHub Actions workflow automatically:
1. Generates build-time version info
2. Extracts `buildVersion` for Docker build
3. Passes it as `APP_VERSION` build argument
4. Container runtime merges with environment

## Files and Scripts

### Core Scripts
- `scripts/set-version.js` - Build-time version generation
- `scripts/merge-runtime-config.js` - Runtime configuration merging  
- `scripts/docker-build-local.js` - Local Docker build with version

### Configuration Files
- `src/assets/runtime-config.json` - Build-time version info
- `/usr/share/nginx/html/assets/runtime-config.json` - Final runtime config

### Infrastructure  
- `docker-entrypoint.sh` - Container startup with config merge
- `Dockerfile` - Multi-stage build with Node.js runtime
- `.github/workflows/frontend-image.yaml` - CI/CD with version integration

## Backward Compatibility

✅ **Fully backward compatible** with existing architecture:
- `app-config.service.ts` unchanged (just reads more properties)
- `docker-entrypoint.sh` enhanced (fallback to basic mode if needed)
- Environment variables work exactly as before
- API fallback still supported

## Troubleshooting

### Version Not Updating
```bash
# Ensure build scripts run
npm run set-version

# Check generated config
cat src/assets/runtime-config.json

# For Docker builds
npm run docker:build  # (not just docker build)
```

### Missing Version in Container
```bash
# Check if merge script is available
docker run frontend-local ls -la /usr/share/nginx/html/scripts/

# Check container logs
docker run frontend-local # Look for [merge] or [entrypoint] logs

# Manual test
docker run -e APP_VERSION=test -e AZURE_ENV_NAME=test frontend-local
```

### Environment Detection
The system automatically detects:
- **Local**: No `CI` environment variables
- **CI/CD**: Presence of `GITHUB_ACTIONS` or `CI`
- **Runtime**: Container execution with environment variables

This ensures consistent version display across all deployment scenarios while maintaining the existing runtime configuration pattern! 🎯