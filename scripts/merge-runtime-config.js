#!/usr/bin/env node

/**
 * Runtime Configuration Merger
 * 
 * This script merges build-time version information with runtime environment variables
 * to create the final runtime-config.json file that the Angular app reads.
 * 
 * Usage: node merge-runtime-config.js [output-path]
 */

const fs = require('fs');
const path = require('path');

function mergeRuntimeConfig(outputPath) {
    // Default output path
    outputPath = outputPath || '/usr/share/nginx/html/assets/runtime-config.json';
    
    // Runtime environment configuration (takes precedence)
    const runtimeConfig = {
        appEnv: process.env.AZURE_ENV_NAME || 'local',
        appEnvName: process.env.AZURE_ENV_NAME || 'Local',
        buildVersion: process.env.APP_VERSION || '0.0.1-SNAPSHOT',
        apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:8080',
        jwtAccessTokenExpirationMinutes: parseInt(process.env.JWT_ACCESS_TOKEN_EXPIRATION_MINUTES || '15', 10),
        jwtRefreshTokenExpirationDays: parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRATION_DAYS || '7', 10),
        _runtimeGenerated: true,
        _generatedAt: new Date().toISOString()
    };

    let finalConfig = runtimeConfig;

    // Try to load existing build-time configuration
    try {
        if (fs.existsSync(outputPath)) {
            console.log('[merge] Found existing runtime config, preserving build-time version info');
            const buildTimeConfig = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
            
            // Merge build-time config with runtime config
            // Runtime config takes precedence for overlapping keys
            finalConfig = {
                ...buildTimeConfig,
                ...runtimeConfig
            };
            
            console.log('[merge] Successfully merged build-time and runtime configuration');
        } else {
            console.log('[merge] No existing runtime config found, using runtime-only configuration');
        }
    } catch (error) {
        console.warn('[merge] Failed to read existing config, using runtime-only configuration:', error.message);
        finalConfig = runtimeConfig;
    }

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write the final configuration
    try {
        fs.writeFileSync(outputPath, JSON.stringify(finalConfig, null, 2));
        console.log('[merge] Wrote runtime config to:', outputPath);
        console.log('[merge] Environment:', finalConfig.appEnvName);
        console.log('[merge] Build Version:', finalConfig.buildVersion);
        console.log('[merge] API Base URL:', finalConfig.apiBaseUrl || 'not set');
        
        // Show git info if available
        if (finalConfig.gitSha) {
            console.log('[merge] Git SHA:', finalConfig.shortSha || finalConfig.gitSha.substring(0, 8));
            console.log('[merge] Git Ref:', finalConfig.gitRef);
            console.log('[merge] Is Dirty:', finalConfig.isDirty || false);
        }
        
        return true;
    } catch (error) {
        console.error('[merge] Failed to write runtime config:', error.message);
        return false;
    }
}

// Execute if called directly
if (require.main === module) {
    const outputPath = process.argv[2];
    const success = mergeRuntimeConfig(outputPath);
    process.exit(success ? 0 : 1);
}

module.exports = { mergeRuntimeConfig };