#!/usr/bin/env node

/**
 * Local Docker Build Script
 * 
 * Builds Docker image with proper APP_VERSION from generated runtime config
 */

const fs = require('fs');
const { execSync } = require('child_process');

function buildDockerImage() {
    const runtimeConfigPath = 'src/assets/runtime-config.json';
    let appVersion = 'unknown';

    // Try to read the build version from runtime config
    try {
        if (fs.existsSync(runtimeConfigPath)) {
            const runtimeConfig = JSON.parse(fs.readFileSync(runtimeConfigPath, 'utf8'));
            appVersion = runtimeConfig.buildVersion || appVersion;
            console.log('[docker-build] Found runtime config, using build version:', appVersion);
        } else {
            console.warn('[docker-build] No runtime config found, using default version:', appVersion);
        }
    } catch (error) {
        console.warn('[docker-build] Failed to read runtime config, using default version:', appVersion);
        console.warn('[docker-build] Error:', error.message);
    }

    // Build Docker image with APP_VERSION build arg
    const buildCommand = `docker build --build-arg APP_VERSION="${appVersion}" -t frontend-local .`;
    
    console.log('[docker-build] Building Docker image with command:');
    console.log('[docker-build]', buildCommand);
    
    try {
        execSync(buildCommand, { stdio: 'inherit' });
        console.log('[docker-build] ✅ Docker image built successfully as "frontend-local"');
        console.log('[docker-build] 💡 Run with: npm run docker:run');
        return true;
    } catch (error) {
        console.error('[docker-build] ❌ Docker build failed:', error.message);
        return false;
    }
}

// Execute if called directly
if (require.main === module) {
    const success = buildDockerImage();
    process.exit(success ? 0 : 1);
}

module.exports = { buildDockerImage };