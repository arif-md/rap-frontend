const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

// Get version from package.json and git info
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const buildDate = new Date().toISOString();
const isCI = !!process.env.CI || !!process.env.GITHUB_ACTIONS;

let gitInfo, envName, buildVersion;

if (isCI) {
  // CI/CD environment (GitHub Actions)
  gitInfo = {
    sha: process.env.GITHUB_SHA,
    ref: process.env.GITHUB_REF_NAME || 'main',
    isDirty: false,
    shortSha: process.env.GITHUB_SHA ? process.env.GITHUB_SHA.substring(0, 8) : 'unknown'
  };
  envName = process.env.AZURE_ENV_NAME || 'ci';
  buildVersion = `${packageJson.version}-${gitInfo.shortSha}`;
} else {
  // Local development environment
  gitInfo = getGitInfo();
  envName = 'local';
  const dirtyFlag = gitInfo.isDirty ? '-dirty' : '';
  buildVersion = `${packageJson.version}-${gitInfo.shortSha}${dirtyFlag}`;
}

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
  isCI: isCI,
  buildType: isCI ? 'ci' : 'local'
};

// Write to assets for runtime access
const assetsDir = path.join(__dirname, '..', 'src', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

fs.writeFileSync(
  path.join(assetsDir, 'runtime-config.json'),
  JSON.stringify(versionInfo, null, 2)
);

console.log('Version info written:', {
  buildVersion: versionInfo.buildVersion,
  environment: versionInfo.appEnvName,
  buildType: versionInfo.buildType,
  isDirty: versionInfo.isDirty
});