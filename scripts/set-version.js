const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load environment variables from .env file (if exists)
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Helper function to safely execute git commands
function getGitInfo() {
  try {
    const gitSha = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    const gitRef = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
    const isDirty = gitStatus.length > 0;
    
    return {
      sha: gitSha,
      ref: gitRef,
      isDirty: isDirty,
      shortSha: gitSha.substring(0, 8)
    };
  } catch (error) {
    console.warn('Git not available or not in a git repository, using fallback values');
    return {
      sha: 'unknown',
      ref: 'unknown',
      isDirty: false,
      shortSha: 'unknown'
    };
  }
}

// Detect if running in CI/CD environment
function isCI() {
  return !!(process.env.CI || process.env.GITHUB_ACTIONS);
}

// Get git information based on environment
function getEnvironmentGitInfo() {
  if (isCI()) {
    // CI/CD environment - use environment variables
    const sha = process.env.GITHUB_SHA || 'unknown';
    return {
      sha: sha,
      ref: process.env.GITHUB_REF_NAME || 'main',
      isDirty: false, // CI builds are always clean
      shortSha: sha !== 'unknown' ? sha.substring(0, 8) : 'unknown'
    };
  } else {
    // Local development - use git commands
    return getGitInfo();
  }
}

// Generate build version string
function generateBuildVersion(packageVersion, gitInfo, envType) {
  const dirtyFlag = (envType === 'local' && gitInfo.isDirty) ? '-dirty' : '';
  return `${packageVersion}-${gitInfo.shortSha}${dirtyFlag}`;
}

// Main execution
function main() {
  // Get version from package.json
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const buildDate = new Date().toISOString();
  const ciEnvironment = isCI();
  
  // Get git information
  const gitInfo = getEnvironmentGitInfo();
  
  // Determine environment name
  const envName = ciEnvironment ? (process.env.AZURE_ENV_NAME || 'ci') : 'local';
  
  // Generate build version
  const buildVersion = generateBuildVersion(packageJson.version, gitInfo, envName);
  
  // Create comprehensive version info
  const versionInfo = {
    version: packageJson.version,
    buildVersion: buildVersion,
    gitSha: gitInfo.sha,
    gitRef: gitInfo.ref,
    shortSha: gitInfo.shortSha,
    isDirty: gitInfo.isDirty,
    buildDate: buildDate,
    buildTimestamp: Date.now(),
    appEnvName: envName,
    isCI: ciEnvironment,
    buildType: ciEnvironment ? 'ci' : 'local',
    apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:8080',
    jwtAccessTokenExpirationMinutes: parseInt(process.env.JWT_ACCESS_TOKEN_EXPIRATION_MINUTES || '15', 10),
    jwtRefreshTokenExpirationDays: parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRATION_DAYS || '7', 10)
  };

  // Ensure assets directory exists
  const assetsDir = path.join(__dirname, '..', 'src', 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  // Write version info to assets
  fs.writeFileSync(
    path.join(assetsDir, 'runtime-config.json'),
    JSON.stringify(versionInfo, null, 2)
  );

  // Log summary
  console.log('Version info written:', {
    buildVersion: versionInfo.buildVersion,
    environment: versionInfo.appEnvName,
    buildType: versionInfo.buildType,
    isDirty: versionInfo.isDirty
  });
}

// Execute if called directly
if (require.main === module) {
  main();
}

module.exports = { main, getGitInfo, isCI, generateBuildVersion };