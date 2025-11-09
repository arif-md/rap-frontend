# Frontend Development Script - Quick Reference

## Overview
The `dev.ps1` PowerShell script provides comprehensive automation for RAP frontend development tasks including building, testing, Docker operations, and container management.

## Prerequisites
- **Node.js**: v18+ (currently using v22.21.1)
- **npm**: v10+ (currently using v10.9.4)
- **Docker**: For building and running containerized frontend
- **Git**: For version tracking and metadata

## Quick Start

### First Time Setup
```powershell
cd frontend
.\dev.ps1 Setup
```
This will:
- Check Node.js installation
- Install all npm dependencies
- Prepare the development environment

### Start Development Server
```powershell
.\dev.ps1 Serve
```
Opens Angular dev server at http://localhost:4200 with live reload.

## Command Categories

### Setup & Installation

| Command | Description |
|---------|-------------|
| `Setup` | Initial project setup - installs all dependencies |
| `Install` | Install/reinstall npm dependencies |
| `Update` | Update all npm dependencies to latest versions |

### Development & Building

| Command | Description |
|---------|-------------|
| `Serve` | Start Angular dev server on port 4200 |
| `Serve-Port 3000` | Start dev server on custom port (e.g., 3000) |
| `Build` | Build for development (outputs to `dist/`) |
| `Build-Prod` | Build for production with optimizations |
| `Test` | Run unit tests with Karma |
| `Test-Coverage` | Run tests with code coverage report |
| `Lint` | Lint TypeScript/HTML files |
| `Format` | Format code with Prettier |

**Examples:**
```powershell
# Start dev server on port 3000
.\dev.ps1 Serve-Port 3000

# Production build
.\dev.ps1 Build-Prod
```

### Version Management

| Command | Description |
|---------|-------------|
| `Version-Set` | Generate version metadata from Git (creates runtime-config.json) |
| `Version-Check` | Display current version info |

Version info includes:
- Git commit SHA
- Git branch
- Build timestamp
- Dirty state (uncommitted changes)

### Docker Operations

| Command | Description |
|---------|-------------|
| `Docker-Build` | Build Docker image tagged as `frontend-local` |
| `Docker-Build-Tag dev` | Build with custom tag (e.g., `frontend-local:dev`) |
| `Docker-Run` | Run container on port 8080 with default config |
| `Docker-Run-Env <api> <port>` | Run with custom API URL and port |
| `Docker-Stop` | Stop running container |

**Examples:**
```powershell
# Build and run locally
.\dev.ps1 Docker-Build
.\dev.ps1 Docker-Run

# Run with backend at localhost:8080
.\dev.ps1 Docker-Run-Env http://localhost:8080 8080

# Run on port 3000 with remote backend
.\dev.ps1 Docker-Run-Env https://api.example.com 3000
```

### Container Management (rap-frontend)

These commands work with the `rap-frontend` container from docker-compose:

| Command | Description |
|---------|-------------|
| `Container-Update-Config [url]` | Update runtime-config.json in running container |
| `Container-View-Config` | Display current runtime configuration |

**Examples:**
```powershell
# Update API URL to localhost backend
.\dev.ps1 Container-Update-Config http://localhost:8080

# View current config
.\dev.ps1 Container-View-Config
```

**Use Cases:**
- Fix missing API URL in ACR-pulled images
- Switch between local and Azure backends without rebuilding
- Debug configuration issues

### Cleanup

| Command | Description |
|---------|-------------|
| `Clean` | Remove dist/, .angular/cache/, coverage/ |
| `Clean-All` | Clean + remove node_modules/ (requires confirmation) |

### Analysis & Maintenance

| Command | Description |
|---------|-------------|
| `Analyze-Bundle` | Open bundle size analyzer (requires source-map-explorer) |
| `Dependencies-Check` | List outdated npm packages |
| `Dependencies-Audit` | Security vulnerability scan |
| `Dependencies-Fix` | Auto-fix security issues |
| `Info` | Show project info (versions, Git, Docker images) |

**Examples:**
```powershell
# Check for outdated packages
.\dev.ps1 Dependencies-Check

# Security audit and fix
.\dev.ps1 Dependencies-Audit
.\dev.ps1 Dependencies-Fix
```

## Common Workflows

### Local Development with Backend
```powershell
# Terminal 1: Start backend (from backend/)
cd ..\backend
.\dev.ps1 Dev-Full

# Terminal 2: Start frontend dev server
cd ..\frontend
.\dev.ps1 Serve

# Open browser: http://localhost:4200
```

### Fix API URL in Running Container
If the frontend container from ACR doesn't have the API URL:
```powershell
.\dev.ps1 Container-Update-Config http://localhost:8080
.\dev.ps1 Container-View-Config  # Verify
```

### Build Local Docker Image
```powershell
# Build with version metadata
.\dev.ps1 Docker-Build

# Test locally
.\dev.ps1 Docker-Run

# Verify: http://localhost:8080
```

### Production Build & Deployment
```powershell
# Build production artifacts
.\dev.ps1 Build-Prod

# Check bundle size
.\dev.ps1 Analyze-Bundle

# Build production Docker image
.\dev.ps1 Docker-Build-Tag prod

# Outputs to dist/frontend/browser/
```

### Pre-commit Checks
```powershell
# Format code
.\dev.ps1 Format

# Lint
.\dev.ps1 Lint

# Test with coverage
.\dev.ps1 Test-Coverage

# Check outdated dependencies
.\dev.ps1 Dependencies-Check
```

### Clean Build
```powershell
# Remove build artifacts
.\dev.ps1 Clean

# Fresh start (removes node_modules)
.\dev.ps1 Clean-All
.\dev.ps1 Install
```

## Environment Variables

The Docker container accepts these environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `API_BASE_URL` | `http://localhost:8080` | Backend API base URL |
| `AZURE_ENV_NAME` | `local` | Environment name (local/dev/test/prod) |
| `APP_VERSION` | `0.0.1-SNAPSHOT` | Application version override |

**Set via docker-compose.yml:**
```yaml
services:
  frontend:
    environment:
      - API_BASE_URL=http://localhost:8080
      - AZURE_ENV_NAME=local
```

**Set via Docker run:**
```powershell
docker run -p 8080:80 `
  -e API_BASE_URL=http://localhost:8080 `
  -e AZURE_ENV_NAME=dev `
  frontend-local
```

## Troubleshooting

### "Node.js is not installed"
Install Node.js v18+ from https://nodejs.org/

### "Dependencies not installed"
```powershell
.\dev.ps1 Install
```

### "Container 'rap-frontend' is not running"
Start the full stack:
```powershell
cd ..\backend
.\dev.ps1 Dev-Full
```

### Build errors after dependency updates
```powershell
.\dev.ps1 Clean
.\dev.ps1 Install
.\dev.ps1 Build
```

### Port 4200 already in use
```powershell
# Use different port
.\dev.ps1 Serve-Port 3000
```

### Runtime config missing in container
```powershell
# Manually inject config
.\dev.ps1 Container-Update-Config http://localhost:8080
```

## File Locations

- **Build output**: `dist/frontend/browser/`
- **Runtime config**: `src/assets/runtime-config.json` (build-time)
- **Container config**: `/usr/share/nginx/html/assets/runtime-config.json` (runtime)
- **Coverage report**: `coverage/`
- **Node modules**: `node_modules/`
- **Cache**: `.angular/cache/`

## Related Scripts

- **Backend dev script**: `../backend/dev.ps1`
- **npm scripts**: See `package.json` scripts section
- **Version generation**: `scripts/set-version.js`
- **Runtime config merge**: `scripts/merge-runtime-config.js`
- **Docker build**: `scripts/docker-build-local.js`

## Tips

1. **Use tab completion**: Type `.\dev.ps1 ` and press Tab to cycle through commands

2. **Check help anytime**: `.\dev.ps1 Help`

3. **View project info**: `.\dev.ps1 Info` shows versions, Git status, Docker images

4. **Container vs Local**: 
   - `Serve` = local dev server (hot reload)
   - `Docker-Run` = containerized (production-like)

5. **API URL precedence**:
   - Container: runtime-config.json (editable with `Container-Update-Config`)
   - Build: Baked into compiled JavaScript

6. **Before committing**:
   ```powershell
   .\dev.ps1 Format
   .\dev.ps1 Lint
   .\dev.ps1 Test
   ```

## Getting Help

```powershell
# Show all commands
.\dev.ps1 Help

# Show project information
.\dev.ps1 Info

# Check Node.js and npm versions
node --version
npm --version

# View package.json scripts
Get-Content package.json | ConvertFrom-Json | Select-Object -ExpandProperty scripts
```
