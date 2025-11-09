# RAP Frontend Development Scripts
# PowerShell automation for local development

# Helper function to check if Node.js is installed
function Check-NodeJS {
    try {
        $null = node --version
        return $true
    } catch {
        Write-Host "✗ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
        return $false
    }
}

# Helper function to check if npm dependencies are installed
function Check-Dependencies {
    if (!(Test-Path node_modules)) {
        Write-Host "✗ Dependencies not installed. Run './dev.ps1 Install' first" -ForegroundColor Yellow
        return $false
    }
    return $true
}

# Setup script - Initialize environment
function Setup {
    Write-Host "Setting up frontend development environment..." -ForegroundColor Cyan
    
    if (!(Check-NodeJS)) {
        return
    }
    
    Write-Host "Installing npm dependencies..." -ForegroundColor Cyan
    npm install
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Frontend environment setup complete!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "  1. Run './dev.ps1 Serve' to start development server"
        Write-Host "  2. Open http://localhost:4200 in your browser"
    } else {
        Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    }
}

# Install dependencies
function Install {
    if (!(Check-NodeJS)) {
        return
    }
    
    Write-Host "Installing npm dependencies..." -ForegroundColor Cyan
    npm install
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Dependencies installed successfully" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    }
}

# Update dependencies
function Update {
    if (!(Check-NodeJS)) {
        return
    }
    
    Write-Host "Updating npm dependencies..." -ForegroundColor Cyan
    npm update
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Dependencies updated successfully" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to update dependencies" -ForegroundColor Red
    }
}

# Start development server
function Serve {
    if (!(Check-NodeJS) -or !(Check-Dependencies)) {
        return
    }
    
    Write-Host "Starting Angular development server..." -ForegroundColor Cyan
    Write-Host "  URL: http://localhost:4200" -ForegroundColor White
    Write-Host ""
    npm start
}

# Start development server with specific port
function Serve-Port {
    param([int]$Port = 4200)
    
    if (!(Check-NodeJS) -or !(Check-Dependencies)) {
        return
    }
    
    Write-Host "Starting Angular development server on port $Port..." -ForegroundColor Cyan
    Write-Host "  URL: http://localhost:$Port" -ForegroundColor White
    Write-Host ""
    npm run set-version
    ng serve --port $Port
}

# Build for development
function Build {
    if (!(Check-NodeJS) -or !(Check-Dependencies)) {
        return
    }
    
    Write-Host "Building frontend (development mode)..." -ForegroundColor Cyan
    npm run build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Build complete! Output is in dist/" -ForegroundColor Green
    } else {
        Write-Host "✗ Build failed" -ForegroundColor Red
    }
}

# Build for production
function Build-Prod {
    if (!(Check-NodeJS) -or !(Check-Dependencies)) {
        return
    }
    
    Write-Host "Building frontend (production mode)..." -ForegroundColor Cyan
    npm run build:prod
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Production build complete! Output is in dist/" -ForegroundColor Green
        
        # Show build size
        if (Test-Path "dist/frontend/browser") {
            $size = (Get-ChildItem -Path "dist/frontend/browser" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
            Write-Host "  Total size: $([math]::Round($size, 2)) MB" -ForegroundColor White
        }
    } else {
        Write-Host "✗ Production build failed" -ForegroundColor Red
    }
}

# Run tests
function Test {
    if (!(Check-NodeJS) -or !(Check-Dependencies)) {
        return
    }
    
    Write-Host "Running tests..." -ForegroundColor Cyan
    npm test
}

# Run tests with coverage
function Test-Coverage {
    if (!(Check-NodeJS) -or !(Check-Dependencies)) {
        return
    }
    
    Write-Host "Running tests with coverage..." -ForegroundColor Cyan
    ng test --code-coverage --watch=false
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Tests completed. Coverage report in coverage/" -ForegroundColor Green
    }
}

# Lint code
function Lint {
    if (!(Check-NodeJS) -or !(Check-Dependencies)) {
        return
    }
    
    Write-Host "Linting code..." -ForegroundColor Cyan
    ng lint
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ No linting errors found" -ForegroundColor Green
    } else {
        Write-Host "✗ Linting errors found" -ForegroundColor Red
    }
}

# Format code with Prettier
function Format {
    if (!(Check-NodeJS) -or !(Check-Dependencies)) {
        return
    }
    
    Write-Host "Formatting code with Prettier..." -ForegroundColor Cyan
    npx prettier --write "src/**/*.{ts,html,scss,css,json}"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Code formatted successfully" -ForegroundColor Green
    } else {
        Write-Host "✗ Formatting failed" -ForegroundColor Red
    }
}

# Generate version info
function Version-Set {
    if (!(Check-NodeJS) -or !(Check-Dependencies)) {
        return
    }
    
    Write-Host "Generating version information..." -ForegroundColor Cyan
    npm run set-version
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Version info generated" -ForegroundColor Green
        
        # Show version info
        if (Test-Path "src/assets/runtime-config.json") {
            Write-Host ""
            Write-Host "Version info:" -ForegroundColor White
            Get-Content "src/assets/runtime-config.json" | ConvertFrom-Json | Format-List
        }
    } else {
        Write-Host "✗ Failed to generate version info" -ForegroundColor Red
    }
}

# Check version info
function Version-Check {
    if (!(Check-NodeJS) -or !(Check-Dependencies)) {
        return
    }
    
    npm run check-version
}

# Build Docker image locally
function Docker-Build {
    if (!(Check-NodeJS) -or !(Check-Dependencies)) {
        return
    }
    
    Write-Host "Building Docker image locally..." -ForegroundColor Cyan
    npm run docker:build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Docker image built: frontend-local" -ForegroundColor Green
    } else {
        Write-Host "✗ Docker image build failed" -ForegroundColor Red
    }
}

# Build Docker image with custom tag
function Docker-Build-Tag {
    param([string]$Tag = "latest")
    
    if (!(Check-NodeJS) -or !(Check-Dependencies)) {
        return
    }
    
    Write-Host "Building Docker image with tag: $Tag..." -ForegroundColor Cyan
    npm run set-version
    
    # Build with custom tag
    docker build -t frontend-local:$Tag .
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Docker image built: frontend-local:$Tag" -ForegroundColor Green
        
        # Show image size
        $imageSize = docker images frontend-local:$Tag --format "{{.Size}}"
        Write-Host "  Image size: $imageSize" -ForegroundColor White
    } else {
        Write-Host "✗ Docker image build failed" -ForegroundColor Red
    }
}

# Run Docker container locally
function Docker-Run {
    Write-Host "Running Docker container..." -ForegroundColor Cyan
    Write-Host "  URL: http://localhost:8080" -ForegroundColor White
    Write-Host "  Press Ctrl+C to stop" -ForegroundColor Yellow
    Write-Host ""
    
    docker run -p 8080:80 --rm --name frontend-local-container `
        -e API_BASE_URL=http://localhost:8080 `
        frontend-local
}

# Run Docker container with custom environment
function Docker-Run-Env {
    param(
        [string]$ApiUrl = "http://localhost:8080",
        [int]$Port = 8080
    )
    
    Write-Host "Running Docker container with custom environment..." -ForegroundColor Cyan
    Write-Host "  URL: http://localhost:$Port" -ForegroundColor White
    Write-Host "  API URL: $ApiUrl" -ForegroundColor White
    Write-Host "  Press Ctrl+C to stop" -ForegroundColor Yellow
    Write-Host ""
    
    docker run -p ${Port}:80 --rm --name frontend-local-container `
        -e API_BASE_URL=$ApiUrl `
        frontend-local
}

# Stop Docker container
function Docker-Stop {
    Write-Host "Stopping Docker container..." -ForegroundColor Cyan
    docker stop frontend-local-container
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Container stopped" -ForegroundColor Green
    }
}

# Clean build artifacts
function Clean {
    Write-Host "Cleaning build artifacts..." -ForegroundColor Cyan
    
    if (Test-Path dist) {
        Remove-Item -Recurse -Force dist
        Write-Host "  ✓ Removed dist/" -ForegroundColor Green
    }
    
    if (Test-Path .angular/cache) {
        Remove-Item -Recurse -Force .angular/cache
        Write-Host "  ✓ Removed .angular/cache/" -ForegroundColor Green
    }
    
    if (Test-Path coverage) {
        Remove-Item -Recurse -Force coverage
        Write-Host "  ✓ Removed coverage/" -ForegroundColor Green
    }
    
    Write-Host "✓ Clean complete" -ForegroundColor Green
}

# Clean everything including node_modules
function Clean-All {
    Write-Host "WARNING: This will delete node_modules and all build artifacts!" -ForegroundColor Red
    $confirmation = Read-Host "Type 'yes' to continue"
    
    if ($confirmation -eq 'yes') {
        Write-Host "Cleaning everything..." -ForegroundColor Cyan
        
        if (Test-Path node_modules) {
            Remove-Item -Recurse -Force node_modules
            Write-Host "  ✓ Removed node_modules/" -ForegroundColor Green
        }
        
        Clean
        
        Write-Host "✓ All clean! Run './dev.ps1 Install' to reinstall dependencies" -ForegroundColor Green
    } else {
        Write-Host "✗ Clean-all cancelled" -ForegroundColor Yellow
    }
}

# Update runtime config in running container
function Container-Update-Config {
    param([string]$ApiUrl = "http://localhost:8080")
    
    Write-Host "Updating runtime-config.json in rap-frontend container..." -ForegroundColor Cyan
    
    # Check if container is running
    $containerRunning = docker ps --filter "name=rap-frontend" --format "{{.Names}}"
    if (!$containerRunning) {
        Write-Host "✗ Container 'rap-frontend' is not running" -ForegroundColor Red
        return
    }
    
    # Get current config
    $currentConfig = docker exec rap-frontend cat /usr/share/nginx/html/assets/runtime-config.json | ConvertFrom-Json
    
    # Update API URL
    $currentConfig | Add-Member -MemberType NoteProperty -Name "apiBaseUrl" -Value $ApiUrl -Force
    $currentConfig._generatedAt = (Get-Date -Format "o")
    
    # Write back to container
    $configJson = $currentConfig | ConvertTo-Json -Depth 10
    $configJson | docker exec -i rap-frontend sh -c 'cat > /usr/share/nginx/html/assets/runtime-config.json'
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Runtime config updated with API URL: $ApiUrl" -ForegroundColor Green
        
        # Verify
        Write-Host ""
        Write-Host "Current config:" -ForegroundColor White
        docker exec rap-frontend cat /usr/share/nginx/html/assets/runtime-config.json
    } else {
        Write-Host "✗ Failed to update config" -ForegroundColor Red
    }
}

# View runtime config from running container
function Container-View-Config {
    Write-Host "Viewing runtime-config.json from rap-frontend container..." -ForegroundColor Cyan
    
    # Check if container is running
    $containerRunning = docker ps --filter "name=rap-frontend" --format "{{.Names}}"
    if (!$containerRunning) {
        Write-Host "✗ Container 'rap-frontend' is not running" -ForegroundColor Red
        return
    }
    
    Write-Host ""
    docker exec rap-frontend cat /usr/share/nginx/html/assets/runtime-config.json
}

# Analyze bundle size
function Analyze-Bundle {
    if (!(Check-NodeJS) -or !(Check-Dependencies)) {
        return
    }
    
    Write-Host "Analyzing bundle size..." -ForegroundColor Cyan
    Write-Host "This will build the app and open source-map-explorer" -ForegroundColor Yellow
    Write-Host ""
    
    # Install source-map-explorer if not present
    if (!(Get-Command source-map-explorer -ErrorAction SilentlyContinue)) {
        Write-Host "Installing source-map-explorer..." -ForegroundColor Cyan
        npm install -g source-map-explorer
    }
    
    # Build with source maps
    ng build --source-map
    
    if ($LASTEXITCODE -eq 0) {
        # Analyze main bundle
        source-map-explorer "dist/frontend/browser/main*.js"
    } else {
        Write-Host "✗ Build failed" -ForegroundColor Red
    }
}

# Check for outdated dependencies
function Dependencies-Check {
    if (!(Check-NodeJS)) {
        return
    }
    
    Write-Host "Checking for outdated dependencies..." -ForegroundColor Cyan
    npm outdated
}

# Audit dependencies for security vulnerabilities
function Dependencies-Audit {
    if (!(Check-NodeJS)) {
        return
    }
    
    Write-Host "Auditing dependencies for security vulnerabilities..." -ForegroundColor Cyan
    npm audit
}

# Fix security vulnerabilities
function Dependencies-Fix {
    if (!(Check-NodeJS)) {
        return
    }
    
    Write-Host "Fixing security vulnerabilities..." -ForegroundColor Cyan
    npm audit fix
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Vulnerabilities fixed" -ForegroundColor Green
    } else {
        Write-Host "⚠ Some vulnerabilities could not be fixed automatically" -ForegroundColor Yellow
        Write-Host "  Run 'npm audit' for details" -ForegroundColor Yellow
    }
}

# Show project info
function Info {
    Write-Host ""
    Write-Host "RAP Frontend - Project Information" -ForegroundColor Cyan
    Write-Host "===================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Node version
    if (Check-NodeJS) {
        $nodeVersion = node --version
        $npmVersion = npm --version
        Write-Host "Node.js: $nodeVersion" -ForegroundColor White
        Write-Host "npm:     $npmVersion" -ForegroundColor White
    }
    
    # Angular version
    if (Check-Dependencies) {
        try {
            $ngVersion = npx ng version 2>&1 | Select-String "Angular CLI:" | ForEach-Object { $_.ToString().Trim() }
            if ($ngVersion) {
                Write-Host "$ngVersion" -ForegroundColor White
            }
        } catch {
            # Angular CLI not available
        }
    }
    
    # Package.json version
    if (Test-Path package.json) {
        $package = Get-Content package.json | ConvertFrom-Json
        Write-Host "App Version: $($package.version)" -ForegroundColor White
    }
    
    # Git info
    try {
        $branch = git rev-parse --abbrev-ref HEAD 2>$null
        $commit = git rev-parse --short HEAD 2>$null
        if ($branch) {
            Write-Host ""
            Write-Host "Git Branch: $branch" -ForegroundColor White
            Write-Host "Git Commit: $commit" -ForegroundColor White
        }
    } catch {
        # Git not available or not in a git repo
    }
    
    # Docker images
    $localImage = docker images frontend-local --format "table {{.Tag}}\t{{.Size}}\t{{.CreatedSince}}" 2>$null
    if ($localImage) {
        Write-Host ""
        Write-Host "Local Docker Images:" -ForegroundColor White
        docker images frontend-local --format "table {{.Tag}}\t{{.Size}}\t{{.CreatedSince}}"
    }
    
    Write-Host ""
}

# Show help
function Show-Help {
    Write-Host ""
    Write-Host "RAP Frontend - Development Commands" -ForegroundColor Cyan
    Write-Host "====================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "USAGE: .\dev.ps1 <Command> [Options]" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Setup Commands:" -ForegroundColor Yellow
    Write-Host "  Setup                    - Initial setup (install dependencies)"
    Write-Host "  Install                  - Install npm dependencies"
    Write-Host "  Update                   - Update npm dependencies"
    Write-Host ""
    
    Write-Host "Development Commands:" -ForegroundColor Yellow
    Write-Host "  Serve                    - Start dev server on port 4200"
    Write-Host "  Serve-Port <port>        - Start dev server on custom port"
    Write-Host "  Build                    - Build for development"
    Write-Host "  Build-Prod               - Build for production"
    Write-Host "  Test                     - Run unit tests"
    Write-Host "  Test-Coverage            - Run tests with coverage"
    Write-Host "  Lint                     - Lint code"
    Write-Host "  Format                   - Format code with Prettier"
    Write-Host ""
    
    Write-Host "Version Commands:" -ForegroundColor Yellow
    Write-Host "  Version-Set              - Generate version info"
    Write-Host "  Version-Check            - Check current version info"
    Write-Host ""
    
    Write-Host "Docker Commands:" -ForegroundColor Yellow
    Write-Host "  Docker-Build             - Build Docker image (frontend-local)"
    Write-Host "  Docker-Build-Tag <tag>   - Build Docker image with custom tag"
    Write-Host "  Docker-Run               - Run Docker container on port 8080"
    Write-Host "  Docker-Run-Env <api> <p> - Run container with custom API URL and port"
    Write-Host "  Docker-Stop              - Stop running Docker container"
    Write-Host ""
    
    Write-Host "Container Management:" -ForegroundColor Yellow
    Write-Host "  Container-Update-Config [url] - Update runtime config in rap-frontend"
    Write-Host "  Container-View-Config         - View runtime config from rap-frontend"
    Write-Host ""
    
    Write-Host "Cleanup Commands:" -ForegroundColor Yellow
    Write-Host "  Clean                    - Remove build artifacts (dist, cache, coverage)"
    Write-Host "  Clean-All                - Clean + remove node_modules"
    Write-Host ""
    
    Write-Host "Analysis & Maintenance:" -ForegroundColor Yellow
    Write-Host "  Analyze-Bundle           - Analyze bundle size with source-map-explorer"
    Write-Host "  Dependencies-Check       - Check for outdated dependencies"
    Write-Host "  Dependencies-Audit       - Audit dependencies for vulnerabilities"
    Write-Host "  Dependencies-Fix         - Fix security vulnerabilities"
    Write-Host "  Info                     - Show project information"
    Write-Host ""
    
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\dev.ps1 Setup"
    Write-Host "  .\dev.ps1 Serve"
    Write-Host "  .\dev.ps1 Serve-Port 3000"
    Write-Host "  .\dev.ps1 Build-Prod"
    Write-Host "  .\dev.ps1 Docker-Build"
    Write-Host "  .\dev.ps1 Docker-Run-Env http://localhost:8080 8080"
    Write-Host "  .\dev.ps1 Container-Update-Config http://localhost:8080"
    Write-Host "  .\dev.ps1 Test-Coverage"
    Write-Host ""
}

# Main execution
if ($args.Count -eq 0) {
    Show-Help
} else {
    $command = $args[0]
    $additionalArgs = $args[1..($args.Length-1)]
    
    switch ($command) {
        "Setup" { Setup }
        "Install" { Install }
        "Update" { Update }
        "Serve" { Serve }
        "Serve-Port" { Serve-Port @additionalArgs }
        "Build" { Build }
        "Build-Prod" { Build-Prod }
        "Test" { Test }
        "Test-Coverage" { Test-Coverage }
        "Lint" { Lint }
        "Format" { Format }
        "Version-Set" { Version-Set }
        "Version-Check" { Version-Check }
        "Docker-Build" { Docker-Build }
        "Docker-Build-Tag" { Docker-Build-Tag @additionalArgs }
        "Docker-Run" { Docker-Run }
        "Docker-Run-Env" { Docker-Run-Env @additionalArgs }
        "Docker-Stop" { Docker-Stop }
        "Container-Update-Config" { Container-Update-Config @additionalArgs }
        "Container-View-Config" { Container-View-Config }
        "Clean" { Clean }
        "Clean-All" { Clean-All }
        "Analyze-Bundle" { Analyze-Bundle }
        "Dependencies-Check" { Dependencies-Check }
        "Dependencies-Audit" { Dependencies-Audit }
        "Dependencies-Fix" { Dependencies-Fix }
        "Info" { Info }
        "Help" { Show-Help }
        default { 
            Write-Host "Unknown command: $command" -ForegroundColor Red
            Write-Host "Run '.\dev.ps1 Help' to see available commands" -ForegroundColor Yellow
        }
    }
}
