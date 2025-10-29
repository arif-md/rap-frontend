#!/bin/bash

# Local Development Build and Test Script
echo "🚀 Local Development Build Script"
echo "=================================="

# Check if git is available
if ! command -v git &> /dev/null; then
    echo "❌ Git is not available. Some version info will be limited."
fi

# Check git status
if git rev-parse --git-dir > /dev/null 2>&1; then
    echo "📂 Repository: $(git remote get-url origin 2>/dev/null || echo 'Local repository')"
    echo "🌿 Branch: $(git rev-parse --abbrev-ref HEAD)"
    echo "📝 Commit: $(git rev-parse --short HEAD)"
    
    # Check for uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        echo "⚠️  Warning: You have uncommitted changes"
        echo "   This will be reflected in the version display"
        git status --short
    else
        echo "✅ Working directory is clean"
    fi
else
    echo "❌ Not in a git repository"
fi

echo ""
echo "🔨 Building application..."

# Generate version info
npm run set-version

if [ $? -eq 0 ]; then
    echo "✅ Version info generated successfully"
    
    # Show generated version info
    if [ -f "src/assets/runtime-config.json" ]; then
        echo "📋 Generated version info:"
        cat src/assets/runtime-config.json | head -10
    fi
else
    echo "❌ Failed to generate version info"
    exit 1
fi

echo ""
echo "🐳 Choose build type:"
echo "1) Local development server (npm start)"
echo "2) Production build (npm run build:prod)"
echo "3) Docker build (npm run docker:build)"
echo "4) Full Docker build and run (npm run docker:build && npm run docker:run)"

read -p "Enter choice [1-4]: " choice

case $choice in
    1)
        echo "🖥️ Starting development server..."
        npm start
        ;;
    2)
        echo "🏗️ Building for production..."
        npm run build:prod
        echo "✅ Build complete! Check dist/ folder"
        ;;
    3)
        echo "🐳 Building Docker image..."
        npm run docker:build
        echo "✅ Docker image built as 'frontend-local'"
        echo "💡 Run with: npm run docker:run"
        ;;
    4)
        echo "🐳 Building and running Docker container..."
        npm run docker:build && npm run docker:run
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac