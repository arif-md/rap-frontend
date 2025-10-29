# Local Development Build and Test Script
Write-Host "🚀 Local Development Build Script" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green

# Check if git is available
try {
    $null = git --version
    $gitAvailable = $true
} catch {
    Write-Host "❌ Git is not available. Some version info will be limited." -ForegroundColor Red
    $gitAvailable = $false
}

# Check git status
if ($gitAvailable) {
    try {
        $repoUrl = git remote get-url origin 2>$null
        if (-not $repoUrl) { $repoUrl = "Local repository" }
        $branch = git rev-parse --abbrev-ref HEAD
        $commit = git rev-parse --short HEAD
        
        Write-Host "📂 Repository: $repoUrl" -ForegroundColor Cyan
        Write-Host "🌿 Branch: $branch" -ForegroundColor Cyan
        Write-Host "📝 Commit: $commit" -ForegroundColor Cyan
        
        # Check for uncommitted changes
        $status = git status --porcelain
        if ($status) {
            Write-Host "⚠️  Warning: You have uncommitted changes" -ForegroundColor Yellow
            Write-Host "   This will be reflected in the version display" -ForegroundColor Yellow
            git status --short
        } else {
            Write-Host "✅ Working directory is clean" -ForegroundColor Green
        }
    } catch {
        Write-Host "❌ Not in a git repository" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🔨 Building application..." -ForegroundColor Yellow

# Generate version info
npm run set-version

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Version info generated successfully" -ForegroundColor Green
    
    # Show generated version info
    if (Test-Path "src/assets/runtime-config.json") {
        Write-Host "📋 Generated version info:" -ForegroundColor Cyan
        Get-Content "src/assets/runtime-config.json" | Select-Object -First 10
    }
} else {
    Write-Host "❌ Failed to generate version info" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🐳 Choose build type:" -ForegroundColor Yellow
Write-Host "1) Local development server (npm start)"
Write-Host "2) Production build (npm run build:prod)"
Write-Host "3) Docker build (npm run docker:build)"
Write-Host "4) Full Docker build and run (npm run docker:build && npm run docker:run)"

$choice = Read-Host "Enter choice [1-4]"

switch ($choice) {
    "1" {
        Write-Host "🖥️ Starting development server..." -ForegroundColor Green
        npm start
    }
    "2" {
        Write-Host "🏗️ Building for production..." -ForegroundColor Green
        npm run build:prod
        Write-Host "✅ Build complete! Check dist/ folder" -ForegroundColor Green
    }
    "3" {
        Write-Host "🐳 Building Docker image..." -ForegroundColor Green
        npm run docker:build
        Write-Host "✅ Docker image built as 'frontend-local'" -ForegroundColor Green
        Write-Host "💡 Run with: npm run docker:run" -ForegroundColor Cyan
    }
    "4" {
        Write-Host "🐳 Building and running Docker container..." -ForegroundColor Green
        npm run docker:build
        if ($LASTEXITCODE -eq 0) {
            npm run docker:run
        }
    }
    default {
        Write-Host "❌ Invalid choice" -ForegroundColor Red
        exit 1
    }
}