# Version Management Guide

This application uses automated version management that works for both local development and CI/CD builds.

## How It Works

### Local Development
- **Version Format**: `{package.version}-{git-short-sha}[-dirty]`
- **Example**: `0.0.0-1aa0fb10-dirty`
- **Environment**: `local`
- **Dirty Flag**: Shows `*` and `-dirty` suffix when you have uncommitted changes

### CI/CD Builds (GitHub Actions)
- **Version Format**: `{package.version}-{git-short-sha}`
- **Example**: `1.2.3-a1b2c3d4`
- **Environment**: Based on `AZURE_ENV_NAME` (dev/staging/prod)
- **Clean Build**: No dirty indicators in CI

## Usage

### Quick Commands
```bash
# Check current version info
npm run check-version

# Start development server (auto-generates version)
npm start

# Build for production (auto-generates version)
npm run build:prod

# Local Docker build and test
npm run docker:build
npm run docker:run

# Interactive build script (Windows)
npm run local:build
```

### Manual Version Generation
```bash
# Generate version info only
npm run set-version
```

## Version Display

The version appears in the top-right corner of the application with:

### Visual Indicators
- **Version Number**: Shows semantic version + git commit
- **Environment Badge**: Color-coded environment indicator
  - 🟢 **Production**: Green badge
  - 🟡 **Staging**: Yellow badge  
  - 🔵 **Development**: Blue badge
  - ⚫ **Local**: Gray badge
- **Dirty Indicator**: Pulsing `*` when uncommitted changes exist
- **Tooltip**: Hover for detailed build information

### Example Displays
```
Local Development (Clean):
v0.0.0-1aa0fb10
    [local]

Local Development (Dirty):
v0.0.0-1aa0fb10-dirty
    [local*]

CI/CD Development:
v1.2.3-a1b2c3d4
    [dev]

Production:
v1.2.3-a1b2c3d4
    [prod]
```

## Files Generated

- `src/assets/runtime-config.json`: Contains complete version and build information
- Console output during build showing version summary

## Troubleshooting

### Git Not Available
If git is not available, the script falls back to:
- SHA: `unknown`
- Branch: `unknown`
- No dirty detection

### Local vs CI Detection
The script automatically detects the environment:
- **Local**: No `CI` or `GITHUB_ACTIONS` environment variables
- **CI**: Presence of CI environment variables

### Version Not Updating
Make sure to run builds through npm scripts that call `set-version`:
- Use `npm start` instead of `ng serve`
- Use `npm run build` instead of `ng build`
- Docker builds automatically generate version info

### Debugging
Check the generated version file:
```bash
cat src/assets/runtime-config.json
```

The file contains all version information including:
- Semantic version from package.json
- Git commit SHA and branch
- Build timestamp
- Environment detection
- Dirty status (local only)